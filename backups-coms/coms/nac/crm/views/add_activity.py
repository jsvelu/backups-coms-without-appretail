from authtools.models import User
from django.urls import reverse
from django.utils import timezone
from django.views.generic.edit import FormView
from rules.contrib.views import PermissionRequiredMixin

from crm.forms.add_activity import AddActivityForm
from customers.models import Customer


class AddActivityView(PermissionRequiredMixin, FormView):
    template_name = 'crm/add_activity.html'
    form_class = AddActivityForm
    raise_exception = True
    permission_required = 'customers.add_customer'

    def get_context_data(self, **kwargs):
        context = super(AddActivityView, self).get_context_data(**kwargs)
        customer_id = self.kwargs.get('customer_id')
        customer = Customer.objects.get(id=customer_id)
        context['customer_id'] = customer_id
        context['sub_heading'] = 'Add Activity for %s (%s)' % (customer.first_name, customer.email)
        return context

    def get_success_url(self):
        return reverse('crm:edit_lead', kwargs={'customer_id':self.kwargs.get('customer_id')})

    def form_valid(self, form):
        activity = form.save(commit=False)
        activity.creator = self.request.user
        activity.customer_id = self.kwargs.get('customer_id')
        activity.activity_time = timezone.now()
        activity.save()

        #also update the customer's assigned rep
        customer = Customer.objects.get(pk=activity.customer_id)
        customer.appointed_rep = User.objects.get(id=int(form.cleaned_data['dealer_rep']))
        customer.save()
        return super(AddActivityView, self).form_valid(form)
