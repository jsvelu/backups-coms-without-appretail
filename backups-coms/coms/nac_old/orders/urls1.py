from django.urls import re_path

from orders.views import api
from orders.views import prints
from orders.views import views
from orders.views.api import initial_data
from orders.views.api import order_save
from orders.views.api import order_workflow
from orders.views.api import replace_sku
from orders.views.api import status

app_name = 'orders'

urlpatterns = [
    re_path(r'bom/$', prints.BillOfMaterialsView.as_view(), name='bom'),
    re_path(r'list/$', views.OrderListView.as_view(), name='list'),
    re_path(r'list/(?P<customer_name>.+)/$', views.OrderListView.as_view(), name='list'),
    re_path(r'list-quotes/$', views.QuoteListView.as_view(), name='list-quotes'),
    re_path(r'list-cancelled/$', views.CancelledOrderListView.as_view(), name='list-cancelled'),
    re_path(r'list-delivery/$', views.DeliveryOrderListView.as_view(), name='list-delivery'),
    re_path(r'export-cancelled/$', views.ExportCancelledOrderListView.as_view(), name='export-cancelled'),
    re_path(r'export-delivery/$', views.ExportDeliveryOrderListView.as_view(), name='export-delivery'),
    re_path(r'export-all-orders/$', views.ExportOrderListView.as_view(), name='export-all-orders'),
    re_path(r'reassign/$', views.ReassignView.as_view(), name='reassign'),
    re_path(r'scheduleavail/$', views.ScheduleAvailabilityView.as_view(), name='scheduleavail'),
    re_path(r'replace_sku/$', views.ReplaceSku.as_view(), name='replace_sku'),
    re_path(r'showroom/$', views.ShowroomView.as_view(), name='showroom'),
    re_path(r'lookup/$', views.LookupView.as_view(), name='lookup'),
    re_path(r'salesforce_failed/$', views.SalesforceFailedOrdersView.as_view(), name='salesforce_failed'),
    re_path(r'spec/(?P<order_id>\d+)/$', prints.SpecView.as_view(), name='spec'),
    re_path(r'brochure/(?P<order_id>\d+)/$', prints.CustomerBrochureView.as_view(), name='brochure'),
    re_path(r'invoice/(?P<order_id>\d+)/$', prints.InvoiceView.as_view(), name='invoice'),
    re_path(r'autocad/(?P<order_id>\d+)/$', prints.AutoCADExportView.as_view(), name='autocad'),

]

urlpatterns_api = [
    re_path(r'customer_manager$', api.order_workflow.CustomerManager.as_view()),
    re_path(r'sales_rep$', api.order_workflow.SalesRep.as_view()),
    re_path(r'initial-data$', api.initial_data.InitialData.as_view()),
    re_path(r'item-rules$', api.initial_data.ItemRules.as_view()),
    re_path(r'finalize-order$', api.order_workflow.FinalizeOrder.as_view()),
    re_path(r'mass-finalize-orders$', api.order_workflow.MassFinalizeOrders.as_view()),
    re_path(r'cancel-finalize$', api.order_workflow.CancelFinalize.as_view()),
    re_path(r'model-series$', api.initial_data.ModelSeries.as_view()),
    re_path(r'reassign/(?P<show_id>\d+)/(?P<dealership_id>\d+)/(?P<manager_id>\d*)$', api.order_workflow.OrderReassign.as_view()),
    re_path(r'place-order$', api.order_workflow.PlaceOrder.as_view()),
    re_path(r'cancel-order$', api.order_workflow.CancelOrder.as_view()),
    re_path(r'retrieve-order$', api.order_workflow.RetrieveOrder.as_view()),
    re_path(r'request-order$', api.order_workflow.RequestOrder.as_view()),
    re_path(r'reject-order$', api.order_workflow.RejectOrder.as_view()),
    re_path(r'rule-plan-remove$', api.order_workflow.RulePlanRemove.as_view()),
    re_path(r'rule-plan-upload$', api.order_workflow.RulePlanUpload.as_view()),
    re_path(r'save-order$', api.order_save.SaveOrder.as_view()),
    re_path(r'update-salesforce$', api.order_save.UpdateSalesforce.as_view()),
    re_path(r'series-detail$', api.initial_data.SeriesDetail.as_view()),
    re_path(r'series-items$', api.initial_data.SeriesItems.as_view()),
    re_path(r'showroom-data$', api.initial_data.ShowroomData.as_view()),
    re_path(r'showroom2-data$', api.initial_data.ShowroomData.as_view()),
    re_path(r'search-orders$', api.initial_data.SearchOrders.as_view()),


    re_path(r'status$', api.status.Status.as_view()),
    re_path(r'status-history$', api.status.StatusHistory.as_view()),
    re_path(r'status-history-note$', api.status.StatusHistoryNote.as_view()),
    re_path(r'status-update$', api.status.StatusUpdate.as_view()),
    re_path(r'status-delete$', api.status.DeleteDateField.as_view()),

    re_path(r'replace_sku/series/(?P<model_id>\d+)$', api.replace_sku.GetSeries.as_view()),
    re_path(r'replace_sku/departments/(?P<category_id>\d+)/(?P<series_id>\d+)/(?P<model_id>\d+)$', api.replace_sku.GetDepartments.as_view()),
    re_path(r'replace_sku/skus/(?P<department_id>\d+)/$', api.replace_sku.GetSkus.as_view()),  # New SKU Replacement list
    re_path(r'replace_sku/skus/(?P<department_id>\d+)/(?P<series_id>\d+)/(?P<model_id>\d+)', api.replace_sku.GetSkus.as_view()),
    re_path(r'replace_sku/preview/$', api.replace_sku.Preview.as_view()),
    re_path(r'replace_sku/update/$', api.replace_sku.Update.as_view()),
]
