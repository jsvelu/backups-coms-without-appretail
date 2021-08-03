from django.conf.urls import url
from django.conf.urls import *

from mps import views

app_name = 'mps'

urlpatterns = [
        url(r'^$', views.MpsIndexView.as_view(), name='index'),
		url(r'^sales/$', views.SalesReportsView.as_view(),{'dealership_id':'0','date_from':'','date_to':''},name='sales'),
		url(r'^runsheet/(?P<show_id>\d*)', views.RunsheetView.as_view(), name='runsheet'),
		url(r'^sales/(?P<dealership_id>-?\d*)/(?P<date_from>\d{2}-\d{2}-\d{4}\d*)/(?P<date_to>\d{2}-\d{2}-\d{4}\d*)/$', views.SalesView.as_view(), name='sales_csv'),
		url(r'^monthsales/(?P<dealership_id>-?\d*)/(?P<date_from>\d{2}-\d{2}-\d{4}\d*)/(?P<date_to>\d{2}-\d{2}-\d{4}\d*)/$', views.MonthSalesView.as_view(), name='monthsales_csv'),
		url(r'^schedule_csv/(?P<type>\w*)/(?P<date_from>\d{4}-\d{2}-\d{2}\d*)/(?P<date_to>\d{4}-\d{2}-\d{2}\d*)/$', views.ScheduleCsvView.as_view(), name='invoice_csv'),
		url(r'^stock/(?P<dealership_id>-?\d*)/$', views.StockView.as_view()),
		url(r'^data_extract/(?P<type>\w*)/(?P<dealership_id>-?\d*)/(?P<date_from>\d{2}-\d{2}-\d{4}\d*)/(?P<date_to>\d{2}-\d{2}-\d{4}\d*)/$', views.DataExtractView.as_view(), name='data_extract'),
		url(r'^stock_data_extract/(?P<type>\w*)/(?P<dealership_id>-?\d*)/$', views.StockDataExtractView.as_view(), name='stock_data_extract'),
    ]
