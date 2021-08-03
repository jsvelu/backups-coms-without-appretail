from django.urls import reverse
from django.utils.html import format_html
from django.utils.html import mark_safe
import django_tables2 as tables

from orders.models import Order


class FirstNameColumn(tables.Column):
    def __init__(self, verbose_name='First Name', empty_values=(), order_by='customer.first_name', accessor='customer.first_name', *args, **kwargs):
        super(FirstNameColumn, self).__init__(
            verbose_name=verbose_name,
            order_by=order_by,
            accessor=accessor,
            empty_values=empty_values,
            *args,
            **kwargs)

    def render(self, record):
        # print record.id, record.customer, record.customer.first_name if record.customer else '??'
        if record.is_stock():
            return '(%s)' % record.get_order_type()
        if record.customer_id and record.customer.first_name:
            return record.customer.first_name
        return mark_safe('&mdash;')


class _OrderStageColumn(tables.Column):
    def __init__(self, verbose_name='Stage', empty_values=(), orderable=False, *args, **kwargs):
        super(_OrderStageColumn, self).__init__(
            verbose_name=verbose_name,
            empty_values=empty_values,
            orderable=orderable,
            *args,
            **kwargs)

    def render(self, record):
        return record.get_order_stage_details()['label']


class ChassisDescriptionColumn(tables.Column):
    def __init__(self, verbose_name='Stage / Chassis', empty_values=(), order_by=('chassis', 'id'), *args, **kwargs):
        super(ChassisDescriptionColumn, self).__init__(
            verbose_name=verbose_name,
            empty_values=empty_values,
            order_by=order_by,
            *args,
            **kwargs)

    def render(self, record):
        return record.get_chassis_description()


class CustomerManagerColumn(tables.Column):
    def __init__(self, verbose_name='Customer Manager', *args, **kwargs):
        super(CustomerManagerColumn, self).__init__(
            verbose_name=verbose_name,
            *args,
            **kwargs)

    def render(self, record):
        return record.customer_manager.name


class BomOrderListTable(tables.Table):
    chassis = ChassisDescriptionColumn()
    first_name = FirstNameColumn()
    last_name = tables.Column(verbose_name='Last Name', accessor='customer.last_name')
    series = tables.Column(verbose_name='Series')
    order_date = tables.DateColumn(verbose_name='Order Date', format='d-m-Y')
    # stage = _OrderStageColumn()

    class Meta:
        model = Order
        attrs = {'class': 'table table-striped'}
        fields = (
            'chassis',
            'first_name',
            'last_name',
            'series',
            'order_date',
            # 'stage',
            'chassis',
        )
