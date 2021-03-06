

import json

from django.http import HttpResponse
from django.utils import timezone
from django.views.generic import TemplateView
from rest_framework.views import APIView
from rules.contrib.views import LoginRequiredMixin

from caravans.models import SeriesSKU
from caravans.models import SKUCategory
from dealerships.models import Dealership
from dealerships.models import DealershipUser
from newage.models import Settings
from newage.tables import TodoTable
from newage.views.todo import TODO_ACTION_LIST
from orders.models import Show
from orders.models import ShowSpecial


class HomePageView(LoginRequiredMixin, TemplateView):
    template_name = 'newage/home.html'


    def get_context_data(self, **kwargs):
        dealership_user = DealershipUser.objects.filter(id=self.request.user.id).first()
        can_apply_specials = dealership_user or self.request.user.has_perm('orders.apply_specials_all')

        dealerships_filter = []
        if can_apply_specials and not dealership_user:
            dealerships_filter = Dealership.objects.all()
        elif dealership_user:
            dealerships_filter = dealership_user.dealerships.all()

        if can_apply_specials:
            # Check that this show special is valid
            special = ShowSpecial.objects.filter(
                id=self.request.GET.get('show-special') if self.request.GET.get('show-special') != '' else None,
                available_from__lte=timezone.now(),
                available_to__gte=timezone.now(),
                dealerships__in=dealerships_filter).first()
            if special:
                self.request.session['show_special'] = self.request.GET.get('show-special')
            else:
                if 'show_special' in self.request.session:
                    del self.request.session['show_special']

        context = super(HomePageView, self).get_context_data(**kwargs)

        settings = Settings.objects.all().first()
        if settings is not None and len(settings.home_page_banner_html):
            context['banner'] = settings.home_page_banner_html

        context['todo_table'] = self.get_todo_table()

        if can_apply_specials:
            specials = ShowSpecial.objects.filter(
                available_from__lte=timezone.now(),
                available_to__gte=timezone.now())
            if not self.request.user.has_perm('orders.apply_specials_all'):
                specials = specials.filter(dealerships__in=dealership_user.dealerships.all()).distinct()

            context['specials'] = [{'id': s.id, 'name': s.name} for s in specials]

        return context

    def get_todo_table(self):
        order_list = []
        for TodoAction in TODO_ACTION_LIST:
            for order in TodoAction.get_order_list(self.request.user):
                order.manage_url = TodoAction.manage_url
                order_list.append(order)

        table = TodoTable(order_list, self.request)

        return table



# TODO: Refactor this to make sensible
class HomeLookupView(APIView):
    permission_required = "newage.view_commons"

    def get(self, request):
        def fetch_results(series_skus):
            results = []
            for series_sku in series_skus:
                sku_json = {}
                sku_json['id'] = series_sku.sku.id
                sku_json['label'] = series_sku.sku.name
                sku_json['value'] = series_sku.sku.name
                results.append(sku_json)
            return results

        # TODO - This function ceased to be used by Mar 2018. If there isn't a need to revive it, the block shall be deleted by Mar 2019.
        if request.GET.get('op') == 'match_dept':
            departments = SKUCategory.objects.filter(name__contains=request.GET.get('term')).order_by('name')
            results = []
            for department in departments:
                department_json = {}
                department_json['id'] = department.id
                department_json['label'] = department.name
                department_json['value'] = department.name
                results.append(department_json)

            mimetype = 'application/json'
            return HttpResponse(json.dumps(results), mimetype)

        if request.GET.get('op') == 'match_item':
            series_id = int(request.GET.get('series_id'))
            series_skus = SeriesSKU.objects.filter(series_id=series_id).filter(
                sku__name__contains=request.GET.get('term')).order_by('sku__name').prefetch_related('sku')

            data = json.dumps(fetch_results(series_skus))
            mimetype = 'application/json'
            return HttpResponse(data, mimetype)
