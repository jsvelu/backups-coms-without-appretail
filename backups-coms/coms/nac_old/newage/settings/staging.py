

from .aws_base import *

########## HOST CONFIGURATION
# See: https://docs.djangoproject.com/en/1.5/releases/1.5/#allowed-hosts-required-in-production
ALLOWED_HOSTS = [
    '127.0.0.1',
    '*'
]
########## END HOST CONFIGURATION
DEBUG = True
DEBUG_WEBPACK = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

ADMINS = (
    ('Callum Anderson', 'callum@alliancesoftware.com.au'),
    ('Levi Cameron', 'levi@alliancesoftware.com.au'),
    ('Victor Puska', 'victor@alliancesoftware.com.au'),
    ('Manasi Pathirana', 'manasi@alliancesoftware.com.au'),
)

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-subject-prefix
EMAIL_SUBJECT_PREFIX = '[New Age STAGING] '

BODY_ENV_CLASS = 'env-dev'

EGM_API_USERNAME = 'allianceintergration'
EGM_API_PASSWORD = 'BgVAuh2q5He5mnEsxdG6'
EGM_MANUFACTURE_NAME = 'New Age'
EGM_IDENTIFICATION_TOKEN = 'zTGckmggfnZ2VhWGPqYaLryAdmu8tDkXgpw05g6g0y4cRnCFLv9bj5lrzN56kKCg'
EGM_DEFAULT_ACTION_TYPE = 'walkin'

EGM_TEST_DEALERREP_EMAIL = 'alliance@egmserver.com.au'
EGM_TEST_DEALER_CODE = '2016'

# Salesforce settings
SALESFORCE_API_BASE_URL = 'https://lead-api-test.qrsolutions.com.au/QrsAGNewAGEAPI'
SALESFORCE_API_AUTH = '5316l54j-d6d9-11e6-80f5-76304decesb7'

# AWS S3 access details
DEFAULT_FILE_STORAGE = 'newage.custom_storages.MediaStorage'
AWS_STORAGE_BUCKET_NAME = 'coms-dev'
AWS_DEFAULT_ACL = None

MEDIAFILES_LOCATION = 'media'


