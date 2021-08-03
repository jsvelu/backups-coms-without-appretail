import os as _os
import platform as _platform

_dev_hosts = [
    # general catch-all
    '.internal.alliancesoftware.com.au',
    'dave-macbook',
    'zeratul',
    'Richards-MacBook-Pro.local',
]

# can't just use use HOSTNAME as /usr/bin/env wipes it
_hostname = _platform.node()
if _os.environ.get('DJANGO_SETTINGS_MODULE') and _os.environ.get('DJANGO_SETTINGS_MODULE') != __name__:
    # Do nothing; handled by django importing a custom settings module directly
    pass
elif any(_hostname.endswith(dev_host) for dev_host in _dev_hosts) or _os.environ['LOCAL_IP_ADDR'] != "":
    from .dev import *
else:
    # Normally you should not import ANYTHING from Django directly
    # into your settings, but ImproperlyConfigured is an exception.
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('Unrecognised host %s in %s' % (_hostname, __name__))

