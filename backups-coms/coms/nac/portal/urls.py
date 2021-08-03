from django.conf.urls import url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from portal.views import DisplayCollectionView
from portal.views import DisplayPictureView
from portal.views import PhotoManagerView
from portal.views import PhotoOpsView

app_name = 'portal'

urlpatterns = [
    url(r'^manage_photos/(?P<build_id>\d+)/$', PhotoManagerView.as_view(), name="manage_photos"),
    url(r'^photo_op/(?P<build_id>\d+)/$', PhotoOpsView.as_view(), name="photo_op"),
    url(r'^view/(?P<url_hash>.*)/$', DisplayCollectionView.as_view(), name="display_collection"),
    url(r'^view_photo/(?P<image_type>.*)/(?P<image_id>\d+)/$', DisplayPictureView.as_view(), name="display_picture"),
]
