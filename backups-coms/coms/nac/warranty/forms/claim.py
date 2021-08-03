import floppyforms as forms

from customers.models import Customer


class WarrantyClaimForm(forms.Form):
    item = forms.CharField(label='Item', required=True)
    issue = forms.CharField(label='Issue', required=True)

    def __init__(self, *args, **kwargs):
        super(WarrantyClaimForm, self).__init__(*args, **kwargs)


class WarrantyEditClaimForm(forms.Form):
    def __init__(self, *args, **kwargs):
        super(WarrantyEditClaimForm, self).__init__(*args, **kwargs)
