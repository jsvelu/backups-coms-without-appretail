from django.apps import AppConfig


class MarketingConfig(AppConfig):
    name = 'marketing'
    verbose_name = "Marketing"

    def ready(self):
        # signals are registered through decorators
        import marketing.signals
