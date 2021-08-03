import floppyforms as forms


class BomForm(forms.Form):
    start_date = forms.DateField(label='Start Date', required=True)
    end_date = forms.DateField(label='End Date', required=True)

    def __init__(self, *args, **kwargs):
        super(BomForm, self).__init__(*args, **kwargs)
