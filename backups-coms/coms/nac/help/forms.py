import floppyforms as forms

from customers.models import Customer


class HelpContentForm(forms.Form):
    def __init__(self, *args, **kwargs):
        super(HelpContentForm, self).__init__(*args, **kwargs)
