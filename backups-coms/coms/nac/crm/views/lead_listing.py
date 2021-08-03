from itertools import chain
import operator

from django.contrib.auth.decorators import permission_required
from django.core.exceptions import ObjectDoesNotExist
from django.db.models.query_utils import Q
from django.http.response import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.generic.edit import FormView
from django_tables2 import RequestConfig
from rules.contrib.views import PermissionRequiredMixin

from crm.forms.customer_filter import CustomerFilterForm
from crm.models import LeadActivity
from crm.tables import CustomerTable
from customers.models import Customer
from dealerships.models import Dealership
from dealerships.models import DealershipUserDealership
from orders.models import Order
from portal.models import PortalImageCollection
from functools import reduce


class LeadListingView(PermissionRequiredMixin, FormView):
    template_name = 'crm/listing.html'
    form_class = CustomerFilterForm
    success_url = '/thanks/'
    raise_exception = True
    permission_required = 'customers.list_customer'

    def get_initial(self):
        initial = super(LeadListingView, self).get_initial()
        initial['customer_id'] = self.request.GET.get('customer_id')
        initial['customer_name'] = self.request.GET.get('customer_name')
        initial['customer_statuses'] = self.request.GET.getlist('customer_statuses')
        initial['states'] = self.request.GET.getlist('states')
        initial['model_series'] = self.request.GET.getlist('model_series')
        initial['dealership'] = self.request.GET.getlist('dealership')

        return initial

    def get_allowed_dealerships(self):
        dealer_choices = []
        if self.request.user.has_perm('customers.manage_self_and_dealership_leads_only'):
            dealer_choices = Dealership.objects.filter(dealershipuser=self.request.user)

        if self.request.user.has_perm('crm.manage_all_leads'):
            dealer_choices = Dealership.objects.all()

        return dealer_choices

    def get_form_kwargs(self):
        kwargs = super(LeadListingView, self).get_form_kwargs()
        dealer_choices = [(dealership.id, dealership.name) for dealership in self.get_allowed_dealerships()]
        kwargs['dealership_choices'] = dealer_choices
        return kwargs

    def get_context_data(self, **kwargs):
        data = super(LeadListingView, self).get_context_data(**kwargs)

        customers = []
        allowed_dealerships = self.get_allowed_dealerships()

        if self.request.GET.getlist('dealership') and len(self.request.GET.getlist('dealership')[0].strip()) > 0:
            allowed_dealerships = allowed_dealerships.filter(id__in=self.request.GET.getlist('dealership'))

        allowed_dealership_ids = [allowed_dealership.id for allowed_dealership in allowed_dealerships]

        if self.request.user.has_perm('crm.manage_all_leads'):
            customers = Customer.objects.filter(appointed_dealer_id__in=allowed_dealership_ids)

        elif self.request.user.has_perm('customers.manage_self_and_dealership_leads_only'):
            dealership_filter_q_objects = []

            for allowed_dealership in allowed_dealerships:
                if allowed_dealership.dealershipuserdealership_set.get(dealership_user__user_ptr_id=self.request.user.id).is_principal:
                    dealership_filter_q_objects.append(Q(appointed_dealer=allowed_dealership))
                else:
                    dealership_filter_q_object = Q(appointed_dealer=allowed_dealership)
                    dealership_filter_q_object.add(Q(appointed_rep__id=self.request.user.id), Q.AND)
                    dealership_filter_q_objects.append(dealership_filter_q_object)

            customers = Customer.objects.filter(reduce(operator.or_, dealership_filter_q_objects, Q(pk__isnull=True)))

        if self.request.GET.get('customer_id'):
            customers = customers.filter(id=self.request.GET.get('customer_id'))

        if self.request.GET.get('customer_name'):
            customers = customers.filter(Q(first_name=self.request.GET.get('customer_name')) |
                                         Q(last_name=self.request.GET.get('customer_name')))

        if self.request.GET.getlist('customer_statuses'):
            customers = customers.filter(customer_status__id__in=self.request.GET.getlist('customer_statuses'))

        if self.request.GET.getlist('states'):
            customers = customers.filter(physical_address__suburb__post_code__state_id__in=self.request.GET.getlist('states'))

        if self.request.GET.getlist('model_series'):
            customers = customers.filter(lead_series_id__in=self.request.GET.getlist('model_series'))

        for customer in customers:
            latest_activity = LeadActivity.objects.filter(customer=customer).order_by('-activity_time').first()
            if latest_activity is not None:
                latest_activity.type_string = dict(LeadActivity.LEAD_ACTIVITY_TYPE_CHOICES)[latest_activity.lead_activity_type]
            customer.latest_activity = latest_activity

            customer.order_id = None
            customer_order = Order.objects.filter(customer=customer).order_by('created_on').last()
            if customer_order:
                try:
                    customer_image_collection = PortalImageCollection.objects.get(build_id=customer_order.id)
                    if customer_image_collection is not None:
                        customer.order_id = customer_order.id
                except ObjectDoesNotExist:
                    continue


        customer_table = CustomerTable(customers)
        user = self.request.user
        if user.has_perm("customers.change_customer"):
             customer_table.exclude = ('first_name_plain',)
        else:
            customer_table.exclude = ('first_name',)

        RequestConfig(self.request, paginate={'page': self.request.GET.get('page', 1), 'per_page': 50}).configure(customer_table)
        data['customer_table'] = customer_table
        data['customer_emails_str'] = ",".join(str(customer.email) for customer in customers)
        data['sub_heading'] = 'Manage Leads'
        data['help_code'] = 'leads_register'
        return data

    # @method_decorator(permission_required('customers.list_customer'))
    # def dispatch(self, *args, **kwargs):
    #     return super(LeadListingView, self).dispatch(*args, **kwargs)
