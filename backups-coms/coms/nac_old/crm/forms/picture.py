import floppyforms as forms

from caravans.models import Series
from customers.models import CustomerStatus
from newage.models import State


class PictureForm(forms.Form):
    image_file = forms.FileField()

    def __init__(self, *args, **kwargs):

        super(PictureForm, self).__init__(*args, **kwargs)
