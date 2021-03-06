import linecache
import sys
import urllib.request, urllib.parse, urllib.error
from urllib import parse as urlparse

from django.contrib import messages
from django.http.response import HttpResponseRedirect
from django.template import Context
from django.template.loader import get_template
from django.utils import timezone
from django.views.generic.edit import FormView
from rules.contrib.views import PermissionRequiredMixin

from crm.models import LeadActivity
from emails import utils
from orders.models import Order
from portal.models import PortalImageCollection


class PortalInvitesView(PermissionRequiredMixin, FormView):
    permission_required = 'customers.list_customer'

    def post(self, request, *args, **kwargs):
        url_params = urlparse.parse_qs(urlparse.urlparse(request.get_full_path()).query)
        order_id = request.POST['invite_customer']
        customer = Order.objects.get(id=order_id).customer
        image_collection = PortalImageCollection.objects.get(build_id=order_id)
        email_body = "<p>Dear %s %s</p><p>You can now view the progress of your carvan build at the following web address:</p><p>%s</p><p>Sincerely<br/>New Age Caravans" % (
            customer.first_name, customer.last_name,
            request.build_absolute_uri('../../portal/view/%s/' % (image_collection.url_hash)))

        html_body = get_template('email_html_template.html').render(Context({
            'recipient': customer.first_name,
            'message': email_body
        }))

        try:
            utils.send_mandrill_email(None, html_body, customer.email, customer.name,
                                      "View the progress of your Caravan online!", email_body, None, request.user)

            lead_activity = LeadActivity(creator=request.user, customer=customer,
                                         lead_activity_type=LeadActivity.LEAD_ACTIVITY_TYPE_EMAIL,
                                         activity_time=timezone.now(), followup_date=None,
                                         followup_reminder_sent_time=None, new_customer_status=customer.customer_status,
                                         notes=email_body)
            lead_activity.save()
            messages.add_message(request, messages.INFO,
                                 'Portal access URL has been sent to Customer %s %s by email' % (
                                     customer.first_name, customer.last_name))
        except:
            self.print_exception()
            messages.add_message(request, messages.INFO,
                                 'Unable to send portal access URL to Customer %s %s by email' % (
                                     customer.first_name, customer.last_name))

        return HttpResponseRedirect('../' + '?' + urllib.parse.urlencode(url_params, True))

    def print_exception(self):
        exception_type, exception_object, trace_back = sys.exc_info()
        frame = trace_back.tb_frame
        line_number = trace_back.tb_lineno
        filename = frame.f_code.co_filename
        linecache.checkcache(filename)
        line = linecache.getline(filename, line_number, frame.f_globals)
        print ('EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, line_number, line.strip(), exception_object))
