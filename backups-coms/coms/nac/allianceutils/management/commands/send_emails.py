import re

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management.base import CommandError
from django.core.validators import validate_email
from django.utils import timezone

from emails.models import EmailTemplate
from emails.utils import generate_email_html_content
from emails.utils import send_email
from orders.models import Order
from schedule.models import MonthPlanning


class Command(BaseCommand):
    help = 'Checks all MonthPlanning instances for email notifications that have an overdue date and have not been sent and send them.'

    def add_arguments(self, parser):

        parser.add_argument('--host',
            dest='host',
            help='Specifies the host to use for generating urls in email\'s todo lists (including protocol). Defaults to "http://newage.a1-au.com".',
            default='http://newage.a1-au.com',
        )

        parser.add_argument('--dry-run',
            action='store_true',
            dest='dry_run',
            help='Displays the email content as well as the recipients but do not actually send the emails.')

        parser.add_argument('--recipient',
            dest='recipient',
            help='Specifies a unique email address to use as recipient for all emails to send.')

    def handle(self, *args, **options):
        self.verbosity = options.get('verbosity', 0)
        self.host = options.get('host')
        self.dry_run = options.get('dry_run')
        self.recipient = options.get('recipient')

        today = timezone.now().date()

        #
        month_plannings = MonthPlanning.objects.filter(sign_off_reminder__lte=today, sign_off_reminder_sent=False)

        if self.verbosity >= 3:
            self.stdout.write('Month plannings with unsent signoff reminder')
            self.stdout.write(str(month_plannings))

        for month_planning in month_plannings:
            orders = [
                order
                for order in Order.objects.filter(delivery_date=month_planning.production_month)
                if order.get_customer_plan_status() != Order.STATUS_APPROVED
            ]
            sent_status = self._send_email_for_orders(orders, month_planning, self._get_email_template(EmailTemplate.EMAIL_TEMPLATE_ROLE_SIGNOFF_REMINDER1))
            if sent_status:
                month_planning.sign_off_reminder_sent = True
                month_planning.save()

    @staticmethod
    def _get_email_template(role):
        try:
            return EmailTemplate.objects.get(role=role)
        except EmailTemplate.DoesNotExist:
            role_str = dict(EmailTemplate.EMAIL_TEMPLATE_ROLE_CHOICES)[role]
            raise CommandError('Could not find a template for role "{}"'.format(role_str))

    def _send_email_for_orders(self, orders, month_planning, email_template):

        recipients = {}
        for order in orders:
            if recipients.get(order.customer_manager) is None:
                recipients[order.customer_manager] = []
            recipients.get(order.customer_manager).append(order)

        email_body_substitutions = re.findall(r'%%.+?%%', email_template.message)

        if self.verbosity >= 3:
            self.stdout.write('Substitution found:')
            self.stdout.write(str(email_body_substitutions))

        for recipient, orders_for_recipient in list(recipients.items()):
            html_content = generate_email_html_content(orders_for_recipient, recipient, email_template, self.host)

            if self.verbosity >= 3:
                self.stdout.write('HTML content')
                self.stdout.write(str(html_content))

            if self.recipient:
                recipient_to = [self.recipient]
                recipient_cc = []
            else:
                recipient_to = [recipient.email]
                recipient_cc = list({order.dealership.dealershipuserdealership_set.get(is_principal=True).dealership_user.email for order in orders_for_recipient})

            for email in recipient_to + recipient_cc:
                validate_email(email)

            if self.dry_run:
                self.stdout.write('From:{} ({})'.format(settings.BATCH_EMAIL_FROM, settings.BATCH_EMAIL_FROM_NAME))
                self.stdout.write('To: {}'.format(recipient_to))
                self.stdout.write('Cc: {}'.format(recipient_cc))
                self.stdout.write('Content: {}'.format(html_content), ending='\n\n')

                return False

            else:
                results = send_email(
                    email_template.subject,
                    html_content,
                    settings.BATCH_EMAIL_FROM,
                    settings.BATCH_EMAIL_FROM_NAME,
                    recipient_to,
                    recipient_cc
                )

                if self.verbosity >= 1:
                    self.stdout.write('Status: {}'.format(', '.join([r.get('status') for r in results])))
                    self.stdout.write('Reject Reason: {}'.format(', '.join([str(r.get('reject_reason')) for r in results])))

                for result in results:
                    if result.get('status') == 'rejected':
                        return False
                return True
