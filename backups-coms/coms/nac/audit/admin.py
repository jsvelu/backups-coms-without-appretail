from django.contrib import admin

from audit.models import Audit
from audit.models import AuditField


class AuditFieldInline(admin.TabularInline):
    model = AuditField
    extra = 0
    readonly_fields = (
        'name',
        'changed_from',
        'changed_to',
    )


class AuditAdmin(admin.ModelAdmin):
    inlines = (
        AuditFieldInline,
    )

    list_display = (
        'content_type',
        'content_repr',
        'type',
        'saved_by',
        'user_ip',
        'saved_on',
        'changes',
    )

    list_filter = (
        'content_type',
        'type',
        'saved_by',
    )

# admin.site.register(Audit, AuditAdmin)
