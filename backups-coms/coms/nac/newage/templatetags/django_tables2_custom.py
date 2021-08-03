# coding: utf-8



from collections import OrderedDict
import re

from django import template
from django.core.exceptions import ImproperlyConfigured
from django.template import Node
from django.template import TemplateSyntaxError
from django.utils.html import escape
from django.utils.http import urlencode

register = template.Library()
kwarg_re = re.compile(r"(?:(.+)=)?(.+)")
context_processor_error_msg = (
    'Tag {%% %s %%} requires django.template.context_processors.request to be '
    'in the template configuration in '
    'settings.TEMPLATES[]OPTIONS.context_processors) in order for the included '
    'template tags to function correctly.'
)


def token_kwargs(bits, parser):
    """
    Based on Django's `~django.template.defaulttags.token_kwargs`, but with a
    few changes:

    - No legacy mode.
    - Both keys and values are compiled as a filter
    """
    if not bits:
        return {}
    kwargs = OrderedDict()
    while bits:
        match = kwarg_re.match(bits[0])
        if not match or not match.group(1):
            return kwargs
        key, value = match.groups()
        del bits[:1]
        kwargs[parser.compile_filter(key)] = parser.compile_filter(value)
    return kwargs


class MultiValueQuerystringNode(Node):
    def __init__(self, updates, removals):
        super(MultiValueQuerystringNode, self).__init__()
        self.updates = updates
        self.removals = removals

    def render(self, context):
        if 'request' not in context:
            raise ImproperlyConfigured(context_processor_error_msg % 'multivaluequerystring')

        params = dict(context['request'].GET)

        for key, value in list(self.updates.items()):
            key = key.resolve(context)
            value = value.resolve(context)
            if key not in ('', None):
                if key in params:
                    params[key] = [value] + params[key]
                else:
                    params[key] = [value]
        for removal in self.removals:
            params.pop(removal.resolve(context), None)
        return escape('?' + urlencode(params, doseq=True))


# {% multivaluequerystring "name"="abc" "age"=15 %}
@register.tag
def multivaluequerystring(parser, token):
    '''
    Creates a URL (containing only the querystring [including "?"]) derived
    from the current URL's querystring, by updating it with the provided
    keyword arguments, adding several times the same argument if required.

    Example (imagine URL is ``/abc/?gender=male&sort=name``)::

        {% querystring "sort"="age" "age"=20 %}
        ?sort=age&sort=name&gender=male&age=20
        {% querystring "sort"="age" without "gender" %}
        ?sort=age&sort=name

    '''
    bits = token.split_contents()
    tag = bits.pop(0)
    updates = token_kwargs(bits, parser)
    # ``bits`` should now be empty of a=b pairs, it should either be empty, or
    # have ``without`` arguments.
    if bits and bits.pop(0) != 'without':
        raise TemplateSyntaxError("Malformed arguments to '%s'" % tag)
    removals = [parser.compile_filter(bit) for bit in bits]
    return MultiValueQuerystringNode(updates, removals)
