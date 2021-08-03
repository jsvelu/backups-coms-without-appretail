from collections import OrderedDict
from decimal import Decimal

from django.http.response import HttpResponseForbidden
from django.utils import timezone
from django.views.generic import View
from django.views.generic.base import TemplateView
from rules.contrib.views import PermissionRequiredMixin

from datetime import datetime
from datetime import date

from caravans.models import Model
from caravans.models import Series
from caravans.models import SeriesSKU
from caravans.models import SKUCategory

from dealerships.models import Dealership
from newage.utils import PrintableMixin


class SeriesSpecsFullView(PermissionRequiredMixin, PrintableMixin, View):
    template_name = 'caravans/printable/series_specs_full.html'

    # TODO: check required permission
    permission_required = 'caravans.change_model'

    def get(self, request, *args, **kwargs):
        is_html = bool(request.GET.get('is_html'))
        max_selections_to_list = 12
        series = Series.objects.get(id=self.kwargs.get('series_id'))
        categories = SKUCategory.objects.filter(parent=SKUCategory.top())
        departments = SKUCategory.objects.filter(parent__in=categories)

        category_map = OrderedDict()
        for c in categories.order_by('screen_order'):
            category_map[c.id] = {
                'title': c.name,
                'departments': OrderedDict(),
                'counts': {
                    'standard': 0,
                    'selection': 0,
                    'upgrade': 0,
                    'extra': 0,
                },
            }

        for d in departments.order_by('name'):
            category_map[d.parent.id]['departments'][d.id] = {
                'title': d.name,
                'standard': [],
                'selection': [],
                'x_more_selections': 0, # Count number of selections above max_selections_to_list
                'upgrade': [],
                'extra': [],
            }

        print('Fetching skus ')
        skus = series.seriessku_set.filter(
            sku__sku_category__in=departments,
            is_visible_on_spec_sheet=True) \
            .exclude(availability_type=SeriesSKU.AVAILABILITY_NOT_USED) \
            .select_related('sku__sku_category__parent')

        availability_map = {
            SeriesSKU.AVAILABILITY_STANDARD: 'standard',
            SeriesSKU.AVAILABILITY_SELECTION: 'selection',
            SeriesSKU.AVAILABILITY_UPGRADE: 'upgrade',
            SeriesSKU.AVAILABILITY_OPTION: 'extra',
        }

        for sku in skus:
            category_key = sku.sku.sku_category.parent.id
            department_key = sku.sku.sku_category.id
            item_key = availability_map[sku.availability_type]
            category_map[category_key]['counts'][item_key] += 1
            item_list = category_map[category_key]['departments'][department_key][item_key]

            if sku.availability_type != SeriesSKU.AVAILABILITY_SELECTION or len(item_list) < max_selections_to_list:
                item_list.append({
                    'title': sku.sku.name,
                    'visible': sku.is_visible_on_spec_sheet,
                    'retail': sku.sku.retail_price if sku.sku.retail_price is not None else Decimal((0, (0, 0, 0), -2)),
                })

            if sku.availability_type == SeriesSKU.AVAILABILITY_SELECTION and len(item_list) == max_selections_to_list:
                category_map[category_key]['departments'][department_key]['x_more_selections'] += 1
        

        context_data = {
            'series': series,
            'categories': category_map,
            'date': datetime.now(),
        }

        return self.render_printable(is_html, self.template_name, context_data, pdf_options={"orientation": "landscape"})


class BrowseModelsView(PermissionRequiredMixin, TemplateView):
    permission_required = 'caravans.can_browse_models'
    template_name = 'caravans/browse_models.html'

    def get_context_data(self, **kwargs):
        context = super(BrowseModelsView, self).get_context_data(**kwargs)

        dealerships = Dealership.objects.all()
        if not self.request.user.has_perm('caravans.browse_all_models'):
            dealerships = Dealership.objects.filter(dealershipuser=self.request.user)

        models_list = []
        for model in Model.objects.all():
            for series in model.series_set.filter(dealerships__in=dealerships).distinct():
                if model not in models_list:
                    model.series_list = []
                    models_list.append(model)
                model.series_list.append(series)

        context['models'] = models_list

        photo_list_pass=[]

        series = Series.objects.get(id=15)
        photo_list = str(series.seriesphoto_set.filter(is_main_photo=True).first()).split('|')[0]

        photo_list_pass.append(photo_list)

        series = Series.objects.get(id=13)
        photo_list = str(series.seriesphoto_set.filter(is_main_photo=True).first()).split('|')[0]

        photo_list_pass.append(photo_list)

        series = Series.objects.get(id=55)
        photo_list = str(series.seriesphoto_set.filter(is_main_photo=True).first()).split('|')[0]

        photo_list_pass.append(photo_list)

        context['special'] = photo_list_pass

        return context


class BrowseFloorPlanView(PrintableMixin, View):
    template_name = 'caravans/printable/floor_plan.html'

    def get(self, request, *args, **kwargs):

        series = Series.objects.get(id=self.kwargs.get('series_id'))

        if not self.request.user.has_perm('caravans.can_browse_series', series):
            return HttpResponseForbidden()

        floor_plan = series.seriesphoto_set.filter(is_floor_plan=True).first()

        is_html = bool(request.GET.get('is_html'))
        context_data = {
            'series': series,
            'floor_plan': floor_plan,
        }

        return self.render_printable(is_html, self.template_name, context_data, pdf_options={"margin-top": "20mm", "orientation": "landscape"})


class BrowseSeriesSpecView(PrintableMixin, View):
    template_name = 'caravans/printable/series_specs.html'

    def get(self, request, *args, **kwargs):

        is_html = bool(request.GET.get('is_html'))

        series = Series.objects.get(id=self.kwargs.get('series_id'))

        if not self.request.user.has_perm('caravans.can_browse_series', series):
            return HttpResponseForbidden()

        categories = SKUCategory.objects.filter(parent=SKUCategory.top())
        departments = SKUCategory.objects.filter(parent__in=categories)
        category_map = OrderedDict()
        for c in categories.order_by('screen_order'):
            category_map[c.id] = {
                'title': c.name,
                'standard': [],
                'selection': [],
            }

        skus = series.seriessku_set.filter(
            sku__sku_category__in=departments,
            is_visible_on_spec_sheet=True,
            availability_type__in=(SeriesSKU.AVAILABILITY_STANDARD, SeriesSKU.AVAILABILITY_SELECTION,)) \
            .select_related('sku__sku_category__parent')

        for sku in skus:
            category_key = sku.sku.sku_category.parent.id

            if sku.availability_type == SeriesSKU.AVAILABILITY_STANDARD:
                item_list = category_map[category_key]['standard']
                item_list.append(sku.sku.name)
            elif sku.availability_type == SeriesSKU.AVAILABILITY_SELECTION:
                item_list = category_map[category_key]['selection']
                item_name = sku.sku.sku_category.name
                if item_name not in item_list:
                    item_list.append(item_name)

        context_data = {
            'series': series,
            'categories': category_map,
        }

        return self.render_printable(is_html, self.template_name, context_data, pdf_options={"orientation": "landscape","margin-top":"5"})

class BrowseOptionUpgradeView(PrintableMixin, View):
    template_name = 'caravans/printable/series_option_upgrade_specs.html'

    def get(self, request, *args, **kwargs):

        is_html = bool(request.GET.get('is_html'))

        series = Series.objects.get(id=self.kwargs.get('series_id'))

        if not self.request.user.has_perm('caravans.can_browse_series', series):
            return HttpResponseForbidden()

        categories = SKUCategory.objects.filter(parent=SKUCategory.top())
        departments = SKUCategory.objects.filter(parent__in=categories)
        category_map = OrderedDict()
        for c in categories.order_by('screen_order'):
            category_map[c.id] = {
                'title': c.name,
                'extra': [],
                'upgrade': [],
            }

        skus = series.seriessku_set.filter(
            sku__sku_category__in=departments,
            is_visible_on_spec_sheet=True,
            availability_type__in=(SeriesSKU.AVAILABILITY_OPTION, SeriesSKU.AVAILABILITY_UPGRADE,)) \
            .select_related('sku__sku_category__parent')

        for sku in skus:
            category_key = sku.sku.sku_category.parent.id

            if sku.availability_type == SeriesSKU.AVAILABILITY_OPTION:
                item_list = category_map[category_key]['extra']
                item_list.append({'item_name':sku.sku.name,
                                'item_retail':sku.sku.retail_price,
                                })
            elif sku.availability_type == SeriesSKU.AVAILABILITY_UPGRADE:
                item_list = category_map[category_key]['upgrade']
                # item_name = sku.sku.sku_category.name
                # item_retail = sku.sku.retail_price
                # if item_name not in item_list:
                item_list.append({'item_name':sku.sku.name,
                        'item_retail':sku.sku.retail_price,
                        })

        context_data = {
            'series': series,
            'categories': category_map,
        }
        # print('context_data', context_data)


        return self.render_printable(is_html, self.template_name, context_data, pdf_options={"orientation": "landscape"})
