from django.conf.urls import url

from warranty.views.claim import WarrantyClaimView
from warranty.views.claim import WarrantyEditClaimView
from warranty.views.listing import WarrantyListingView
from warranty.views.listing import WarrantyLookupView

app_name = 'warranty'

urlpatterns = [
    url(r'^$', WarrantyListingView.as_view(), name="listing"),
    url(r'^lookup/$', WarrantyLookupView.as_view(), name="lookup"),
    url(r'^claim/(?P<order_id>[0-9]+)', WarrantyClaimView.as_view(), name="claim"),
    url(r'^edit_claim/(?P<order_id>[0-9]+)', WarrantyEditClaimView.as_view(), name="edit_claim"),
]
