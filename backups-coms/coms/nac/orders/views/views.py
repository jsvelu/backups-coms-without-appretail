import calendar
from datetime import date

from allianceutils.filters import MultipleFieldCharFilter
from allianceutils.views.views import JSONExceptionAPIView #new
from allianceutils.views.decorators import gzip_page_ajax #new
from dateutil.relativedelta import relativedelta
from django.utils.decorators import method_decorator #new
from rest_framework.response import Response #new
from django.conf import settings
from django.urls import reverse
from django.db.models import Q
from django.http.response import HttpResponseRedirect
from django.utils import timezone
from django.utils.html import format_html
from django.views.generic import TemplateView
import django_filters as filters
import django_tables2 as tables
import floppyforms.__future__ as forms
from rules.contrib.views import PermissionRequiredMixin

from caravans.forms import ConditionsFilter
from caravans.forms import ModelChoiceFilter
from caravans.forms import ProductionUnitFilter
from caravans.forms import ScheduleChoiceFilter
from caravans.forms import SeriesChoiceFilter
from caravans.forms import StockOrdersFilter
from caravans.models import Model
from caravans.models import Series
from caravans.models import SeriesSKU
from caravans.models import SKUCategory
from dealerships.forms import DealershipUserChoiceFilter
from dealerships.models import Dealership
from dealerships.models import DealershipUser
from newage.forms import LookupForm
from newage.models import Settings
from newage.tables import SeriesSKUTable
from newage.utils import NewageTable
from newage.views.generic import FilterSetListView
from orders.models import Order
from orders.models import OrderDocument
from orders.models import Show
from orders.tables import ChassisDescriptionColumn
from orders.tables import CustomerManagerColumn
from orders.tables import FirstNameColumn
from orders.util import ExportCSVForOrdersQuotes
from schedule.models import Capacity
from schedule.models import MonthPlanning
from production.models import Build


class LookupView(TemplateView):
    template_name = 'orders/lookup.html'

    item_lookup_prefix = 'item_lookup'
    dept_lookup_prefix = 'dept_lookup'

    def __init__(self, *args, **kwargs):
        self.order_not_found  = False
        self.chassis_not_found = False
        self.vin_number_not_found = False
        return super(LookupView, self).__init__(*args, **kwargs)

    
    def item_table(self, prefix):
        qs = SeriesSKU.objects.exclude(availability_type=SeriesSKU.AVAILABILITY_NOT_USED)
        if self.request.GET.get('%s-series' % prefix):
            qs = qs.filter(series__id=self.request.GET.get('%s-series' % prefix))
        if self.request.GET.get('%s-text' % prefix):
            text = self.request.GET.get('%s-text' % prefix)
            if prefix == self.item_lookup_prefix:
                qs = qs.filter(Q(sku__name__icontains=text) | Q(sku__description__icontains=text))
            elif prefix == self.dept_lookup_prefix:
                qs = qs.filter(sku__sku_category__name__icontains=text)

        table = SeriesSKUTable(qs)
        table.Meta.order_by_field = '%s_sort' % prefix
        table.Meta.page_field = '%s_page' % prefix

        # Only dealer principals and stand managers can see the wholesale price
        is_dealer_principal = hasattr(self.request.user, 'dealershipuser') and list(self.request.user.dealershipuser.get_dealership_principal_ids())

        is_stand_manager = Show.is_user_standmanager(self.request.user)

        if not is_dealer_principal and not is_stand_manager:
            table.exclude = ('wholesale_price',)

        tables.RequestConfig(self.request,
                      paginate={"page": self.request.GET.get('%s_page' % prefix, 1), "per_page": 10}).configure(table)
        return table

    def get(self, *args, **kwargs):
        if self.request.GET.get('order_id','') != '':
            try:
                order = Order.objects.get(id=self.request.GET['order_id'])
                if not self.request.user.has_perm('orders.view_order', order):
                    raise Order.DoesNotExist
                return HttpResponseRedirect('%s#/%s/status' % (reverse('newage:angular_app', kwargs={'app': 'orders'}), order.id))
            except Order.DoesNotExist:
                self.order_not_found = True

        if self.request.GET.get('chassis_id','') != '':
            try:
                order = Order.objects.get(chassis=self.request.GET['chassis_id'])
                if not self.request.user.has_perm('orders.view_order', order):
                    raise Order.DoesNotExist
                return HttpResponseRedirect('%s#/%s/status' % (reverse('newage:angular_app', kwargs={'app': 'orders'}), order.id))
            except Order.DoesNotExist:
                self.chassis_not_found = True

        if self.request.GET.get('vin_number','') !='':
            try:
                vin = Build.objects.get(vin_number=self.request.GET['vin_number'])
                if not self.request.user.has_perm('orders.view_order',vin):
                    raise Build.DoesNotExist
                return HttpResponseRedirect('%s#/%s/status' % (reverse('newage:angular_app', kwargs={'app': 'orders'}), vin.order.id))
            except Build.DoesNotExist:
                self.vin_number_not_found = True 
                
        return super(LookupView, self).get(*args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(LookupView, self).get_context_data(**kwargs)

        context['order_not_found'] = self.order_not_found
        context['chassis_not_found'] = self.chassis_not_found
        context['vin_number_not_found'] = self.vin_number_not_found

        item_lookup = LookupForm(self.request.GET, prefix=self.item_lookup_prefix)
        item_lookup.fields['text'].label = 'Item'
        dept_lookup = LookupForm(self.request.GET, prefix=self.dept_lookup_prefix)
        dept_lookup.fields['text'].label = 'Department'
        context['item_lookup'] = item_lookup
        context['dept_lookup'] = dept_lookup

        if self.request.GET.get('%s-series' % self.item_lookup_prefix):
            context['item_lookup_table'] = self.item_table(self.item_lookup_prefix)

        if self.request.GET.get('%s-series' % self.dept_lookup_prefix):
            context['dept_lookup_table'] = self.item_table(self.dept_lookup_prefix)

        return context


class ShowroomView(PermissionRequiredMixin, TemplateView):
    template_name = 'orders/showroom.html'

    permission_required = 'orders.create_order'

    def get_context_data(self, **kwargs):
        context = super(ShowroomView, self).get_context_data(**kwargs)
        newage_settings = Settings.objects.all().first()
        if newage_settings is not None:
            splash = newage_settings.showroom_splash
        else:
            splash = None
        context['splash'] = splash
        context['help_code'] = 'showroom'
        return context


class OrderListView(FilterSetListView):

    class OrderListFilter(filters.FilterSet):
        id = filters.NumberFilter()
        chassis = filters.CharFilter(lookup_expr='icontains', label='Chassis')
        dealership = filters.CharFilter(field_name='dealership__name', lookup_expr='icontains', label='Dealership')
        model = ModelChoiceFilter(field_name='orderseries__series__model', label='Model')
        series = SeriesChoiceFilter(field_name='orderseries__series', label='Series')
        # production_unit = ProductionUnitFilter(field_name='orderseries__production_unit', label='Schedule Unit')
        show = filters.CharFilter(field_name='show__name', lookup_expr='icontains', label='Show')
        dealer_sales_rep = DealershipUserChoiceFilter(name='dealer_sales_rep', label='Dealer sales rep')
        # stage
        customer_manager = filters.CharFilter(field_name='customer_manager__name', lookup_expr='icontains', label='Customer manager')
        customer = MultipleFieldCharFilter(names=('customer__first_name', 'customer__last_name'), lookup_expr='icontains', label='Customer')
        conditions = ConditionsFilter(label='Has unmet conditions')
        stock_orders = StockOrdersFilter(label='Is stock order')
        schedule_months = ScheduleChoiceFilter(field_name='build__build_order__production_month', lookup_expr='icontains', label='Schedule months',
                                               widget=filters.widgets.RangeWidget(attrs={'type': 'month'}))

        class Meta(object):
            form = forms.Form

    class OrderListTable(NewageTable):
        # id = tables.Column(verbose_name='ID')
        first_name = FirstNameColumn()
        last_name = tables.Column(verbose_name='Last Name', accessor='customer.last_name')
        dealership = tables.Column(verbose_name='Dealership')
        customer_manager = CustomerManagerColumn()
        model = tables.Column(verbose_name='Model', accessor='orderseries.series.model.name')
        series = tables.Column(verbose_name='Series', accessor='orderseries.series')
        # production_unit = tables.Column(verbose_name='Schedule Unit', accessor='orderseries.production_unit')
        created_on = tables.DateColumn(verbose_name='Created On')
        delivery_date = tables.Column(verbose_name='Delivery')
        schedule_date = tables.Column(verbose_name='Schedule', accessor='build.build_order.production_month')
        chassis = ChassisDescriptionColumn()
        # stage = _OrderStageColumn()
        manage = tables.Column(verbose_name='', accessor='id')

        def render_manage(self, value, record):
            route = '/caravan/features' if record.has_missing_selections else '/status'
            return format_html(
                '<a href="{}#/{}{}">Manage</a>',
                reverse('newage:angular_app', kwargs={'app': 'orders'}),
                value,
                route,
            )

        def render_delivery_date(self, value):
            return value.strftime(settings.FORMAT_DATE_MONTH)

        def render_schedule_date(self, value):
            return value.strftime(settings.FORMAT_DATE_MONTH)

        def render_series(self, record):
            return record.get_series_description()

        class Meta(NewageTable.Meta):
            model = Order
            attrs = {'class': 'table table-striped'}
            fields = (
                'chassis',
                'first_name',
                'last_name',
                'dealership',
                'customer_manager',
                'series',
                # 'production_unit',
                'created_on',
                'delivery_date',
                'schedule_date',
                # 'stage',
                'manage',
            )

    permission_required = 'orders.view_order'
    model = Order
    template_name = 'orders/list.html'
    table_class = OrderListTable
    filter_class = OrderListFilter

    def get_queryset_unfiltered(self):
        orders = super(OrderListView, self).get_queryset_unfiltered()
        orders = orders.filter_by_visible_to(self.request.user)
        orders = orders.filter(order_cancelled__isnull=True)
        orders = orders.order_by('-created_on')
        orders = orders.select_related(
            'customer',
            'dealer_sales_rep',
            'dealer_sales_rep__user_ptr',
            'dealership',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
        )
        quote_ids = []
        for order in orders:
            if order.is_quote():
                quote_ids.append(order.id)

        return orders.exclude(id__in=quote_ids)

    def get_context_data(self, **kwargs):
        context = super(OrderListView, self).get_context_data(**kwargs)
        context['can_create_order'] = self.request.user.has_perm('orders.create_order')
        return context

    def get_form(self):
        return self.bootstrapify_widgets(super(OrderListView, self).get_form())


# def get_schedule_unit(schedule_unit):
#     if schedule_unit == 1:
#         return 'Schedule Unit I'
#     elif schedule_unit == 2:
#         return 'Schedule Unit II'
#     else:
#         return None

class ExportOrderListView(ExportCSVForOrdersQuotes, OrderListView):
    """
    Export Order list for All Orders Page.
    We had to exclude columns and add them back
    As there was bug when NULL was printed in MS Excell. Also had to re-arrange the data
    as per the requirement.
    """
    exclude_columns = ('manage',
                       'model',
                       'delivery_date',
                       'series',
                       # 'production_unit',
                       'first_name',
                       'last_name',
                       'dealership',
                       'customer_manager',
                       'created_on',
                       'schedule_date',
                       'chassis',
                       )
    extra_columns = [
        'Order / Chassis #',
        'First Name',
        'Last Name',
        'Dealership',
        'Customer Manager',
        'Schedule Unit',
        'Series Code',
        'Series Description',
        'Created On',
        'Approved On',
        'Finalised On',
        'Schedule',
    ]

    def get_extra_columns_per_record(self, order):
        schedule_month = ''
        if hasattr(order, 'build') and order.build.build_order:
            schedule_month = calendar.month_name[int(order.build.build_order.production_month.strftime("%m"))] + \
                ' ' + order.build.build_order.production_month.strftime("%Y")

        return [
            order.chassis if order.chassis else "Order #" + str(order.id),
            order.customer.first_name if order.customer and order.customer.first_name else '(Stock)',
            order.customer.last_name if order.customer and order.customer.last_name else '-',
            order.dealership,
            order.customer_manager.name,
            # get_schedule_unit(order.orderseries.production_unit),
            # order.orderseries.production_unit,
            order.orderseries.series.code if hasattr(order, 'orderseries') and order.orderseries.series.code else '',
            str(order.orderseries.series.model) + ' ' + order.orderseries.series.name if hasattr(order, 'orderseries') else '',
            self.convert_date_time_to_local(order.created_on) if order.created_on else '',
            self.convert_date_time_to_local(order.order_submitted) if order.order_submitted else '',
            self.convert_date_time_to_local(order.order_finalized_at) if order.order_finalized_at and not order.order_finalization_cancelled_at else '',
            schedule_month,
        ]

    def get_file_name(self):
        return "All Orders"

    def get(self, request, *args, **kwargs):
        self.table_data = self.get_queryset().prefetch_related('build__build_order', 'customer', 'orderseries__series__model', 'dealership', 'customer_manager')
        return self.write_csv(self.get_table())


class QuoteListView(FilterSetListView):
    class QuoteListFilter(filters.FilterSet):
        id = filters.NumberFilter()
        chassis = filters.CharFilter(lookup_expr='icontains', label='Chassis')
        dealership = filters.CharFilter(field_name='dealership__name', lookup_expr='icontains', label='Dealership name')
        model = ModelChoiceFilter(field_name='orderseries__series__model', label='Model Name')
        series = SeriesChoiceFilter(field_name='orderseries__series', label='Series Name')
        # production_unit = ProductionUnitFilter(field_name='orderseries__production_unit', label='Schedule Unit')
        show = filters.CharFilter(field_name='show__name', lookup_expr='icontains', label='Show name')
        dealer_sales_rep = DealershipUserChoiceFilter(name='dealer_sales_rep', label='Dealer sales rep user ptr name')
        # stage
        customer_manager = filters.CharFilter(field_name='customer_manager__name', lookup_expr='icontains', label='Customer manager name')
        customer = MultipleFieldCharFilter(names=('customer__first_name', 'customer__last_name'),
                                           lookup_expr='icontains', label='Customer')
        conditions = ConditionsFilter(label='Has unmet conditions')

        class Meta(object):
            form = forms.Form

    class QuoteListTable(NewageTable):
        # id = tables.Column(verbose_name='ID')
        first_name = FirstNameColumn()
        last_name = tables.Column(verbose_name='Last Name', accessor='customer.last_name')
        dealership = tables.Column(verbose_name='Dealership')
        customer_manager = CustomerManagerColumn()
        model = tables.Column(verbose_name='Model', accessor='orderseries.series.model.name')
        series = tables.Column(verbose_name='Series', accessor='orderseries.series')
        # production_unit = tables.Column(verbose_name='Schedule Unit', accessor='orderseries.production_unit')
        created_on = tables.DateColumn(verbose_name='Created On')
        delivery_date = tables.Column(verbose_name='Delivery')
        schedule_date = tables.Column(verbose_name='Schedule', accessor='build.build_order.production_month')
        chassis = ChassisDescriptionColumn()
        # stage = _OrderStageColumn()
        manage = tables.Column(verbose_name='', accessor='id')

        def render_manage(self, value, record):
            route = '/caravan/features' if record.has_missing_selections else '/status'
            return format_html(
                '<a href="{}#/{}{}">Manage</a>',
                reverse('newage:angular_app', kwargs={'app': 'orders'}),
                value,
                route,
            )

        def render_delivery_date(self, value):
            return value.strftime('%B %Y')

        def render_schedule_date(self, value):
            return value.strftime('%B %Y')

        def render_series(self, record):
            return record.get_series_description()

        class Meta(NewageTable.Meta):
            model = Order
            attrs = {'class': 'table table-striped'}
            fields = (
                'chassis',
                'first_name',
                'last_name',
                'dealership',
                'customer_manager',
                'series',
                # 'production_unit',
                'created_on',
                'delivery_date',
                'schedule_date',
                # 'stage',
                'manage',
            )

    permission_required = 'orders.view_order'
    model = Order
    template_name = 'orders/list-quotes.html'
    table_class = QuoteListTable
    filter_class = QuoteListFilter

    def get_queryset_unfiltered(self):
        orders = super(QuoteListView, self).get_queryset_unfiltered()
        orders = orders.filter_by_visible_to(self.request.user)
        orders = orders.filter(order_cancelled__isnull=True)
        orders = orders.order_by('-created_on')
        orders = orders.select_related(
            'customer',
            'dealer_sales_rep',
            'dealer_sales_rep__user_ptr',
            'dealership',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
        )
        quote_ids = []
        for order in orders:
            if order.is_quote():
                quote_ids.append(order.id)

        return orders.filter(id__in=quote_ids)

    def get_context_data(self, **kwargs):
        context = super(QuoteListView, self).get_context_data(**kwargs)
        context['can_create_order'] = self.request.user.has_perm('orders.create_order')
        return context

    def get_form(self):
        form = super(QuoteListView, self).get_form()
        form.fields['chassis'].widget.attrs['disabled'] = True
        return self.bootstrapify_widgets(form)


class CancelledOrderListView(FilterSetListView):
    # ExportCancelledOrderListView inherits from this class and all columns from the table will be included in the export

    class CancelledOrderListFilter(filters.FilterSet):
        id = filters.NumberFilter()
        chassis = filters.CharFilter(lookup_expr='icontains', label= 'Chassis')
        dealership = filters.CharFilter(field_name='dealership__name', lookup_expr='icontains', label= 'Dealership name')
        model = ModelChoiceFilter(field_name='orderseries__series__model', label= 'Model')
        series = SeriesChoiceFilter(field_name='orderseries__series', label= 'Series')
        dealer_sales_rep = DealershipUserChoiceFilter(name='dealer_sales_rep', label= 'Dealer sales rep user ptr name')
        customer_manager = filters.CharFilter(field_name='customer_manager__name', lookup_expr='icontains', label= 'Customer manager name')
        customer = MultipleFieldCharFilter(names=('customer__first_name', 'customer__last_name'), lookup_expr='icontains', label= 'Customer')
        cancellation_date = filters.DateFromToRangeFilter(field_name='order_cancelled', label= 'Order cancelled', widget=filters.widgets.RangeWidget(attrs={'class': 'datepicker'}))

        class Meta(object):
            form = forms.Form

    class CancelledOrderListTable(NewageTable):
        chassis = ChassisDescriptionColumn()
        order_cancelled = tables.DateColumn(verbose_name='Date Cancelled')
        dealership = tables.Column(verbose_name='Dealership')
        customer = tables.Column(verbose_name='Customer', accessor='customer.name')
        model = tables.Column(verbose_name='Model', accessor='orderseries.series.model.name')
        series = tables.Column(verbose_name='Series', accessor='orderseries.series')
        order_cancelled_reason = tables.Column(verbose_name='Reason for Cancellation')
        manage = tables.Column(verbose_name='', accessor='id')

        def render_manage(self, value):
            return format_html(
                '<a href="{}#/{}/status">Manage</a>',
                reverse('newage:angular_app', kwargs={'app': 'orders'}),
                value,
            )

        def render_series(self, record):
            return record.get_series_description()

        class Meta(NewageTable.Meta):
            model = Order
            attrs = {'class': 'table table-striped'}
            fields = (
                'chassis',
                'order_cancelled',
                'dealership',
                'customer',
                'model',
                'series',
                'order_cancelled_reason',
                'manage',
            )

    permission_required = 'orders.view_order'
    model = Order
    template_name = 'orders/list-cancelled.html'
    table_class = CancelledOrderListTable
    filter_class = CancelledOrderListFilter

    def get_queryset_unfiltered(self):
        orders = super(CancelledOrderListView, self).get_queryset_unfiltered()
        orders = orders.filter_by_visible_to(self.request.user)
        orders = orders.filter(order_cancelled__isnull=False)
        orders = orders.order_by('-created_on')
        orders = orders.select_related(
            'customer',
            'dealership',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
        )

        return orders

    def get_form(self):
        return self.bootstrapify_widgets(super(CancelledOrderListView, self).get_form())


class ExportCancelledOrderListView(ExportCSVForOrdersQuotes, CancelledOrderListView):

    exclude_columns = ('manage',)
    extra_columns = []

    def get_file_name(self):
        return "Cancelled Orders"

    def get(self, request, *args, **kwargs):
        self.table_data = self.get_queryset()
        return self.write_csv(self.get_table())


class DeliveryOrderListView(FilterSetListView):
    # ExportDeliveryOrderListView inherits from this class and all columns from the table will be included in the export

    class DeliveryOrderListFilter(filters.FilterSet):
        id = filters.NumberFilter()
        chassis = filters.CharFilter(lookup_expr='icontains', label = 'Chassis')
        dealership = filters.CharFilter(field_name='dealership__name', lookup_expr='icontains', label = 'Dealership name')
        model = ModelChoiceFilter(field_name='orderseries__series__model', label = 'Model')
        series = SeriesChoiceFilter(field_name='orderseries__series', label = 'Series')
        show = filters.CharFilter(field_name='show__name', lookup_expr='icontains', label = 'Show name')
        dealer_sales_rep = DealershipUserChoiceFilter(name='dealer_sales_rep', label = 'Dealer sales rep user ptr name')
        customer_manager = filters.CharFilter(field_name='customer_manager__name', lookup_expr='icontains', label = 'Customer manager name')
        customer = MultipleFieldCharFilter(names=('customer__first_name', 'customer__last_name'), lookup_expr='icontains', label = 'Customer')
        conditions = ConditionsFilter(label='Has unmet conditions')
        stock_orders = StockOrdersFilter(label='Is stock order')
        schedule_month = filters.DateFromToRangeFilter(field_name='build__build_order__production_month', label = 'Schedule Month', widget=filters.widgets.RangeWidget(attrs={'class': 'datepicker'}))

        class Meta(object):
            form = forms.Form

    class DeliveryOrderListTable(NewageTable):
        schedule_month = tables.Column(verbose_name='Schedule Month', accessor='build.build_order.production_month')
        chassis = tables.Column(verbose_name='Chassis', accessor='chassis')
        vin_number = tables.Column(verbose_name='VIN Number', accessor='build.vin_number', default='')
        series_code = tables.Column(verbose_name='Series Code', accessor='series')
        dealership = tables.Column(verbose_name='Dealership')
        customer_name = tables.Column(verbose_name='Customer', accessor='customer', default='(STOCK)')
        show_name = tables.Column(verbose_name='Show', accessor='show.name')  # Using show_name to avoid adding the class .show which is a reserved bootstrap class for showing/hiding elements
        manage = tables.Column(verbose_name='', accessor='id')

        def render_manage(self, value):
            return format_html(
                '<a href="{}#/{}/status">Manage</a>',
                reverse('newage:angular_app', kwargs={'app': 'orders'}),
                value,
            )

        def render_schedule_month(self, value):
            return value.strftime(settings.FORMAT_DATE_MONTH)

        def render_series_code(self, record):
            return record.custom_series_code or record.series.code

        def render_customer_name(self, value):
            return value.get_full_name()

        class Meta(NewageTable.Meta):
            model = Order
            attrs = {'class': 'table table-striped'}
            fields = (
                'schedule_month',
                'chassis',
                'vin_number',
                'series_code',
                'dealership',
                'customer_name',
                'show_name',
                'manage',
            )

    permission_required = 'orders.view_order'
    model = Order
    template_name = 'orders/list-delivery.html'
    table_class = DeliveryOrderListTable
    filter_class = DeliveryOrderListFilter

    def get_queryset_unfiltered(self):

        order_ids_with_factory = set(Order.objects.filter(orderdocument__type=OrderDocument.DOCUMENT_FACTORY_PLAN).values_list('id', flat=True))
        order_ids_with_chassis = set(Order.objects.filter(orderdocument__type=OrderDocument.DOCUMENT_CHASSIS_PLAN).values_list('id', flat=True))
        order_ids_with_both_docs = order_ids_with_factory & order_ids_with_chassis

        orders = (super(DeliveryOrderListView, self).get_queryset_unfiltered()
            .filter_by_visible_to(self.request.user)
            .filter(
                order_cancelled__isnull=True,
                id__in=order_ids_with_both_docs
            )
            .order_by('-created_on')
            .select_related(
                'customer',
                'dealership',
                'orderseries',
                'orderseries__series',
                'orderseries__series__model',
            )
        )

        return orders

    def get_form(self):
        return self.bootstrapify_widgets(super(DeliveryOrderListView, self).get_form())


class ExportDeliveryOrderListView(ExportCSVForOrdersQuotes, DeliveryOrderListView):

    exclude_columns = ('manage',)

    extra_columns = [
        'WOB',
        'TARE',
        'ATM',
        'GTM',
        'TOW BALL',
        'TYRES',
        'CHASSIS GTM',
        'GAS COMP',
        'PAYLOAD',
        'Address',
        'Email',
        'Phone number',
        'Customer delivery date',
    ]

    def get_extra_columns_per_record(self, order):
        return [
            (order.build.weight_tare or 0) - (order.build.weight_tow_ball or 0),
            order.build.weight_tare or 0,
            order.build.weight_atm or 0,
            (order.build.weight_atm or 0) - (order.build.weight_tow_ball or 0),
            order.build.weight_tow_ball or 0,
            order.build.weight_tyres or 0,
            order.build.weight_chassis_gtm or 0,
            order.build.weight_gas_comp or 0,
            order.build.weight_payload or 0,
            str(order.customer.physical_address) if order.customer and order.customer.physical_address else '',
            order.customer.email if order.customer else '',
            order.customer.phone1 if order.customer else '',
            self.convert_date_time_to_local(order.delivery_date_customer),
        ]

    def get_file_name(self):
        return "VIN Data Sheet"

    def get(self, request, *args, **kwargs):
        self.table_data = self.get_queryset()
        return self.write_csv(self.get_table())


class ReassignView(PermissionRequiredMixin, TemplateView):
    template_name = 'orders/reassign.html'

    permission_required = 'orders.reassign_order_all'

    def get_context_data(self, **kwargs):
        for dealership in Dealership.objects.all():
            dealer = {
                dealership.id: [
                    {
                        'id': user.id,
                        'name': user.name,
                    } for user in dealership.dealershipuser_set.all().order_by('name')
                ]
            }

        context = {
            'shows': [
                {
                    'id': show.id,
                    'name': show.name,
                } for show in Show.objects.all().order_by('name')
            ],
            'dealerships': [
                {
                    'id': dealership.id,
                    'name': dealership.name,
                } for dealership in Dealership.objects.all().order_by('name')
            ],
            'dealership_members': {
                dealership.id: [
                    {
                        'id': user.id,
                        'name': user.name,
                    } for user in dealership.dealershipuser_set.all().order_by('name')
                ] for dealership in Dealership.objects.all()
            },
        }

        return context


class ReplaceSku(PermissionRequiredMixin, TemplateView):
    template_name = 'orders/replace_sku.html'

    permission_required = 'orders.replace_sku'

    def get_context_data(self, **kwargs):
        context = {
            'models': [
                {
                    'id': model.id,
                    'name': model.name,
                }
                for model in Model.objects.all()
            ],
            'categories': [
                {
                    'id': category.id,
                    'name': category.name,
                }
                for category in SKUCategory.top().skucategory_set.all()
            ],
        }

        return context


class SalesforceFailedOrdersView(PermissionRequiredMixin, TemplateView):
    template_name = 'orders/salesforce_failed_orders.html'

    permission_required = 'is_staff'

    def get_context_data(self, **kwargs):
        failed_orders = Order.objects.filter(salesforce_sync_error=True).exclude(orderseries__isnull=True).prefetch_related('orderseries__series', 'salesforce_errors')
        failures = [
            {
                'id': order.id,
                'date': order.created_on,
                'name': order.get_recipient(),
                'model': order.orderseries.series.code,
                'error': order.salesforce_errors.latest('timestamp') if order.salesforce_errors.exists() else None,
            }
            for order in failed_orders
        ]

        context = super(SalesforceFailedOrdersView, self).get_context_data(**kwargs)
        context.update(
            {
                'failures': failures,
            }
        )
        return context

############################## ScheduleAvailabilityView ##################################

class ScheduleAvailabilityView(PermissionRequiredMixin, TemplateView):
    template_name = 'orders/schedule_availability.html'

    permission_required = ('orders.view_schedule_availability')

    def get_context_data(self, **kwargs):
        today = timezone.now().date()

        # Ensure no results are returned if no conditions are met (ie. nothing is setup)
        last_defined_month1 = date.min
        last_defined_month2 = date.min

        # Get the before-last MonthPlanning with a production start date defined
        # Using the before-last and not the last here because a production capacity is only defined if the following month has a start date defined.
        last_month_plannings1 = MonthPlanning.objects.filter(production_month__gt=today, production_start_date__isnull=False, production_unit=1).order_by('-production_month')
        last_month_plannings2 = MonthPlanning.objects.filter(production_month__gt=today, production_start_date__isnull=False, production_unit=2).order_by('-production_month')

        if last_month_plannings1 and last_month_plannings1.count() > 2:
            last_defined_month1 = last_month_plannings1[1].production_month

        if last_month_plannings2 and last_month_plannings2.count() > 2:
            last_defined_month2 = last_month_plannings2[1].production_month

        # Get the last defined capacity, use it if earlier than last_defined_month
        last_defined_capacity1 = Capacity.objects.filter(capacity__gt=0, production_unit=1).order_by('-day').first()
        last_defined_capacity2 = Capacity.objects.filter(capacity__gt=0, production_unit=2).order_by('-day').first()

        if last_defined_capacity1 and last_defined_capacity1.day < last_defined_month1:
            last_defined_month1 = MonthPlanning.get_for_date(last_defined_capacity1.day,1).production_month

        if last_defined_capacity2 and last_defined_capacity2.day < last_defined_month2:
            last_defined_month2 = MonthPlanning.get_for_date(last_defined_capacity2.day,2).production_month

        # Do not show more than 2 year anyway
        if last_defined_month1 > today + relativedelta(years=2):
            last_defined_month1 = today + relativedelta(years=2)

        if last_defined_month2 > today + relativedelta(years=2):
            last_defined_month2 = today + relativedelta(years=2)

        month_plannings1 = MonthPlanning.objects.filter(
            production_unit=1,
            production_month__gt=today - relativedelta(months=1),
            production_month__lte=last_defined_month1,
        )

        month_plannings2 = MonthPlanning.objects.filter(
            production_unit=2,
            production_month__gt=today - relativedelta(months=1),
            production_month__lte=last_defined_month2,
        )


        schedule_months1 = [
            {
                'month': schedule_month.production_month.strftime("%B-%Y"),
                'open': schedule_month.has_available_spots(),
            }
            for schedule_month in month_plannings1
        ]

        schedule_months2 = [
            {
                'month': schedule_month.production_month.strftime("%B-%Y"),
                'open': schedule_month.has_available_spots(),
            }
            for schedule_month in month_plannings2
        ]


        month_list = {
            1 : schedule_months1,
            2 : schedule_months2,
        }

        dealership_ids=[]
        series_list = {}
        model_list= []

        if (self.request.user.is_superuser):
            for model in Model.objects.all():
                series = {
                    model.id : [
                        {
                            'id': series.id,
                            'production_unit': series.production_unit,
                            'name': '%s (%s)' % (series.name, series.code),
                        }for series in Series.objects.filter(model_id=model.id).order_by('name')
                    ]
                }
               
                mylist={'id':model.id ,'name':model.name }
                model_list.append(mylist)
                series_list.update(series)
                
        else:
            print ('Else Part')
            try:
                user=self.request.user
                dealership_ids = user.dealershipuser.get_dealership_ids()
                for model in Model.objects.all():
                    series = {
                        model.id : [
                            {
                                'id': series.id,
                                'production_unit': series.production_unit,
                                'name': '%s (%s)' % (series.name, series.code),
                            }for series in Series.objects.filter(model_id=model.id,dealerships__in=dealership_ids).order_by('name')
                        ]
                    }

                    series_list.update(series)
                    # print (series)
                    if  series[model.id]:
                        mylist={'id':model.id ,'name':model.name }
                        model_list.append(mylist)
                    # print (len(series))
                    series_list.update(series)

            
            except DealershipUser.DoesNotExist:
                return self.none()

        context = {
            # 'models': [
            #     {
            #         'id': model.id,
            #         'name': model.name,
            #     } for model in Model.objects.all().order_by('name') if model.series_set.filter(dealerships__in=dealership_ids)
            # ],
            'models' : model_list,
            'series_list' : series_list,

            'month_list': month_list,
        }

        return context