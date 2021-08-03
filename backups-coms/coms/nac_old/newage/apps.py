from django.apps import AppConfig
import os
import sys


class NewageConfig(AppConfig):
    name = 'newage'
    verbose_name = "Newage"

    def ready(self):
        import newage.signals
        import newage.checks
