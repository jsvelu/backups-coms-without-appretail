import errno
import re
import subprocess

from django.conf import settings
from django.core.checks import Error
from django.core.checks import register
from django.core.checks import Tags
from django.core.checks import Warning


@register(Tags.compatibility)
def wkhtmltopdf_version_check(app_configs, **kwargs):
    errors = []

    try:
        process = subprocess.Popen([settings.WKHTMLTOPDF_PATH+'wkhtmltopdf', '--version'], stdout=subprocess.PIPE)
    except OSError as ose:
        if ose.errno != errno.ENOENT:
            raise
        cls = Warning if settings.DEBUG else Error
        errors.append(cls(
            'Could not find wkhtmltopdf',
            hint='Is wkhtmltopdf installed? Is it available on the PATH?',
            obj='wkhtmltopdf',
            id='newage.W001'))
    else:
        version_str, err = process.communicate()

        version_re = re.compile(r'wkhtmltopdf 0\.12\.')

        if not version_re.match(version_str.decode('utf-8')):
            errors.append(
                Error(
                    'The version of wkhtmltopdf is not compatible',
                    obj='wkhtmltopdf',
                    hint='Required version: 0.12.x Current version: %s'  % version_str,
                    id='newage.W002',
                )
            )

    return errors
