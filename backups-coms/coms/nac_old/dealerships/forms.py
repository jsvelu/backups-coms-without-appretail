import django.forms as forms
import django_filters as filters


class DealershipUserChoiceFilter(filters.Filter):
    # TODO: If you use this class and need to impose object visibility constraints,
    # please do so!
    field_class = forms.CharField

    def __init__(self, name, lookup_expr='icontains', *args, **kwargs):
        """
        :param name: field name that corresponds to a DealershipUser foreign key
        :param lookup:
        """
        name += '__user_ptr__name'
        super(DealershipUserChoiceFilter, self).__init__(field_name=name, lookup_expr=lookup_expr, *args, **kwargs)
