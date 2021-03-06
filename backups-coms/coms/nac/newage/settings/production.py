

from .aws_base import *

########## HOST CONFIGURATION
# See: https://docs.djangoproject.com/en/1.5/releases/1.5/#allowed-hosts-required-in-production
ALLOWED_HOSTS = [
    '127.0.0.1',
]
########## END HOST CONFIGURATION

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-subject-prefix
EMAIL_SUBJECT_PREFIX = '[New Age PROD] '

BODY_ENV_CLASS = 'env-prod'

CSRF_COOKIE_SECURE = True

EGM_API_USERNAME = get_env_setting('EGM_API_USERNAME')
EGM_API_PASSWORD = get_env_setting('EGM_API_PASSWORD')
EGM_MANUFACTURE_NAME = 'New Age'
EGM_IDENTIFICATION_TOKEN = get_env_setting('EGM_IDENTIFICATION_TOKEN')
EGM_DEFAULT_ACTION_TYPE = 'walkin'

# Salesforce settings
SALESFORCE_API_BASE_URL = 'https://api-prod.qrsolutions.com.au/QRSagNewAGEAPI'
SALESFORCE_API_AUTH = '6221K74M-a6s9-11f6-80j5-76304aw2esb1'

# AWS S3 access details
DEFAULT_FILE_STORAGE = 'newage.custom_storages.MediaStorage'
AWS_STORAGE_BUCKET_NAME = 'coms-prod'
AWS_DEFAULT_ACL = None

MEDIAFILES_LOCATION = 'media'
