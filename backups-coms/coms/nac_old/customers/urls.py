from __future__ import absolute_import
from django.urls import path, re_path
from django.conf.urls import url

from django.views.decorators.csrf import csrf_exempt

from .views.leads_api import LeadsAPIView
from .views.leads_api import MyLogoutTest


urlpatterns_api = [
    url(r'^$', LeadsAPIView.as_view()),
    re_path(r'logout$', MyLogoutTest.as_view()),
   
]
