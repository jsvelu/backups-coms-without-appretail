import logging

from django.urls import reverse
from django.db.models.query import Prefetch
from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST

from caravans.models import Model
from caravans.models import Series
from caravans.models import SeriesSKU
from caravans.models import SKU
from caravans.models import SKUCategory
from caravans.serializers import ModelSerializer


class UpdateSeriesSKU(viewsets.ViewSetMixin, APIView):
    permission_required = 'caravans.change_model'

    def update(self, request, pk):
        data = request.data

        # Do not use qs.filter().update(...) as it doesn't trigger pre/post save signals and won't create an Audit instance
        # https://code.djangoproject.com/ticket/12184
        try:
            ssku = SeriesSKU.objects.get(pk=pk)
            ssku.availability_type = data.get('availability_type')
            ssku.is_visible_on_spec_sheet = data.get('print_visible')
            ssku.contractor_description = data.get('contractor_description')
            ssku.save()
        except SeriesSKU.DoesNotExist:
            pass

        return Response()


class UpdateSeries(viewsets.ViewSetMixin, APIView):
    permission_required = 'caravans.change_model'

    def update(self, request, pk):
        data = request.data

        try:
            series = Series.objects.get(pk=pk)
        except Series.DoesNotExist:
            return Response()

        availability_type = data.get('availability_type')

        # Do not use qs.filter().update(...) as it doesn't trigger pre/post save signals and won't create an Audit instance
        # https://code.djangoproject.com/ticket/12184
        for ssku in series.seriessku_set.filter(sku__sku_category_id=data.get('department_id')):
            ssku.availability_type = availability_type
            ssku.save()

        return Response()


class ModelsAPIView(APIView):
    permission_required = 'caravans.change_model'

    def __init__(self):
        self.series_count = 0

    def post(self, request, *args, **kwargs):
        # **** to test model_items through api interface ****
        #return JsonResponse({'data': self.model_skus_by_series(1)})
        if request.data.get('type') == 'models':
            return JsonResponse(self.models_data())
        elif request.data.get('type') == 'model_items':
            return JsonResponse({'items': self.items_for_model_category(request.data.get('model_id'), request.data.get('category_id'))})
        elif request.data.get('type') == 'availability_types':
            return JsonResponse({'list': [{'id':availability_type[0], 'title':availability_type[1]} for availability_type in SeriesSKU.AVAILABILITY_TYPE_CHOICES]})
        elif request.data.get('type') == 'update':
            return self.process_update(request.data.get('model_id'), request.data.get('model_data'))
        elif request.data.get('type') == 'clone_series':
            return self.clone_series(request.data)
        else:
            return JsonResponse({'list': [{'id': m.id, 'title': m.name} for m in Model.objects.all()]})

    def clone_series(self, data):
        old_series = Series.objects.get(id=data.get('series_id'))

        if Series.objects.filter(model_id=data.get('model_id'), code=data.get('series_code')).exists():
            return Response(data='Series code already exists', status=HTTP_400_BAD_REQUEST)

        new_series = Series(model_id=data.get('model_id'),
                            name=data.get('series_title'),
                            code=data.get('series_code'),
                            production_unit=data.get('production_unit'),
                            wholesale_price=old_series.wholesale_price,
                            retail_price=old_series.retail_price)
        new_series.save()
        old_series_skus = SeriesSKU.objects.filter(series_id=data['series_id'])
        new_skus = []
        for old_series_sku in old_series_skus:
            old_series_sku.pk = None
            old_series_sku.series = new_series
            new_skus.append(old_series_sku)
        SeriesSKU.objects.bulk_create(new_skus)

        return JsonResponse({'result': 'success', 'message': "Series Cloned Successfully"})

    def process_update(self, model_id, categories):
        try:
            for (category_key1, category_value1) in categories.items():
                for (category_key2, category_value2) in category_value1['groups'].items():
                    for (item_key2, item_value2) in category_value2['items'].items():
                        self.update_series_sku(item_value2['series'])
                    for (category_key3, category_value3) in category_value2['groups'].items():
                        for (item_key3, item_value3) in category_value3['items'].items():
                            self.update_series_sku(item_value3['series'])

            return JsonResponse({'result': 'success', 'message': "Model Saved Successfully"})
        except BaseException:
            return JsonResponse({'result': 'fail', 'message': "Unable to Save Model"})

    def update_series_sku(self, series_sku_data):
        try:
            for (series_sku_key, series_sku_value) in series_sku_data.items():
                series_sku = SeriesSKU.objects.get(pk=series_sku_value['id'])
                series_sku.availability_type = series_sku_value['availability_type']
                series_sku.is_visible_on_spec_sheet = series_sku_value['print_visible']
                series_sku.save()
        except BaseException as e:
            logging.warning(str(e))

    def models_data(self):
        models_data = ModelSerializer(Model.objects.all(), many=True).data

        categories = [
            {
                'id': category.id,
                'title': category.name,
                'order': category.screen_order,
                'groups': [
                    {
                        'id': department.id,
                        'title': department.name,
                        'order': department.screen_order,
                        'items': []
                    }
                    for department in category.skucategory_set.filter(is_archived=False)
                ],
            }
            for category in SKUCategory.objects.filter(parent=SKUCategory.top(), is_archived=False).prefetch_related('skucategory_set')
        ]

        return {
            'models': models_data,
            'categories': categories,
        }

    def items_for_model_category(self, model_id, category_id):
        items = []
        model_series = Series.objects.filter(model_id=model_id).order_by('code')
        series_ids = set([model_series_item.id for model_series_item in model_series])

        # Create any missing SeriesSKU's
        for series in model_series:
            missing = SKU.objects.exclude(seriessku__series=series)
            SeriesSKU.objects.bulk_create(
                [SeriesSKU(series=series,
                           sku=sku,
                           availability_type=SeriesSKU.AVAILABILITY_NOT_USED,
                           is_visible_on_spec_sheet=sku.is_visible) for sku in missing])

        skus = SKU.objects.filter(sku_category_id=category_id, is_archived=False).prefetch_related(
            Prefetch('seriessku_set', queryset=SeriesSKU.objects.select_related('series').order_by("series__code"))
        )

        for sku in skus:
            # Faster to filter the seriessku_set in python, rather than using .filter()
            series_skus = [{
                'series_id': series_sku.series.id,
                'series_name': series_sku.series.name,
                'series_code': series_sku.series.code,
                'series_link': reverse('admin:caravans_series_change', args=[series_sku.series.id]),
                'id': series_sku.pk,
                'availability_type': series_sku.availability_type,
                'print_visible': series_sku.is_visible_on_spec_sheet,
                'contractor_description': series_sku.contractor_description,
            } for series_sku in sku.seriessku_set.all() if series_sku.series_id in series_ids]

            items.append({
                'id': sku.pk,
                'title': sku.name,
                'note': sku.description,
                'public_description': sku.public_description or sku.description,
                'code': sku.code,
                'rrp': sku.retail_price,
                'photo': sku.photo.url if sku.photo else None,
                'series': series_skus,
            })

        return items
