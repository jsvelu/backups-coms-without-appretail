from datetime import datetime
from datetime import timedelta
from distutils.util import strtobool

from allianceutils.views.views import JSONExceptionAPIView
from django.conf import settings
from django.db.models import Q
from django.http.response import HttpResponseBadRequest
from django.http.response import JsonResponse

from caravans.models import Model
from caravans.models import Series
from caravans.models import SeriesSKU
from caravans.models import SKU
from caravans.models import SKUCategory
from orders.models import Order
from orders.models import OrderSKU

ALL_SERIES_ID = "0"
ALL_MODELS_ID = "0"


def _get_sku_availability_types():
    return [
        SeriesSKU.AVAILABILITY_STANDARD,
        SeriesSKU.AVAILABILITY_SELECTION,
        SeriesSKU.AVAILABILITY_UPGRADE,
        SeriesSKU.AVAILABILITY_OPTION,
    ]


def _get_filtered_subcategories(category_id, series_id, model_id):
    """
    Return a list of basic subcategory id/name data in the form {'id': category_id, 'name': category_name} where subcategories are
       * subcategories of category_id
       * visible on the spec sheet
       * selectable on series_id
       * selectable on model_id
    """

    series = [series_id]
    if model_id == ALL_MODELS_ID:
        series = Series.objects.all()
    elif series_id == ALL_SERIES_ID:
        series = Series.objects.filter(model_id=model_id)

    fitting_subcategory_ids = [
        ssku.sku.sku_category_id for ssku in SeriesSKU.objects.prefetch_related('sku').filter(
        is_visible_on_spec_sheet=True,
        availability_type__in=_get_sku_availability_types(),
        series__in=series,
        )
    ]

    subcategories = list(SKUCategory.objects.filter(parent=category_id, id__in=fitting_subcategory_ids).values())


ALL_SERIES_ID = "0"
ALL_MODELS_ID = "0"


def _get_sku_availability_types():
    return [
        SeriesSKU.AVAILABILITY_STANDARD,
        SeriesSKU.AVAILABILITY_SELECTION,
        SeriesSKU.AVAILABILITY_UPGRADE,
        SeriesSKU.AVAILABILITY_OPTION,
    ]


def _get_filtered_subcategories(category_id, series_id, model_id):
    """
    Return a list of basic subcategory id/name data in the form {'id': category_id, 'name': category_name} where subcategories are
       * subcategories of category_id
       * visible on the spec sheet
       * selectable on series_id
       * selectable on model_id
    """

    series = [series_id]
    if model_id == ALL_MODELS_ID:
        series = Series.objects.all()
    elif series_id == ALL_SERIES_ID:
        series = Series.objects.filter(model_id=model_id)

    fitting_subcategory_ids = [
        ssku.sku.sku_category_id for ssku in SeriesSKU.objects.prefetch_related('sku').filter(
        is_visible_on_spec_sheet=True,
        availability_type__in=_get_sku_availability_types(),
        series__in=series,
        )
    ]

    subcategories = list(SKUCategory.objects.filter(parent=category_id, id__in=fitting_subcategory_ids).values())

    subcategories = [
        {
            'id': sub['id'],
            'name': sub['name']
        }
        for sub in subcategories
    ]

    return subcategories


def _get_subitems(klass, item_id):
    item = klass.objects.get(id=item_id)

    subitems = [
        {
            'id': subitem.id,
            #'name': subitem.name,
            'name': subitem.code + ' / ' + subitem.name,
        }
        for subitem in item.series_set.all()
    ]

    return subitems


class GetSeries(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting Series.'

    def get(self, request, model_id):
        try:
            subitems = [{'id': ALL_SERIES_ID, 'name': 'All Series'}]
            if model_id != ALL_SERIES_ID:
                subitems += _get_subitems(Model, model_id)
            return JsonResponse({'data': subitems})
        except Model.DoesNotExist:
            return HttpResponseBadRequest("This model doesn't exist.")


class GetDepartments(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting departments.'

    def get(self, request, category_id, series_id, model_id):
        try:
            return JsonResponse({'data': _get_filtered_subcategories(category_id, series_id, model_id)})
        except SKUCategory.DoesNotExist:
            return HttpResponseBadRequest("This category doesn't exist.")


class GetSkus(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting skus.'

    def get(self, request, department_id, series_id=ALL_SERIES_ID, model_id=ALL_MODELS_ID):
        skus = SKU.objects.filter(sku_category_id=department_id).distinct()

        if series_id != ALL_SERIES_ID:
            skus = skus.filter(
                seriessku__series_id=series_id,
                seriessku__is_visible_on_spec_sheet=True,
                seriessku__availability_type__in=_get_sku_availability_types())
        if model_id != ALL_MODELS_ID:
            skus = skus.filter(
                seriessku__series__model_id=model_id,
                seriessku__is_visible_on_spec_sheet=True,
                seriessku__availability_type__in=_get_sku_availability_types())

        sku_items = [
            {
                'id': sku.id,
                'name': '%s ($%0.2f)' % (sku.name, float(sku.retail_price or 0)),
            }
            for sku in skus
        ]

        return JsonResponse({'data': sku_items})


class Preview(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting order list.'

    def last_day_of_month(self, any_day):
        next_month = any_day.replace(day=28) + timedelta(days=4)
        return next_month - timedelta(days=next_month.day)

    def post(self, request):
        order_query = Order.objects.filter(ordersku__sku_id=request.POST.get('skuId')).exclude(build=None)
        # print(order_query)
        if request.POST.get('seriesId') != ALL_SERIES_ID:
            order_query = order_query.filter(orderseries__series_id=request.POST.get('seriesId'))
        if request.POST.get('modelId') != ALL_MODELS_ID:
            order_query = order_query.filter(orderseries__series__model_id=request.POST.get('modelId'))

        production_dates_subquery = Q(pk=None)
        if strtobool(request.POST.get('withoutProductionDates')):
            production_dates_subquery |= Q(build__build_date__isnull=True)

        if strtobool(request.POST.get('withProductionDates')):
            with_filter = Q(build__build_date__isnull=False)
            if request.POST.get('dateFrom'):
                date_from = datetime.strptime(request.POST.get('dateFrom'), settings.FORMAT_DATE).date()
                with_filter = with_filter & Q(build__build_date__gte=date_from)
            if request.POST.get('dateTo'):
                date_to = datetime.strptime(request.POST.get('dateTo'), settings.FORMAT_DATE).date()
                with_filter = with_filter & Q(build__build_date__lte=date_to)
            production_dates_subquery |= with_filter

        if strtobool(request.POST.get('withScheduleMonths')):
            with_filter = Q(build__build_order__production_month__isnull=False)
            if request.POST.get('monthFrom'):
                month_from = datetime.strptime(request.POST.get('monthFrom'), settings.FORMAT_DATE).date()
                with_filter = with_filter & Q(build__build_order__production_month__gte=month_from)
            if request.POST.get('monthTo'):
                month_to = datetime.strptime(request.POST.get('monthTo'), settings.FORMAT_DATE).date()
                month_to = datetime(month_to.year + (month_to.month / 12), ((month_to.month % 12) + 1), 1)
                with_filter = with_filter & Q(build__build_order__production_month__lt=month_to)
            production_dates_subquery |= with_filter

        order_query = order_query.filter(production_dates_subquery)

        orders = [
            {
                'id': order.id,
                'details': '%s<br/>Schedule Month %s, Production Date: %s' %
                           ((order, order.build.build_order.production_month.strftime(settings.FORMAT_DATE_MONTH), order.build.build_date) if hasattr(order,'build') else (order, 'None', 'None')),
            }
            for order in order_query
        ]

        return JsonResponse({'orders': orders})


class Update(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while updating the orders.'

    def post(self, request):
        order_ids = request.POST.getlist('orderIds[]')
        old_sku_id = request.POST.get('oldSkuId')
        new_sku_id = request.POST.get('newSkuId')

        if not order_ids:
            return JsonResponse({'count': 0})

        first_order = Order.objects.get(id=order_ids[0])
        series_id = first_order.orderseries.series.id
        series_sku = SeriesSKU.objects.get(series_id=series_id, sku_id=new_sku_id)
        new_sku = series_sku.sku

        for order_id in order_ids:
            old_sku = OrderSKU.objects.get(order_id=order_id, sku_id=old_sku_id)
            OrderSKU.objects.get(order_id=order_id, sku_id=old_sku_id).delete(force=True)

            # Retain old SKU's base avail type, retail & wholesale price to ensure the cost of the order doesn't change

            OrderSKU.objects.create(
                order_id=order_id,
                sku_id = new_sku_id,
                base_availability_type=old_sku.base_availability_type,
                retail_price=old_sku.retail_price,
                wholesale_price=old_sku.wholesale_price,
                cost_price=new_sku.cost_price if new_sku.cost_price else 0,
            )

        return JsonResponse({'count': len(order_ids)})
