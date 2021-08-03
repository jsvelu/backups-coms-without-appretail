from django.conf.urls import url

from quality import views

app_name = 'quality'

urlpatterns = [
    url(r'list/$', views.OrderListView.as_view(), name='list'),
]

urlpatterns_api = []
