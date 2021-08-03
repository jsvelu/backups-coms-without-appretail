from django.contrib import admin
from django.urls import reverse
from django.utils.safestring import mark_safe

from crm.models import LeadActivity

from .models import AcquisitionSource
from .models import Customer
from .models import CustomerStatus
from .models import SourceOfAwareness


class LeadActivityInline(admin.TabularInline):
    model = LeadActivity
    show_change_link = True
    can_delete = False

class CustomerAdmin(admin.ModelAdmin):
    # the structure of Address table cause some 10,000-options select to be generated and renders the admin page unresponsive.
    # we're going to force a readonly here.
    readonly_fields = ('physical_address','postal_address','delivery_address')
    inlines = [
        LeadActivityInline,
    ]
    search_fields = ['first_name', 'last_name', 'physical_address__suburb__name', 'physical_address__suburb__post_code__state__name']


# Register your models here.
admin.site.register(AcquisitionSource)
admin.site.register(SourceOfAwareness)
admin.site.register(Customer, CustomerAdmin)
admin.site.register(CustomerStatus)
