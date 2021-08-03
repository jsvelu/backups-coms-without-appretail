import floppyforms as forms

from caravans.models import Series
from customers.models import CustomerStatus
from newage.models import State
from warranty.models import WarrantyClaim


class WarrantyFilterForm(forms.Form):
    chassis = forms.CharField(label='Chassis No.', required=False)
    customer_name = forms.CharField(label='Customer Name', required=False)


    def __init__(self, dealership_choices, *args, **kwargs):

        super(WarrantyFilterForm, self).__init__(*args, **kwargs)

        warranty_statuses = [(st[0], st[1]) for st in WarrantyClaim.WARRANTY_STATUS_TYPES]
        states = [(s.id, s.name) for s in State.objects.order_by('name')]
        series_list = [(ms.id, ms.name) for ms in Series.objects.order_by('name')]

        self.fields['warranty_statuses'] = forms.MultipleChoiceField(label='Warranty Claim Statuses', choices=warranty_statuses, required=False)
        self.fields['states'] = forms.MultipleChoiceField(label='States', choices=states, required=False)
        self.fields['model_series'] = forms.MultipleChoiceField(label='Model Series', choices=series_list, required=False)
        self.fields['dealership'] = forms.MultipleChoiceField(label='Dealership', choices=dealership_choices, required=False)
