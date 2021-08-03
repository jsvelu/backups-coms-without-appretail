from datetime import datetime
from datetime import timedelta

from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import AdminIntegerFieldWidget
from django.utils import timezone

from caravans.models import SKUCategory
from schedule.models import ContractorScheduleExport
from schedule.models import ContractorScheduleExportColumn
from schedule.models import MonthPlanning

from .models import Capacity


class YearListFilter(admin.SimpleListFilter):
    # Title shows as 'Filter by <title>'
    title = 'Year'

    # Parameter for the filter that will be used in the URL query.
    parameter_name = 'year'

    def lookups(self, request, model_admin):
        this_year = timezone.now().year
        return [(year, year) for year in range(this_year-4, this_year+20)]

    def queryset(self, request, queryset):
        if self.value():
            year = int(self.value())
            start_date = datetime(year, 1, 1).date()
            end_date = datetime(year, 12, 31).date()

            # Any dates that don't yet exist, create
            needed_dates = set([date for date in (start_date + timedelta(n) for n in range(365))])
            existing_dates = set([d[0] for d in Capacity.objects.filter(day__in=needed_dates).values_list('day')])
            make_dates = needed_dates - existing_dates
            create_dates = []
            for d in make_dates:
                create_dates.append(Capacity(day=d, capacity=0))
            Capacity.objects.bulk_create(create_dates)
            return queryset.filter(day__gte=start_date, day__lte=end_date)
        else:
            return queryset


class CapacityAdmin(admin.ModelAdmin):
    list_display = (
        'production_unit',
        'day',
        'type',
        'holiday_name',
        'capacity',
    )

    list_editable = (
        'type',
        'holiday_name',
        'capacity',
    )

    list_filter = (
        YearListFilter,
        'production_unit',
        'type',
        'capacity',
    )

    list_per_page = 365
    ordering = ('production_unit','day', )




class ContractorScheduleColumnInline(admin.TabularInline):
    model = ContractorScheduleExportColumn
    readonly_fields = ()
    extra = 0
    verbose_name = 'Export Column'
    verbose_name_plural = 'Export Columns'


class ContractorScheduleExportAdmin(admin.ModelAdmin):
    class Media:
        # uses js to manipulate styling of the current page to modify button text & adjust widget width to prevent critical one from being to narrow
        js = ['schedule/js/contractorscheduleexport.js']
        css = {
            'all': ('schedule/css/contractorscheduleexport.css',)
        }

    list_display = (
        'name',
        'production_date_offset',
    )
    list_editable = (
        'production_date_offset',
    )

    inlines = [
        ContractorScheduleColumnInline,
    ]


class NoPlaceholderIntegerField(forms.IntegerField):

    def __init__(self):
        super(NoPlaceholderIntegerField, self).__init__(
            help_text='',
            widget=AdminIntegerFieldWidget,
            required=True,
            label='Sequence'
        )

    def widget_attrs(self, widget):
        attrs = super(NoPlaceholderIntegerField, self).widget_attrs(widget)
        attrs['placeholder'] = ''
        return attrs


class ContractorScheduleExportColumnAdminForm(forms.ModelForm):
    sequence = NoPlaceholderIntegerField()


class ContractorScheduleExportColumnAdmin(admin.ModelAdmin):
    form = ContractorScheduleExportColumnAdminForm

    list_display = (
        'name',
        'export',
        'sequence',
        'department',
        'contractor_description_field',
    )
    list_editable = (
        'export',
        'sequence',
        'contractor_description_field',
    )
    list_filter = (
        'department',
    )

    # Redefining ordering of categories
    def formfield_for_foreignkey(self, db_field, request=None, **kwargs):
        if db_field.name == "department":
            kwargs['queryset'] = SKUCategory.objects_for_choices(leaf_nodes_only=True)

        return super(ContractorScheduleExportColumnAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)


class MonthPlanningAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'production_unit',
        'production_start_date',
    )

    list_filter = (
        'production_unit',
    )

    ordering = ('production_month','production_unit',)


# not required anymore, use the schedule management application
# admin.site.register(Capacity, CapacityAdmin)

admin.site.register(MonthPlanning, MonthPlanningAdmin)
admin.site.register(ContractorScheduleExport, ContractorScheduleExportAdmin)
admin.site.register(ContractorScheduleExportColumn, ContractorScheduleExportColumnAdmin)
