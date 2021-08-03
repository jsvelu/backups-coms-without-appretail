from django import template
from django.conf import settings
#from webpack_loader.utils import _get_bundle
from django.utils.safestring import mark_safe
from webpack_loader.utils import get_as_tags

register = template.Library()


# We can't simply call render_bundle() because it has already been wrapped in @register.simply_tag
# and we will end up doubly-escaping things
def _render_bundle(bundle_name, extension, config):
    bundle = get_as_tags(bundle_name, extension, config)
    return mark_safe('\n'.join(bundle))


@register.simple_tag
def alliance_bundle(bundle_name, extension='js', config='DEFAULT'):
    """
    A wrapper to the webpack_bundle tag that accounts for the fact that
    - in production builds there will be separate JS + CSS files
    - in dev builds the CSS will be embedded in the webpack JS bundle

    Assumes that each JS file is paired with a CSS file.
    If you are only including JS without extracted CSS then use webpack_bundle, or include a placeholder CSS bundle
        (will just include a webpack stub; if you are using django-compress then overhead from this will be minimal)
    """
    if extension == 'css':
        if settings.DEBUG_WEBPACK:
            return _render_bundle(bundle_name, 'js', config)
        else:
            return _render_bundle(bundle_name, 'css', config)
    elif extension == 'js':
        if settings.DEBUG_WEBPACK:
            # do nothing; the JS will have been included with the CSS already
            return ''
        else:
            return _render_bundle(bundle_name, 'js', config)
    else:
        return _render_bundle(bundle_name, extension, config)
