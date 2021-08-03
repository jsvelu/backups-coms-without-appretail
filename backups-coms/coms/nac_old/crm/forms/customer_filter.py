import floppyforms as forms

from caravans.models import Series
from crm.widgets import CrmFilterWidget
from customers.models import CustomerStatus
from newage.models import State


class CustomerFilterForm(forms.Form):
    customer_id = forms.CharField(label='Customer Id', required=False)
    customer_name = forms.CharField(label='Customer Name', required=False)

    def __init__(self, dealership_choices, *args, **kwargs):

        super(CustomerFilterForm, self).__init__(*args, **kwargs)

        customer_statuses = [(cs.id, cs.name) for cs in CustomerStatus.objects.order_by('name')]
        states = [(s.id, s.name) for s in State.objects.order_by('name')]
        series_list = [(ms.id, ms.name) for ms in Series.objects.order_by('name')]

        self.fields['customer_statuses'] = forms.MultipleChoiceField(
            label='Customer Statuses',
            choices=customer_statuses,
            required=False,
            widget=CrmFilterWidget()
        )
        self.fields['states'] = forms.MultipleChoiceField(
            label='States',
            choices=states,
            required=False,
            widget=CrmFilterWidget()
        )
        self.fields['model_series'] = forms.MultipleChoiceField(
            label='Model Series',
            choices=series_list,
            required=False,
            widget=CrmFilterWidget()
        )
        self.fields['dealership'] = forms.MultipleChoiceField(
            label='Dealership',
            choices=dealership_choices,
            required=False,
            widget=CrmFilterWidget()
        )
