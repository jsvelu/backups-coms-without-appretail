from django.contrib import admin

from crm.models import BroadcastEmailAttachment

from .models import LeadActivity
from .models import LeadActivityAttachment


class LeadActivityAttachmentInline(admin.TabularInline):
    model = LeadActivityAttachment


class LeadActivityAdmin(admin.ModelAdmin):
    inlines = [LeadActivityAttachmentInline, ]
    list_per_page = 5

# Register your models here.
# admin.site.register(LeadActivity, LeadActivityAdmin)
# admin.site.register(BroadcastEmailAttachment)
