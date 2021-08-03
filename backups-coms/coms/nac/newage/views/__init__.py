

from django.views.generic import TemplateView
from rules.contrib.views import LoginRequiredMixin


class AngularView(LoginRequiredMixin, TemplateView):
    template_name = "newage/angular-base.html"

    CONTAINER_CLASSES = {
        'models': 'container-fluid'
    }

    def get_context_data(self, **kwargs):
        context = super(AngularView, self).get_context_data(**kwargs)
        app = kwargs['app']
        context['app'] = app
        context['angular'] = {
            'container_class': self.CONTAINER_CLASSES.get(app, 'container')
        }

        if app == 'orders':
            context['help_code'] = 'order'
        elif app == 'models':
            context['help_code'] = 'model'

        return context

    def output_settings(self):
        from django.conf import settings
        import logging

        for name in dir(settings):
            logging.warning(name + ": " + str(getattr(settings, name)))


class AngularJQueryUIView(AngularView):
    template_name = 'newage/angular-base-jqueryui.html'
