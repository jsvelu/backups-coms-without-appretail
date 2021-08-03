from django.apps import AppConfig


class NewageConfig(AppConfig):
    name = 'newage'
    verbose_name = "Newage"

    def ready(self):
        import newage.signals
        import newage.checks
