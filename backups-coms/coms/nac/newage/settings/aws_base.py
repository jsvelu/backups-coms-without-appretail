"""Production settings and globals."""



from .base import *

########## HOST CONFIGURATION
# See: https://docs.djangoproject.com/en/1.5/releases/1.5/#allowed-hosts-required-in-production
ALLOWED_HOSTS = [
    # overridden in inherited settings files
]
########## END HOST CONFIGURATION

########## CACHE CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#caches
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
########## END CACHE CONFIGURATION

########## SECURE CONFIGURATION
# SECURE_SSL_REDIRECT = True is not needed as the load balancer will redirect any traffic to SSL
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
########## END SECURE CONFIGURATION

########## EMAIL CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
#EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# INSTALLED_APPS += ('anymail',)
# DEFAULT_FROM_EMAIL = 'noreply@newagecaravans.com.au'
# EMAIL_BACKEND = 'anymail.backends.mandrill.EmailBackend'

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-host
# EMAIL_HOST = get_env_setting('EMAIL_HOST', 'localhost')

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-host-password
# EMAIL_HOST_PASSWORD = get_env_setting('EMAIL_HOST_PASSWORD', '')

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-host-user
# EMAIL_HOST_USER = get_env_setting('EMAIL_HOST_USER', '')

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-port
# EMAIL_PORT = get_env_setting('EMAIL_PORT', 25)

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-subject-prefix
# EMAIL_SUBJECT_PREFIX = '[%s] ' % SITE_NAME

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-use-tls
# EMAIL_USE_TLS = False

# See: https://docs.djangoproject.com/en/dev/ref/settings/#server-email
# SERVER_EMAIL = 'server-error@newagecaravans.com.au'
########## END EMAIL CONFIGURATION

########## DATABASE CONFIGURATION
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': get_env_setting('DB_NAME'),
        'USER': get_env_setting('DB_USER'),
        'PASSWORD': get_env_setting('DB_PASSWORD'),
        'HOST': get_env_setting('DB_HOST'),
        'OPTIONS': {
            'charset': 'utf8',
        }
    }
}
########## END DATABASE CONFIGURATION

########## SECRET CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
SECRET_KEY = get_env_setting('SECRET_KEY')
########## END SECRET CONFIGURATION

# e-GoodManners settings
EGM_API_URL = 'http://datafeed.egmserver.com.au/webservices/newage.asmx?wsdl'


# Just removed the below line to check the password reset function
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'


# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_USE_TLS = True
# EMAIL_PORT = 587
# EMAIL_HOST_USER = 'gvelu4@gmail.com'
# EMAIL_HOST_PASSWORD = 'samtron321$'
# EMAIL_USE_SSL =False

# EMAIL_BACKEND = 'anymail.backends.mandrill.EmailBackend'

EMAIL_HOST = 'smtp.mandrillapp.com'
EMAIL_HOST_USER = 'donotreply@newagecaravans.com.au'
EMAIL_HOST_PASSWORD = 'U1Dj5i0rxKGbpnxlW00ZoA'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

DEFAULT_FROM_EMAIL  = 'it@newagecaravans.com.au'
# SERVER_EMAIL    = 'it@newagecaravans.com.au'

