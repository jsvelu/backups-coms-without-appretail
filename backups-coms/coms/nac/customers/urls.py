from __future__ import absolute_import

from django.conf.urls import url

from .views.leads_api import LeadsAPIView

urlpatterns_api = [
    url(r'^$', LeadsAPIView.as_view()),
]
