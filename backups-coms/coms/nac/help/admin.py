from ckeditor.widgets import CKEditorWidget
from django import forms
from django.contrib import admin

from help.models import HelpContent


class HelpContentAdminForm(forms.ModelForm):
    class Meta:
        model = HelpContent
        fields = ('code', 'name', 'content')
        widgets = {
            'content': forms.CharField(widget=CKEditorWidget())
        }

class HelpContentAdmin(admin.ModelAdmin):
    form = HelpContentAdminForm

admin.site.register(HelpContent, HelpContentAdmin)
