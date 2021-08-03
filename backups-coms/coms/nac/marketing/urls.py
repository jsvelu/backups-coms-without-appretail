from django.conf.urls import url

from marketing.views import ViewMarketingMaterialsView

app_name = 'marketing'

urlpatterns = [
    url(r'^$', ViewMarketingMaterialsView.as_view(), name="view_marketing_materials"),
]
