import json

from django.db.models.query_utils import Q
from django.http.response import HttpResponse
from django.views.generic.edit import FormView
from django_tables2 import RequestConfig
from rest_framework.views import APIView

from caravans.models import SKU
from dealerships.models import Dealership
from orders.models import Order
from warranty.forms.listing import WarrantyFilterForm
from warranty.models import WarrantyClaim
from warranty.models import WarrantyClaimNote
from warranty.models import WarrantyClaimPhoto
from warranty.tables import WarrantyClaimTable


class WarrantyListingView(FormView):
    template_name = 'warranty/listing.html'
    form_class = WarrantyFilterForm
    success_url = '/thanks/'

    def get_initial(self):
        initial = super(WarrantyListingView, self).get_initial()
        initial['chassis'] = self.request.GET.get('chassis')
        initial['customer_name'] = self.request.GET.get('customer_name')

        initial['start_date'] = self.request.GET.get('start_date')
        initial['end_date'] = self.request.GET.get('end_date')

        initial['warranty_statuses'] = self.request.GET.getlist('warranty_statuses')
        initial['states'] = self.request.GET.getlist('states')
        initial['model_series'] = self.request.GET.getlist('model_series')
        initial['dealership'] = self.request.GET.getlist('dealership')

        return initial

    def get_allowed_dealerships(self):
        if self.request.user.groups.filter(name='Dealer Sales Rep').exists():
            dealer_choices = Dealership.objects.filter(dealershipuser=self.request.user)
        else:
            dealer_choices = Dealership.objects.all()
        return dealer_choices

    def get_form_kwargs(self):
        kwargs = super(WarrantyListingView, self).get_form_kwargs()
        dealer_choices = [(dealerships.id, dealerships.name) for dealerships in self.get_allowed_dealerships()]
        kwargs['dealership_choices'] = dealer_choices
        return kwargs

    def get_context_data(self, **kwargs):
        data = super(WarrantyListingView, self).get_context_data(**kwargs)

        warranty_list = WarrantyClaim.objects.all()

        if self.request.GET.get('customer_name'):
            warranty_list = warranty_list.filter(Q(order__customer__first_name=self.request.GET.get('customer_name')) |
                                                 Q(order__customer__last_name=self.request.GET.get('customer_name')))

        if self.request.GET.getlist('warranty_statuses'):
            warranty_list = warranty_list.filter(status__in=self.request.GET.getlist('warranty_statuses'))

        if self.request.GET.getlist('states'):
            warranty_list = warranty_list.filter(order__customer__physical_address__suburb__post_code__state_id__in=self.request.GET.getlist('states'))

        if self.request.GET.getlist('model_series'):
            warranty_list = warranty_list.filter(order__series_id__in=self.request.GET.getlist('model_series'))

        allowed_dealerships = [dealership.id for dealership in self.get_allowed_dealerships()]
        if self.request.GET.getlist('dealership'):
            dealer_ids = [dealership for dealership in self.request.GET.getlist('dealership') if int(dealership) in allowed_dealerships]
            warranty_list = warranty_list.filter(order__dealership_id__in=dealer_ids)
        else:
            warranty_list = warranty_list.filter(order__dealership_id__in=allowed_dealerships)

        warranty_table = WarrantyClaimTable(warranty_list)
        RequestConfig(self.request, paginate={'page': self.request.GET.get('page', 1), 'per_page': 50}).configure(warranty_table)
        data['warranty_table'] = warranty_table
        data['sub_heading'] = 'Manage Claims'
        data['help_code'] = 'warranty_list'
        return data


class WarrantyLookupView(APIView):

    permission_required = 'warranty.change_warrantyclaim'
    def get(self, request):
        if request.GET.get('op') == 'match_chassis':
            orders = Order.objects.filter(chassis__contains=request.GET.get('term'))
            results = []
            for order in orders:
                order_json = {}
                order_json['id'] = order.id
                order_json['label'] = order.chassis
                order_json['value'] = order.chassis
                results.append(order_json)

            data = json.dumps(results)
            mimetype = 'application/json'
            return HttpResponse(data, mimetype)

        if request.GET.get('op') == 'match_item':
            skus = SKU.objects.filter(name__contains=request.GET.get('term'))
            results = []
            for sku in skus:
                sku_json = {}
                sku_json['id'] = sku.id
                sku_json['label'] = sku.name
                sku_json['value'] = sku.name
                results.append(sku_json)

            data = json.dumps(results)
            mimetype = 'application/json'
            return HttpResponse(data, mimetype)
