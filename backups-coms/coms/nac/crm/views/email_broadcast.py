import base64
import datetime
import operator
import re
import string
import urllib.request, urllib.parse, urllib.error
from urllib import parse as urlparse

from django.conf import settings
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models.query_utils import Q
from django.http.response import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.template import Context
from django.template.loader import get_template
from django.utils import timezone
from django.views.generic.edit import FormView
from django_tables2.config import RequestConfig
import mandrill
import pytz
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rules.contrib.views import PermissionRequiredMixin
from tzlocal import get_localzone

from crm.forms.customer_filter import CustomerFilterForm
from crm.models import BroadcastEmailAttachment
from crm.models import LeadActivity
from crm.tables import CustomerTable
from customers.models import Customer
from dealerships.models import Dealership
from emails import utils
from emails.models import EmailTemplate
from functools import reduce


class EmailBroadcastView(PermissionRequiredMixin, FormView):
    template_name = 'crm/email_broadcast.html'
    form_class = CustomerFilterForm
    success_url = '/thanks/'
    raise_exception = True
    permission_required = 'customers.broadcast_email'

    def get_filtered_customers(self, get_params):
        customers = None
        allowed_dealerships = self.get_allowed_dealerships()

        if get_params.getlist('dealership') and len(get_params.getlist('dealership')[0].strip()) > 0:
            allowed_dealerships = allowed_dealerships.filter(id__in=get_params.getlist('dealership'))

        allowed_dealership_ids = [allowed_dealership.id for allowed_dealership in allowed_dealerships]

        if self.request.user.has_perm('crm.broadcast_email_to_all_leads'):
            customers = Customer.objects.filter(appointed_dealer_id__in=allowed_dealership_ids)

        elif self.request.user.has_perm('crm.email_broadcast_self_and_dealership_leads_only'):
            dealership_filter_q_objects = []

            for allowed_dealership in allowed_dealerships:
                if allowed_dealership.dealershipuserdealership_set.get(
                        dealership_user__user_ptr_id=self.request.user.id).is_principal:
                    dealership_filter_q_objects.append(Q(appointed_dealer=allowed_dealership))
                else:
                    dealership_filter_q_object = Q(appointed_dealer=allowed_dealership)
                    dealership_filter_q_object.add(Q(appointed_rep__id=self.request.user.id), Q.AND)
                    dealership_filter_q_objects.append(dealership_filter_q_object)

            customers = Customer.objects.filter(reduce(operator.or_, dealership_filter_q_objects))

        if get_params.get('customer_id'):
            customers = customers.filter(id=get_params.get('customer_id'))

        if get_params.get('customer_name'):
            customers = customers.filter(Q(first_name=get_params.get('customer_name')) |
                                         Q(last_name=get_params.get('customer_name')))

        if get_params.getlist('customer_statuses'):
            customers = customers.filter(customer_status__id__in=get_params.getlist('customer_statuses'))

        if get_params.getlist('states'):
            customers = customers.filter(physical_address__suburb__post_code__state_id__in=get_params.getlist('states'))

        if get_params.getlist('model_series'):
            customers = customers.filter(lead_series_id__in=get_params.getlist('model_series'))

        for customer in customers:
            customer.order_id = None
            latest_activity = LeadActivity.objects.filter(customer=customer).order_by('-activity_time').first()
            if latest_activity is not None:
                latest_activity.type_string = dict(LeadActivity.LEAD_ACTIVITY_TYPE_CHOICES)[
                    latest_activity.lead_activity_type]
            customer.latest_activity = latest_activity

        return customers

    def get_initial(self):
        initial = super(EmailBroadcastView, self).get_initial()
        initial['customer_id'] = self.request.GET.get('customer_id')
        initial['customer_name'] = self.request.GET.get('customer_name')
        initial['customer_statuses'] = self.request.GET.getlist('customer_statuses')
        initial['states'] = self.request.GET.getlist('states')
        initial['model_series'] = self.request.GET.getlist('model_series')
        initial['dealership'] = self.request.GET.getlist('dealership')

        return initial

    def get_allowed_dealerships(self):
        dealer_choices = []
        if self.request.user.has_perm('crm.email_broadcast_self_and_dealership_leads_only'):
            dealer_choices = Dealership.objects.filter(dealershipuser=self.request.user)

        if self.request.user.has_perm('crm.manage_all_leads'):
            dealer_choices = Dealership.objects.all()

        return dealer_choices

    def get_form_kwargs(self):
        kwargs = super(EmailBroadcastView, self).get_form_kwargs()
        dealer_choices = [(dealership.id, dealership.name) for dealership in self.get_allowed_dealerships()]
        kwargs['dealership_choices'] = dealer_choices
        return kwargs

    def get_context_data(self, **kwargs):
        data = super(EmailBroadcastView, self).get_context_data(**kwargs)

        customers = self.get_filtered_customers(self.request.GET)

        customer_table = CustomerTable(customers)
        customer_table.exclude = ('first_name',)

        RequestConfig(self.request, paginate={'page': self.request.GET.get('page', 1), 'per_page': 50}).configure(
            customer_table)
        data['customer_table'] = customer_table
        data['customer_emails_str'] = ",".join(str(customer.email) for customer in customers)

        data['sub_heading'] = 'Email Broadcast'
        data['email_templates'] = EmailTemplate.objects.order_by('name')
        data['attachment_list'] = BroadcastEmailAttachment.objects.order_by('name')

        if self.request.GET.get('attachment_id'):
            data['selected_attachment_id'] = int(self.request.GET.get('attachment_id'))

        if self.request.GET.get('email_subject'):
            data['email_subject'] = self.request.GET.get('email_subject')

        if self.request.GET.get('email_body'):
            data['email_body'] = self.request.GET.get('email_body')

        data['help_code'] = 'email_broadcast'
        return data

    def post(self, request, *args, **kwargs):

        url_params = urlparse.parse_qs(urlparse.urlparse(request.get_full_path()).query)
        url_params["email_body"] = request.POST.get('email_body')
        url_params["email_subject"] = request.POST.get('email_subject')
        url_params["attachment_id"] = request.POST.get('broadcast_attachments')

        customers = self.get_filtered_customers(self.request.GET)

        if len(self.request.FILES) > 0:
            broadcast_email_attachment = BroadcastEmailAttachment()
            broadcast_email_attachment.name = list(self.request.FILES.values())[0].name
            broadcast_email_attachment.file = list(self.request.FILES.values())[0]
            broadcast_email_attachment.mime_type = list(self.request.FILES.values())[0].content_type
            broadcast_email_attachment.save()
            url_params["attachment_id"] = str(broadcast_email_attachment.pk)

        broadcast_attachment = None
        if self.request.POST.get('send_email'):
            attachments = None
            if request.POST.get('broadcast_attachments'):
                broadcast_attachment = BroadcastEmailAttachment.objects.get(
                    pk=request.POST.get('broadcast_attachments'))
                attachments = [{'content': base64.b64encode(broadcast_attachment.file.read()),
                                'name': broadcast_attachment.name,
                                'type': broadcast_attachment.mime_type}]

            email_body = request.POST.get('email_body')
            if not email_body.strip():
                messages.add_message(request, messages.ERROR, "Please specify the email content.")
                return HttpResponseRedirect(request.path + '?' + urllib.parse.urlencode(url_params, True))

            email_body_substitutions = re.findall(r'%%.+?%%', email_body)

            success_message = ""
            count_email_addresses = len(customers)

            send_time = None
            not_sent_count = 0
            if request.POST.get('schedule_selection') == 'now' or request.POST.get('schedule_selection') == 'time':
                for customer in customers:

                    try:
                        validate_email(customer.email)
                    except ValidationError:
                        # not a valid email
                        not_sent_count += 1

            if request.POST.get('schedule_selection') == 'time':
                send_time = datetime.datetime.strptime(request.POST.get('schedule_date_time'), settings.FORMAT_DATETIME)
                local_tz = get_localzone()

                local_date_time = local_tz.localize(send_time, is_dst=None)
                utc_date_time = local_date_time.astimezone(pytz.utc)

                local_send_time = send_time.strftime(settings.FORMAT_DATETIME)
                send_time = utc_date_time.strftime(settings.FORMAT_DATETIME)

                success_message = "%d %s selected. %d %s scheduled for delivery on %s." % (
                count_email_addresses, ("recipient" if count_email_addresses == 1 else "recipients"),
                (count_email_addresses - not_sent_count),
                (" email" if (count_email_addresses - not_sent_count) == 1 else " emails"), local_send_time)

            elif request.POST.get('schedule_selection') == 'now':
                success_message = "%d %s selected. %d %s sent." % (
                count_email_addresses, ("recipient" if count_email_addresses == 1 else "recipients"),
                (count_email_addresses - not_sent_count),
                (" email" if (count_email_addresses - not_sent_count) == 1 else " emails"))

            elif request.POST.get('schedule_selection') == 'test':
                try:
                    validate_email(request.POST.get('test_recipient'))
                    success_message = "Test email sent to " + request.POST.get('test_recipient') + "."
                    email_addresses = [request.POST.get('test_recipient')]
                except ValidationError:
                    messages.add_message(request, messages.ERROR, "Invalid test email provided")
                    return HttpResponseRedirect(request.path + '?' + urllib.parse.urlencode(url_params, True))

            if request.POST.get('schedule_selection') == 'test':
                customers = [Customer(first_name='Test', last_name='User', email=request.POST.get('test_recipient'))]

            for customer in customers:

                try:
                    validate_email(customer.email)
                except ValidationError:
                    continue

                for substitution in email_body_substitutions:
                    if substitution == "%%lead_first_name%%":
                        email_body = string.replace(email_body, substitution, customer.first_name)
                    elif substitution == "%%sales_rep_name%%":

                        email_body = string.replace(email_body, substitution,
                                                    "The Sales Team" if customer.appointed_rep is None else customer.appointed_rep.name)
                    elif substitution == "%%dealership_name%%":
                        email_body = string.replace(email_body, substitution,
                                                    "New Age Caravans" if customer.appointed_dealer is None else customer.appointed_dealer.name)
                    else:
                        messages.add_message(request, messages.ERROR, "Unknown email parameter " + substitution +
                                             ". Please rectify this in order to send email.")

                        return HttpResponseRedirect(request.path + '?' + urllib.parse.urlencode(url_params, True))

                html_body = get_template('email_html_template.html').render(Context({
                    'recipient': customer.first_name,
                    'message': email_body
                }))

                try:
                    utils.send_mandrill_email(attachments, html_body, customer.email, customer.name,
                                              request.POST.get('email_subject'), email_body, send_time, request.user)
                except mandrill.PaymentRequiredError as pre:
                    messages.add_message(request, messages.ERROR, "Mandrill Error: " + pre.message)
                    return HttpResponseRedirect(request.path + '?' + urllib.parse.urlencode(url_params, True))

                if request.POST.get('schedule_selection') != 'test':
                    lead_activity = LeadActivity()
                    lead_activity.customer = customer
                    lead_activity.creator = request.user
                    lead_activity.lead_activity_type = LeadActivity.LEAD_ACTIVITY_TYPE_EMAIL
                    lead_activity.activity_time = timezone.now()
                    lead_activity.followup_date = (lead_activity.activity_time + datetime.timedelta(days=3)).date()
                    lead_activity.new_customer_status = customer.customer_status
                    lead_activity.notes = "Email body: " + email_body + (
                        ", Attachment file id: " + str(broadcast_attachment.pk) if broadcast_attachment else "")
                    lead_activity.save()

            messages.add_message(request, messages.INFO, success_message)

        return HttpResponseRedirect(request.path + '?' + urllib.parse.urlencode(url_params, True))


class EmailTemplateView(APIView):
    permission_required = 'customers.broadcast_email'

    def get(self, request, *args, **kwargs):
        email_template = get_object_or_404(EmailTemplate.objects, id=request.GET.get('id'))
        return Response({"subject": email_template.subject, "message": email_template.message})
