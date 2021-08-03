from django.urls import reverse_lazy
from django.db.models import Prefetch
from django.utils import timezone
from django.views.generic.edit import FormView

from caravans.models import SKU
from help.forms import HelpContentForm
from help.models import HelpContent
from orders.models import Order


class HelpContentView(FormView):
    template_name = 'help/content.html'
    form_class = HelpContentForm
    success_url = reverse_lazy('help:content')

    def get_form_kwargs(self):
        self.help_code = self.kwargs.get('help_code')
        kwargs = super(HelpContentView, self).get_form_kwargs()
        return kwargs

    def get_context_data(self, **kwargs):
        context = super(HelpContentView, self).get_context_data(**kwargs)
        help_object = HelpContent.objects.filter(code=self.help_code).first()
        context['help'] = help_object
        context['sub_heading'] = help_object.name
        context['is_popup'] = True
        return context
