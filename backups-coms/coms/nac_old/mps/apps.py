from django.apps import AppConfig


class MpsConfig(AppConfig):
    name = 'mps'
    verbose_name = "Mps"

    def ready(self):
        # signals are registered through decorators
        import mps.signals
