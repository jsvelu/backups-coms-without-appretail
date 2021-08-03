from django.shortcuts import render
from django.views.generic import TemplateView
from django_tables2.config import RequestConfig
from rules.contrib.views import PermissionRequiredMixin

from orders.models import Order
from quality.tables import OrderListTable


class OrderListView(PermissionRequiredMixin, TemplateView):
    template_name = 'quality/list.html'

    permission_required = 'orders.view_order'

    def get_context_data(self, **kwargs):
        context = super(OrderListView, self).get_context_data(**kwargs)
        orders = Order.objects.filter_by_visible_to(self.request.user)
        if self.kwargs.get('order_id'):
            orders = orders.filter(id=self.kwargs.get('order_id'))
            context['single_order'] = orders.first()
        order_table = OrderListTable(orders)
        RequestConfig(self.request, paginate={'page': self.request.GET.get('page', 1), 'per_page': 50}).configure(order_table)
        context['order_table'] = order_table
        context['help_code'] = 'order_list'
        return context
