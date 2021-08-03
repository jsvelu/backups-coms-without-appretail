from allianceutils.api.mixins import CacheObjectMixin
from allianceutils.api.permissions import GenericDjangoViewsetPermissions
from django.http.response import JsonResponse
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from caravans.models import SKUCategory


class CategoryViewSet(CacheObjectMixin, GenericViewSet):

    class CategoryViewPermissions(GenericDjangoViewsetPermissions):
        actions_to_perms_map = {
            'lookup': ['newage.view_commons'],
        }

    permission_classes = (IsAuthenticated, )
    queryset = SKUCategory.objects

    @action(detail=True, methods=['get'])
    def lookup(self, request, pk):

        categories = self.get_queryset()\
            .filter(name__contains=self.kwargs('term'))\
            .filter(parent__name="Top")
        results = []
        for category in categories:
            category_json = {}
            category_json['id'] = category.id
            category_json['label'] = category.name
            category_json['value'] = category.name
            results.append(category_json)

        return JsonResponse(results)
