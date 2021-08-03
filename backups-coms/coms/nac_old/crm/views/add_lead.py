from authtools.views import resolve_url_lazy
from django.urls import reverse_lazy
from django.views.generic.edit import FormView
from rules.contrib.views import PermissionRequiredMixin

from crm.forms.lead import LeadForm
from customers.models import Customer
from dealerships.models import Dealership


class AddLeadView(PermissionRequiredMixin, FormView):
    template_name = 'crm/add_lead.html'
    form_class = LeadForm
    success_url = reverse_lazy('crm:lead_listing')
    raise_exception = True
    permission_required = 'customers.add_customer'

    def get_allowed_dealerships(self):
        dealer_choices = None
        if self.request.user.has_perm('customers.manage_self_and_dealership_leads_only'):
            dealer_choices = Dealership.objects.filter(dealershipuser=self.request.user)

        if self.request.user.has_perm('crm.manage_all_leads'):
            dealer_choices = Dealership.objects.all()

        return dealer_choices

    def get_form_kwargs(self):
        kwargs = super(AddLeadView, self).get_form_kwargs()
        dealer_choices = [(dealership.id, dealership.name) for dealership in self.get_allowed_dealerships()]
        kwargs.update({'dealership_choices': dealer_choices})
        return kwargs

    def get_context_data(self, **kwargs):
        context = super(AddLeadView, self).get_context_data(**kwargs)
        context['sub_heading'] = 'Add Lead'
        return context

    def form_valid(self, form):
        lead = form.save(commit=False)
        lead.lead_type = Customer.LEAD_TYPE_LEAD
        lead.save()

        return super(AddLeadView, self).form_valid(form)
