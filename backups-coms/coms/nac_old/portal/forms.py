import floppyforms as forms


class PhotoManagerForm(forms.Form):
    hdn_pic_data = forms.CharField()

    def __init__(self, *args, **kwargs):
        super(PhotoManagerForm, self).__init__(*args, **kwargs)
