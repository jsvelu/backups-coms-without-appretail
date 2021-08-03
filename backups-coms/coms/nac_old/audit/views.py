from django.db.models import get_app
from django.db.models import get_models

from newage.views import NewageTemplateView


class AuditAppListView(NewageTemplateView):
    template_name = 'audit/app_list.html'

    def get_context_data(self, **kwargs):
        context = super(AuditAppListView, self).get_context_data(**kwargs)
        app = get_app('my_application_name')
        for model in get_models(app):
            pass
        return context
