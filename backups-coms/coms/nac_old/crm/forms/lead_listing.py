from django import forms


class LeadListingForm(forms.Form):
    your_name = forms.CharField(label='Your name', max_length=100)
