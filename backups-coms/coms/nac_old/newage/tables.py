from django.conf import settings
from django.urls import reverse
from django.http.request import QueryDict
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import django_tables2 as tables
from django_tables2.config import RequestConfig

from caravans.models import SKU


class SeriesSKUTable(tables.Table):

    PRICE_TEMPLATE = """
    {% load humanize %}
    {{ value|floatformat:2|intcomma }}
    """

    CURRENCY_ATTRS = {
        'th': {
            'class':'currency',
        },
        'td': {
            'class':'currency',
        },
    }

    photo = tables.Column(verbose_name='Photo', accessor='sku.photo.url', orderable=False)
    category = tables.Column(verbose_name='Department', accessor='sku.sku_category.name')
    name = tables.Column(verbose_name='Name', accessor='sku.name')
    description = tables.Column(verbose_name='Description', accessor='sku.description')
    retail_price = tables.TemplateColumn(verbose_name='Retail $', accessor='sku.retail_price', template_code=PRICE_TEMPLATE, attrs=CURRENCY_ATTRS)
    wholesale_price = tables.TemplateColumn(verbose_name='Wholesale $', accessor='sku.wholesale_price', template_code=PRICE_TEMPLATE, attrs=CURRENCY_ATTRS)
    availability = tables.Column(verbose_name='Available As', accessor='availability_type')

    def render_photo(self, value):
        return mark_safe("<img class='item-thumbnail' src='%s'>" % value)

    class Meta:
        model = SKU
        attrs = {'class': 'table table-striped remove-pagination'}
        fields = (
            'photo',
            'category',
            'name',
            'description',
            'retail_price',
            'wholesale_price',
            'availability',
        )


class TodoTable(tables.Table):

    id = tables.Column(verbose_name='Quote/order #')
    chassis = tables.Column(verbose_name='Chassis #')
    customer = tables.Column(verbose_name='Customer', order_by=('customer.first_name', 'customer.last_name'))
    model_series = tables.Column(verbose_name='Model/Series', accessor='get_series_code')
    schedule_date = tables.Column(verbose_name='Schedule', accessor='build.build_order.production_month')
    action = tables.Column(verbose_name='Action', accessor='action_name')
    days_waiting = tables.Column(verbose_name='Days Waiting')
    manage = tables.Column(verbose_name='Manage', accessor='id', orderable=False)

    def render_id(self, record):
        return '{} #{}'.format(record.get_order_stage_details()['label'], record.id)

    def render_customer(self, record):
        return record.customer.name if record.customer else ''

    def render_schedule_date(self, value):
        return value.strftime(settings.FORMAT_DATE_MONTH)

    def render_manage(self, record):
        return format_html(
            '<a href="{}#/{}{}">Manage</a>',
            reverse('newage:angular_app', kwargs={'app': 'orders'}),
            record.id,
            record.manage_url
        )

    class Meta(object):

        attrs = {'class': 'table table-striped', 'id': 'todo-items'}
        fields = (
            'schedule_date',
            'id',
            'chassis',
            'customer',
            'model_series',
            'action',
            'days_waiting',
            'manage',
        )
        order_by = 'schedule_date'
        prefix = 'todo_'

    def __init__(self, data, request, *args, **kwargs):
        super(TodoTable, self).__init__(data, *args, **kwargs)

        request.GET = request.GET.copy()  # request.GET is immutable, this makes it mutable

        current_order_by = request.GET.getlist(self.prefixed_order_by_field)

        # The 'order_by' defined in the meta is lost when ordering with another column,
        # this makes sure it is always present at the end of the sort querystring parameter.
        if self._meta.order_by and (len(current_order_by) < 1 or current_order_by[-1] != str(self._meta.order_by)):
            request.GET.setlist(self.prefixed_order_by_field, current_order_by + [self._meta.order_by])

        RequestConfig(request, paginate=False).configure(self)
