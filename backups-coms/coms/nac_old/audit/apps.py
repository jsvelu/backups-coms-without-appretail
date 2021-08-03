from django.apps import AppConfig


class AuditConfig(AppConfig):
    name = 'audit'
    verbose_name = "Audit"

    def ready(self):
        import audit.signals
