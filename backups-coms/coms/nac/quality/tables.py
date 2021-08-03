import django_tables2 as tables

from orders.models import Order

manage_template = """
<a href='{% url "newage:angular_app" app='quality' %}#/{{ record.id }}/production//' class="btn btn-primary">Production & Quality Control</a>
"""

customer_template = """
{{ record.customer.first_name }} {{ record.customer.last_name }}
"""

class OrderListTable(tables.Table):
    customer = tables.TemplateColumn(verbose_name='Customer', template_code=customer_template)
    chassis = tables.Column(verbose_name='Chassis')
    series = tables.Column(verbose_name='Series')
    action = tables.TemplateColumn(verbose_name='Actions', template_code=manage_template)

    def render_stage(self, value):
        return value['label']

    class Meta:
        model = Order
        attrs = {'class': 'table table-striped'}
        fields = (
            'customer',
            'chassis',
            'series',
            'action',
        )
