from django.conf import settings
#from django.conf.urls import patterns
from django.conf.urls import url
from django.contrib.auth.decorators import permission_required
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from crm.views.add_activity import AddActivityView
from crm.views.add_lead import AddLeadView
from crm.views.edit_lead import EditLeadView
from crm.views.email_broadcast import EmailBroadcastView
from crm.views.email_broadcast import EmailTemplateView
from crm.views.lead_listing import LeadListingView
from crm.views.portal_invitation import PortalInvitesView
from crm.views.view_activity import ViewActivityView

app_name = 'crm'

urlpatterns = [
    url(r'^$', LeadListingView.as_view(), name="lead_listing"),
    url(r'^activity/add/(?P<customer_id>[0-9]+)', AddActivityView.as_view(), name="add_activity"),
    url(r'^activity/view/(?P<activity_id>[0-9]+)', ViewActivityView.as_view(), name="view_activity"),
    url(r'^customer/$', AddLeadView.as_view(), name="add_lead"),
    url(r'^customer/(?P<customer_id>[0-9]+)', EditLeadView.as_view(), name="edit_lead"),
    url(r'^eb/', EmailBroadcastView.as_view(), name="email_broadcast"),
    url(r'^get_email_template/', EmailTemplateView.as_view()),
    url(r'^invite_customer/', PortalInvitesView.as_view(), name="invite_customer"),
]
