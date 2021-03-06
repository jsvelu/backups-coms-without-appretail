import re

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from django.template.context import Context
from django.template.loader import get_template
from django.utils import timezone

from emails.utils import send_email
from production.models import BuildOrder

EMAIL_TEMPLATE = 'email_base.html'


# TODO: Change the script to remove the --send-email function and use the MAILTO cron functionality
# This means printing the result in text, with verbosity check for the start and end lines, and update the cron job to use -v 0

class Command(BaseCommand):
    help = 'Checks various data problems.'

    _email_content = ''

    def add_arguments(self, parser):

        parser.add_argument('--send-email',
            action='store_true',
            dest='should_send_email',
            help='Sends the output in an email to ADMINS instead of displaying issues.')

    def handle(self, *args, **options):
        self.should_send_email = options.get('should_send_email')

        # Include all check function calls here
        self.check_month_sequence_in_dashboard()

        if self.should_send_email:
            self.send_email()

    def _print(self, html_message, include_in_email=True):
        """
        Prints the outputs to the console or stores it in a variable for email sending.
        If include_in_email is False, message will not be added to the email content.
        """

        if include_in_email:
            self._email_content += '<br>' + html_message

        if not self.should_send_email:
            print(re.sub(r'<.*?>', '', html_message))  # Removes all html tags for console printing

    def send_email(self):
        if not self._email_content:
            return

        html_content = get_template(EMAIL_TEMPLATE).render(Context({
            'content': self._email_content,
        }))

        print(send_email(
            'Check data errors',
            html_content,
            settings.BATCH_EMAIL_FROM,
            settings.BATCH_EMAIL_FROM_NAME,
            [admin[1] for admin in settings.ADMINS]
        ))

    def check_month_sequence_in_dashboard(self):
        previous_content = self._email_content
        self._print('Checking schedule dashboard sequences for all future months:<br>')
        has_errors = False

        current_month = timezone.now().date().replace(day=1)

        build_orders = BuildOrder.objects.filter(production_month=current_month, build__isnull=False)

        while build_orders:
            if build_orders.count() != build_orders.last().order_number:
                has_errors = True
                self._print('Month <strong>{}</strong> have an incorrect sequence in the schedule dashboard.'.format(current_month.strftime('%B %Y')))

            current_month += relativedelta(months=1)
            build_orders = BuildOrder.objects.filter(production_month=current_month, build__isnull=False)

        self._print('<br>Schedule dashboard sequence check completed.<br>')

        if not has_errors:
            self._email_content = previous_content  # Remove all content added in that function
