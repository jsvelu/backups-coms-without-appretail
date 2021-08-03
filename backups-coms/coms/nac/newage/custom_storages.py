from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


# Define custom storage classes so we can have media and static files in
# separate directories on S3
class StaticStorage(S3Boto3Storage):
    location = getattr(settings, 'STATICFILES_LOCATION', None)

class MediaStorage(S3Boto3Storage):
    location = getattr(settings, 'MEDIAFILES_LOCATION', None)
