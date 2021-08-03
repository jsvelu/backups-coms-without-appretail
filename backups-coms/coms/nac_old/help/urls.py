from django.conf.urls import url

from help.views import HelpContentView

app_name = 'help'

urlpatterns = [
    url(r'^(?P<help_code>\w+)', HelpContentView.as_view(), name="content"),
]
