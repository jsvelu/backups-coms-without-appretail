from django.apps import AppConfig


class CrmConfig(AppConfig):
    name = 'crm'
    verbose_name = "CRM"

    def ready(self):
        # signals are registered through decorators
        import crm.signals
