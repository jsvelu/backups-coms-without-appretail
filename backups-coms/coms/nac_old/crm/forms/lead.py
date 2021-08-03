import floppyforms.__future__ as forms

from customers.models import Customer


class LeadForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['first_name', 'last_name', 'email', 'phone1', 'phone2', 'partner_name',
                  'appointed_dealer', 'acquisition_source', 'source_of_awareness', 'customer_status',
                  'lead_series', 'model_type']

    def __init__(self, *args, **kwargs):
        dealership_choices = kwargs.pop('dealership_choices')
        super(LeadForm, self).__init__(*args, **kwargs)
        self.fields["appointed_dealer"].choices = dealership_choices
