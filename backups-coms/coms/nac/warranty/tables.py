from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.timezone import get_default_timezone
import django_tables2 as tables
from pytz import timezone

from customers.models import Customer
from orders.models import Order
from warranty.models import WarrantyClaim

date_link_template = """
<a class="record-link" href="{% url 'warranty:claim' record.order_id %}">{{ record.creation_time }}</a>
"""

chassis_template = """
<a class="record-link" href="{% url 'warranty:claim' record.order_id %}">{{ record.order.chassis }}</a>
"""

customer_name_template = """
{{record.order.customer.first_name}} {{record.order.customer.last_name}}
"""

class WarrantyClaimTable(tables.Table):
    creation_time = tables.Column(order_by='creation_time', verbose_name='Creation Time')
    customer = tables.TemplateColumn(template_code=customer_name_template, verbose_name="Customer")
    chassis = tables.TemplateColumn(template_code=chassis_template, verbose_name='Chassis')
    state = tables.Column(verbose_name='State', accessor='order.customer.physical_address.suburb.post_code.state.name')
    status = tables.Column(verbose_name='Status')
    series = tables.Column(verbose_name='Series', accessor='order.orderseries.series')
    dealership = tables.Column(verbose_name='Dealership', accessor='order.dealership')

    class Meta:
        model = WarrantyClaim
        fields = (
            'chassis',
            'series',
            'status',
            'creation_time',
            'customer',
            'state',
            'dealership',
        )
        attrs = {'class': 'table table-striped'}
