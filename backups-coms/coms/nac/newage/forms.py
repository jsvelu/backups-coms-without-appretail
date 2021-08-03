from django_select2.forms import Select2Widget
import floppyforms as forms

from caravans.models import Model


class LookupForm(forms.Form):
    text = forms.CharField(required=False)
    
    def __init__(self, *args, **kwargs):
        super(LookupForm, self).__init__(*args, **kwargs)

        series = []
        for m in Model.objects.all().order_by('name'):
            if m.series_set.count():
                for s in m.series_set.all().order_by('name'):
                    series.append((s.id, '%s: %s (%s)' % (m.name, s.name, s.code)))

        self.fields['series'] = forms.ChoiceField(
            label='Model/Series',
            choices=series,
            required=False,
            widget=Select2Widget(attrs={'class': 'form-control'}))
