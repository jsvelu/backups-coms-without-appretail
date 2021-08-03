from ckeditor.widgets import CKEditorWidget
from django import forms
from django.contrib import admin

from .models import EmailTemplate

MESSAGE_HELP_TEXT = '''
<div id="email_template_help">
    <div>
        Available placeholders for batch emails:
    </div>
    <table>
        <tr>
            <td>%%completion_date%%</td>
            <td>The date of the second completion reminder for this month, eg '01/02/2016' (usually the last limit for the completion of the order)</td>
        </tr>
        <tr>
            <td>%%customer_name%%</td>
            <td>The name of the customer associated with the order</td>
        </tr>
        <tr>
            <td>%%order_series%%</td>
            <td>The model and series of order</td>
        </tr>
        <tr>
            <td>%%order_chassis%%</td>
            <td>The chassis number of the order if available, otherwise the id of the order, eg 'NA10052' or '305'</td>
        </tr>
        <tr>
            <td>%%order_status_link%%</td>
            <td>A link to the status of the order</td>
        </tr>
        <tr>
            <td>%%order_special_features%%</td>
            <td>A list of all approved special features related to the particular order</td>
        </tr>
        <tr>
            <td>%%recipient_name%%</td>
            <td>The full name of the recipient of the email</td>
        </tr>
        <tr>
            <td>%%reject_reason%%</td>
            <td>The reason provided when action has been rejected (when appropriate)</td>
        </tr>
        <tr>
            <td>%%schedule_month%%</td>
            <td>The month when the order is scheduled, eg 'January 2016'</td>
        </tr>
        <tr>
            <td>%%signoff_date%%</td>
            <td>The date of the second signoff reminder for this month, eg '01/02/2016' (usually the last limit for the signoff of the order)</td>
        </tr>
        <tr>
            <td>%%todo_list%%</td>
            <td>The list of all orders that need to be managed (for bulk emails)</td>
        </tr>
    </table>
</div>
'''


class EmailTemplateAdminForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        super(EmailTemplateAdminForm, self).__init__(*args, **kwargs)
        self.fields['message'].help_text = MESSAGE_HELP_TEXT

    class Meta:
        model = EmailTemplate
        exclude = ()
        widgets = {
            'message': forms.CharField(widget=CKEditorWidget())
        }


class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'role')

    form = EmailTemplateAdminForm

    def save_model(self, request, obj, form, change):
        # This model has a unique field, but also inherit from PermanentModel.
        # This means that if an object is deleted, it will still exist in the database, and adding new model with the same value for the unique field will fail.
        try:
            EmailTemplate.deleted_objects.get(role=obj.role).delete(force=True)
        except EmailTemplate.DoesNotExist:
            pass
        super(EmailTemplateAdmin, self).save_model(request, obj, form, change)




# Register your models here.
admin.site.register(EmailTemplate, EmailTemplateAdmin)
