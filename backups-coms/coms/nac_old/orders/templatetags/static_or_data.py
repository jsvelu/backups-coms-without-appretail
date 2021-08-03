import base64
import mimetypes

from django import template
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.templatetags.staticfiles import static
import requests
import six

register = template.Library()

@register.simple_tag
def static_or_data(file_location, mode, mime_type = None):
    """
    Return a static/S3 file URL (if mode is 'URL') or the file as Base64 encoded data (if mode is 'DATA')
    :param file_location: static file path relative to static root or a FileField/ImageField
    :param mode: one of 'DATA' or 'URL'
    :param mime_type: the MIME-type of the file. Attempts to guess from extension if not supplied
    :return: static file location or Base64 encoded data URI
    """

    if mode not in ('DATA', 'URL'):
        raise ValueError("The given mode {} is not supported. Only 'DATA' and 'URL' are authorised.".format(mode))

    path_or_data = None
    if isinstance(file_location, six.string_types):
        if mode == 'DATA':
            if file_location.startswith('/'):
                file_location = file_location[1:]
            path_or_data = finders.find(file_location)
        elif mode == 'URL':
            path_or_data = static(file_location)
    else:
        if mode == 'DATA':
            file_path = file_location.url

            # Attempt to guess the MIME-type if not supplied
            if mime_type is None:
                pure_file_path = file_path[:file_path.find('?')]
                mime_type, _ = mimetypes.guess_type(pure_file_path)

            if mime_type is None:
                raise ValueError('Unable to guess the MIME-type for {}'.format(file_path))

            try:
                image_data = requests.get(file_path).content
            except requests.RequestException as e:
                raise ValueError('Unable to retrieve image at {}'.format(file_path), e)

            encoded_data = base64.b64encode(image_data)
            path_or_data = 'data:{};base64,{}'.format(mime_type, encoded_data)
        elif mode == 'URL':
            path_or_data = file_location.url

    return path_or_data if path_or_data is not None else ''
