from django.db.models import Q
from django.http import JsonResponse
from rest_framework.decorators import APIView

from caravans import models


class UOMAPIView(APIView):

    def post(self, request, *args, **kwargs):
        if request.data.get('type') == 'all':
            uom = models.UOM.objects.all()

            filter = request.data.get('search', False)
            if filter:
                uoms = uom.filter(
                    Q(name=filter)
                )
            else:
                uoms = uom

            results = []
            for uom in uoms:
                results.append({
                    'id': uom.id,
                    'name': uom.name
                })

            return JsonResponse({'list': results})

        return JsonResponse({
             'data': 'none'
        })
