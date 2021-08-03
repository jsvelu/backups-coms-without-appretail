from django.views.generic.base import TemplateView

from crm.models import LeadActivity


class ViewActivityView(TemplateView):
    template_name = 'crm/view_activity.html'

    def get_context_data(self, **kwargs):
        context = super(ViewActivityView, self).get_context_data(**kwargs)
        id = self.kwargs.get('activity_id')
        activity = LeadActivity.objects.get(id=id)
        activity.type_string = dict(LeadActivity.LEAD_ACTIVITY_TYPE_CHOICES)[activity.lead_activity_type]
        context['activity'] = activity
        context['customer_id'] = activity.customer.id
        context['sub_heading'] = 'View Activity for %s (%s)' % (activity.customer.first_name, activity.customer.email)
        return context
