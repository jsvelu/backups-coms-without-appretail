from __future__ import absolute_import

from django.conf.urls import url
from django.contrib.auth.decorators import permission_required
from rest_framework.routers import SimpleRouter

from caravans.views import category_api

from .views import common_api
from .views import export
from .views import importer
from .views import models_api
from .views import uom_api
from .views import views

router = SimpleRouter()
router.register(r'category', category_api.CategoryViewSet)

urlpatterns_api = router.urls

# TODO: There is no reason that these should be separate namespaces
urlpatterns_api_models = [
    url(r'^$', models_api.ModelsAPIView.as_view()),
    url(r'series-sku/(?P<pk>\d+)$', models_api.UpdateSeriesSKU.as_view({'post': 'update'})),
    url(r'series/(?P<pk>\d+)$', models_api.UpdateSeries.as_view({'post': 'update'})),
]

urlpatterns_api_uom = [
    url(r'^$', uom_api.UOMAPIView.as_view()),
]

urlpatterns_api_common = [
    url(r'^$', common_api.CommonAPIView.as_view()),
]

app_name = 'caravans'

urlpatterns = [
    url(r'^export_sku/$', permission_required('caravans.export_sku')(export.SKUExportView.as_view()), name='sku_export'),
    url(r'^import_sku/$', permission_required('caravans.import_sku')(importer.SKUImportView.as_view()), name='sku_import'),
    url(r'^import_sku/(?P<file>.*)$', permission_required('caravans.import_sku')(importer.SKUImportView.as_view()), name='sku_import'),
    url(r'^specs_full/(?P<series_id>\d+)/$', views.SeriesSpecsFullView.as_view(), name='series_specs_full'),
    url(r'^browse_models$', views.BrowseModelsView.as_view(), name='browse_models'),
    url(r'^browse_models/(?P<series_id>\d+)/floor_plan$', views.BrowseFloorPlanView.as_view(), name='browse_floor_plan'),
    url(r'^browse_models/(?P<series_id>\d+)/specs$', views.BrowseSeriesSpecView.as_view(), name='browse_specs'),
    url(r'^browse_models/(?P<series_id>\d+)/option_upgrade$', views.BrowseOptionUpgradeView.as_view(), name='browse_option_upgrade_specs'),
]


