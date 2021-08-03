from django.apps import AppConfig


class PortalConfig(AppConfig):
    name = 'portal'
    verbose_name = "Portal"

    def ready(self):
        import portal.signals
