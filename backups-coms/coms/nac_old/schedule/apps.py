from django.apps import AppConfig


class ScheduleConfig(AppConfig):
    name = 'schedule'
    verbose_name = "Scheduling"

    def ready(self):
        # signals are registered through decorators
        import schedule.signals
