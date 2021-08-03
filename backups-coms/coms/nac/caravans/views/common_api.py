import logging

from django.core import serializers
from django.db.models import Q
from django.db.models.expressions import Value
from django.db.models.functions import Concat
from django.http import JsonResponse
from rest_framework.decorators import APIView

from caravans import models
from customers.models import Customer
from customers.serializers import CustomerSerializer
from dealerships.models import Dealership
from newage.models import Suburb
from newage.serializers import SuburbSerializer
from orders.models import Order


# API calls used by multiple views
class CommonAPIView(APIView):
    permission_required = "newage.view_commons"

    def post(self, request, *args, **kwargs):
        # results = self.lookup_quote('')
        # return JsonResponse({'list': results})

        results = []
        if request.data.get('type') == 'uom_lookup':
            result = self.lookup_uom(request.data.get('filter'))
        elif request.data.get('type') == 'suburb_lookup':
            result = self.lookup_suburb(request.data.get('filter'))
        elif request.data.get('type') == 'lead_lookup':
            result = self.lookup_lead(request.data.get('filter'))
        elif request.data.get('type') == 'chassis_lookup':
            result = self.lookup_chassis(request.data.get('chassis_string'))
        elif request.data.get('type') == 'customer_lookup':
            result = self.lookup_customer(request.data)
        else:
            results.append({
                'id': 1,
                'title': request.data.get('filter')
            })

        return JsonResponse({'list': result})

    def lookup_uom(self, flt):
        uom = models.UOM.objects.all().filter(Q(name__contains=flt))
        return [{'id': o.id, 'title': o.name} for o in uom]

    def lookup_suburb(self, flt):
        subs = Suburb.objects.all().filter(name__icontains=flt)
        return SuburbSerializer(subs, many=True).data

    def lookup_lead(self, flt):
        leads = Customer.objects.all().filter(Q(first_name__icontains=flt) | Q(last_name__icontains=flt)). \
            prefetch_related("physical_address", "physical_address__suburb", "physical_address__suburb__post_code",
                             "postal_address", "postal_address__suburb", "postal_address__suburb__post_code",
                             "delivery_address", "delivery_address__suburb", "delivery_address__suburb__post_code")

        lead_list = [{'id': lead.id, 'title': lead.first_name + " " + lead.last_name + " - " +
                                              ("No Address Information" if lead.physical_address is None else str(
                                                  lead.physical_address)),
                      'lead': serializers.serialize('json', [lead], ensure_ascii=False),
                      'physical_address': None if lead._physical_address_cache is None else serializers.serialize('json', [lead._physical_address_cache]),
                      'physical_address_suburb': None if lead._physical_address_cache is None else serializers.serialize('json', [lead._physical_address_cache.suburb]),
                      'physical_address_post_code': None if lead._physical_address_cache is None else serializers.serialize('json', [
                          lead._physical_address_cache.suburb.post_code]),
                      'postal_address': None if lead._postal_address_cache is None else serializers.serialize('json', [lead._postal_address_cache]),
                      'postal_address_suburb': None if lead._postal_address_cache is None else serializers.serialize('json', [lead._postal_address_cache.suburb]),
                      'postal_address_post_code': None if lead._postal_address_cache is None else serializers.serialize('json', [
                          lead._postal_address_cache.suburb.post_code]),
                      'delivery_address': None if lead._delivery_address_cache is None else serializers.serialize('json', [lead._delivery_address_cache]),
                      'delivery_address_suburb': None if lead._delivery_address_cache is None else serializers.serialize('json', [lead._delivery_address_cache.suburb]),
                      'delivery_address_post_code': None if lead._delivery_address_cache is None else serializers.serialize('json', [
                          lead._delivery_address_cache.suburb.post_code]),
                      } for lead in leads]

        return lead_list

    def lookup_chassis(self, flt):
        orders = Order.objects.filter(chassis__contains=flt)
        results = []
        for order in orders:
            results.append({'id': order.id, 'title': order.chassis})

        return results

    def lookup_customer(self, data):
        filter_str = data['filter']
        if data.get('dealership'):
            dealership_ids = [data.get('dealership')]
        else:
            dealership_ids = [d.id for d in Dealership.objects.filter(dealershipuser=self.request.user)]

        if dealership_ids:
            customers = Customer.objects.filter(appointed_dealer_id__in=dealership_ids)
        else:
            customers = Customer.objects.all()

        customers = customers\
            .annotate(full_name=Concat('first_name', Value(' '), 'last_name'))\
            .filter(full_name__icontains=filter_str)\
            .select_related(
                'physical_address__suburb__post_code__state',
                'delivery_address__suburb__post_code__state',
                'postal_address__suburb__post_code__state'
            )

        return CustomerSerializer(customers, many=True).data
