from django.core.exceptions import ImproperlyConfigured
from django.views.generic import ListView
from django_tables2.views import SingleTableView
from rules.contrib.views import PermissionRequiredMixin


class _GenericListView(PermissionRequiredMixin, SingleTableView, ListView):
    """
    This is not yet public but at some point may be made public if we need custom
    form handling; for now use FilterSetListView instead
    """
    template_name = 'newage/generic/list.html'

    table_pagination = {
        # 'page': self.request.GET.get('page', 1),
        'per_page': 50,
    }

    """
    number of columns for filter form
    (up the template to render this properly)
    """
    filter_columns = 1

    def __init__(self, *args, **kwargs):
        super(_GenericListView, self).__init__(*args, **kwargs)

    def get_form(self):
        return None

    def get_context_data(self, **kwargs):
        context = super(_GenericListView, self).get_context_data(**kwargs)
        context['help_code'] = 'order_list'
        context['submit_url'] = self.request.path
        context['form'] = self.get_form()
        return context


class FilterSetListView(_GenericListView):
    filter_class = None
    filter_columns = 3

    def __init__(self, *args, **kwargs):
        super(FilterSetListView, self).__init__(*args, **kwargs)
        self.filter = None

    def get_filter(self, queryset):

        if self.filter_class is None:
            raise ImproperlyConfigured(
                '{0} is missing the {1} attribute. Define {0}.{1}, or override {0}.{2}().'
                    .format(self.__class__.__name__, 'filter_class', 'get_filter')
            )

        filter = self.filter_class(self.request.GET, queryset=queryset)
        return filter

    # If you want to dynamically create a queryset, then is easier to override
    # get_queryset_unfiltered() rather than get_queryset() otherwise you
    # will need to manually apply the filtering yourself
    def get_queryset_unfiltered(self):
        queryset = super(FilterSetListView, self).get_queryset()
        return queryset

    def get_queryset(self):
        queryset_unfiltered = self.get_queryset_unfiltered()
        self.filter = self.get_filter(queryset_unfiltered)

        return self.filter.qs

    def bootstrapify_widgets(self, form):
        # add in bootstrap form control class; there must be a better way than this but
        # it seems to involve replacing all of the django-filters filters. This seems like
        # the least invasive option
        for field_name, field in list(form.fields.items()):
            widget = field.widget
            classes = widget.attrs.get('class', '').split()
            if 'form-control' not in classes:
                widget.attrs['class'] = ' '.join(classes + ['form-control'])
        return form

    def get_form(self):
        """
        If you expect bootstrap-styled form controls, remember to call bootstrapify_widgets() on the output
        """
        return self.filter.form

    def get_context_data(self, **kwargs):
        context = super(FilterSetListView, self).get_context_data(**kwargs)
        context['filter'] = self.filter
        context['collapsed'] = True     # TODO: be smarter about this
        context['filter_columns'] = self.filter_columns
        return context
