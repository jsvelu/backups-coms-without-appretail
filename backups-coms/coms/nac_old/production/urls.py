from django.conf.urls import url
from rest_framework.routers import SimpleRouter

from .views import api

router = SimpleRouter()
router.register(r'build', api.BuildViewSet)

# This could potentially be done with drf-nested-routers but that project is not
# terribly mature so doing this directly
urlpatterns_api = router.urls + [
    url(r'^build/(?P<build_id>\d+)/override/(?P<checklist_id>\d+)/$', api.ChecklistOverrideAPIView.as_view()),
    url(r'^build/(?P<build>\d+)/note/(?P<checklist>\d+)/$', api.BuildNoteAPIView.as_view()),
]
