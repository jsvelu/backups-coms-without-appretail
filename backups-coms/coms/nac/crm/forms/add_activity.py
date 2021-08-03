from authtools.models import User
import floppyforms.__future__ as forms

from crm.models import LeadActivity
from crm.models import LeadActivityAttachment
from dealerships.models import DealershipUser


class AddActivityForm(forms.ModelForm):
    class Meta:
        model = LeadActivity
        fields = (
            'lead_activity_type',
            'followup_date',
            'new_customer_status',
            'notes',
        )

    def __init__(self, *args, **kwargs):
        dealership_rep_ids = [rep.user_ptr_id for rep in DealershipUser.objects.all()]
        dealership_reps = [(user.id, user.name) for user in User.objects.filter(id__in=dealership_rep_ids)]

        super(AddActivityForm, self).__init__(*args, **kwargs)
        self.fields['dealer_rep'] = forms.ChoiceField(
            label='New Sales Rep',
            choices=dealership_reps,
            required=False,
            widget=forms.Select()
        )
        self.fields.keyOrder = ['lead_activity_type',
                                'dealer_rep',
                                'followup_date',
                                'new_customer_status',
                                'notes']

class AddActivityAttachmentForm(forms.ModelForm):
    class Meta:
        model = LeadActivityAttachment
        fields = (
            'attachment',
        )
