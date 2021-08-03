from django.urls import reverse_lazy
from django.views.generic.edit import FormView
from django_tables2 import RequestConfig
from rules.contrib.views import PermissionRequiredMixin

from crm.forms.lead import LeadForm
from crm.models import LeadActivity
from crm.tables import LeadActivityTable
from customers.models import Customer
from dealerships.models import Dealership


class EditLeadView(PermissionRequiredMixin, FormView):
    template_name = 'crm/edit_lead.html'
    form_class = LeadForm
    success_url = reverse_lazy('crm:lead_listing')
    raise_exception = True
    permission_required = 'customers.change_customer'

    def get_allowed_dealerships(self):
        dealer_choices = None
        if self.request.user.has_perm('customers.manage_self_and_dealership_leads_only'):
            dealer_choices = Dealership.objects.filter(dealershipuser=self.request.user)

        if self.request.user.has_perm('crm.manage_all_leads'):
            dealer_choices = Dealership.objects.all()

        return dealer_choices

    def get_form_kwargs(self):
        customer_id = self.kwargs.get('customer_id')
        self.customer_id = customer_id
        self.customer = Customer.objects.get(id=customer_id)
        kwargs = {
            'instance': self.customer,
        }
        dealer_choices = [(dealership.id, dealership.name) for dealership in self.get_allowed_dealerships()]
        kwargs.update({'dealership_choices': dealer_choices})
        if self.request.method == 'POST':
            kwargs['data'] = self.request.POST
        return kwargs

    def get_context_data(self, **kwargs):
        context = super(EditLeadView, self).get_context_data(**kwargs)
        context['customer_id'] = self.customer_id

        activity_list = LeadActivity.objects.filter(customer_id=self.customer_id)
        for activity in activity_list:
            activity.type_string = dict(LeadActivity.LEAD_ACTIVITY_TYPE_CHOICES)[activity.lead_activity_type]

        activity_table = LeadActivityTable(activity_list)
        RequestConfig(self.request, paginate={"page": self.request.GET.get('page', 1), "per_page": 5}).configure(activity_table)
        context['activity_table'] = activity_table
        context['sub_heading'] = 'Edit Lead: %s' % (self.customer.first_name, )
        return context

    def form_invalid(self, form):
        return super(EditLeadView, self).form_invalid(form)

    def form_valid(self, form):
        form.save()
        return super(EditLeadView, self).form_valid(form)
