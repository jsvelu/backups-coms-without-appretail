from calendar import monthrange
from datetime import datetime

from django import forms
from django.core.exceptions import ValidationError
from django.forms.widgets import Select
import django_filters as filters

from caravans.models import Model
from caravans.models import Series
from orders.models import OrderSeries


class DocumentForm(forms.Form):
    docfile = forms.FileField(label='Select a series item spreadsheet')


class ModelChoiceFilter(filters.Filter):
    field_class = forms.models.ModelChoiceField

    def __init__(self, queryset=None, *args, **kwargs):
        queryset = queryset or Model.objects.order_by('name')
        super(ModelChoiceFilter, self).__init__(queryset=queryset, *args, **kwargs)


class SeriesChoiceFilter(filters.Filter):
    field_class = forms.models.ModelChoiceField

    def __init__(self, queryset=None, *args, **kwargs):
        queryset = queryset or Series.objects.select_related('model').order_by('model__name', 'name')
        super(SeriesChoiceFilter, self).__init__(queryset=queryset, *args, **kwargs)


class ScheduleRangeField(filters.fields.DateRangeField):
    @staticmethod
    def _convert_date_range(value):
        """
        Convert Month-Year to proper Date. Start range will start from 1st of Month. Similarly end range will be end of
         the month
        """
        value[0] = datetime.strptime(str(value[0]) + '-' + '01', "%Y-%m-%d").date() if value[0] else value[0]

        if value[1]:
            month_year = value[1].split('-')
            end_of_month = monthrange(int(month_year[0]), int(month_year[1]))[1]
            value[1] = datetime.strptime(str(value[1]) + '-' + str(end_of_month), "%Y-%m-%d").date()

    def clean(self, value):
        self._convert_date_range(value)

        # Validating after conversion as we need date object to compare
        if value[0] and value[1] and value[0] > value[1]:
            raise ValidationError("Enter valid month range")

        return super(ScheduleRangeField, self).clean(value)


class ScheduleChoiceFilter(filters.RangeFilter):
    field_class = ScheduleRangeField


class ConditionsFilter(filters.BooleanFilter):
    CHOICES = (
        (None, '---------'),
        (True, 'Yes'),
        (False, 'No')
    )

    def __init__(self, *args, **kwargs):
        kwargs['widget'] = Select(choices=self.CHOICES)
        super(ConditionsFilter, self).__init__(*args, **kwargs)


    def filter(self, qs, value):
        if value in ([], (), {}, None, ''):
            return qs
        return qs.filter(orderconditions__fulfilled=not value)

    # def filter(self, qs, value):
    #     # This is not called when value is None
    #     return qs.filter(orderconditions__fulfilled=not value).exclude(orderconditions__details='')


class StockOrdersFilter(filters.BooleanFilter):
    CHOICES = (
        (None, '---------'),
        (True, 'Yes'),
        (False, 'No')
    )

    def __init__(self, *args, **kwargs):
        kwargs['widget'] = Select(choices=self.CHOICES)
        super(StockOrdersFilter, self).__init__(*args, **kwargs)

    def filter(self, qs, value):
        # This is not called when value is None
        # print(qs[1])

        if value in ([], (), {}, None, ''):
            return qs
        return qs.filter(customer__isnull=value)


class ProductionUnitFilter(filters.Filter):

    CHOICES = (
        (None, '---------'),
        (1, 'Schedule Unit I'),
        (2, 'Schedule Unit II')
    )

    def __init__(self, *args, **kwargs):
        kwargs['widget'] = Select(choices=self.CHOICES)
        super(ProductionUnitFilter, self).__init__(*args, **kwargs)

class SeriesTypeFilter(filters.Filter):

    CHOICES = (
        (None, '---------'),
        ('Caravans', 'Caravans'),
        ('PopTops', 'PopTops'),
        ('Campers', 'Campers')
    )

    def __init__(self, *args, **kwargs):
        kwargs['widget'] = Select(choices=self.CHOICES)
        super(SeriesTypeFilter, self).__init__(*args, **kwargs)