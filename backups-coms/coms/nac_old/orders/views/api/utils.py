from datetime import date
from datetime import datetime

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.datastructures import OrderedSet
from rest_framework.response import Response

from emails.models import EmailTemplate
from emails.utils import generate_email_html_content
from emails.utils import send_email
from orders.serializers import OrderSerializer
from schedule.models import Capacity
from schedule.models import MonthPlanning


def dropdown_item(item, field='name'):
    return {
        'id': item.pk,
        'title': getattr(item, field),
    }


def order_data(order, request):
    """
    Return a serialized order with added permission information
    """

    data = OrderSerializer(order).data
    data['permissions'] = {permission: request.user.has_perm('orders.%s' % permission) for permission in (
        'request_order_approval',
        'modify_order_all',
    )}

    data['permissions']['list_customer'] = request.user.has_perm('customers.list_customer')
    data['permissions']['modify_order_requested'] = request.user.has_perm('orders.modify_order_requested', order)
    data['permissions']['approve_order'] = request.user.has_perm('orders.approve_order', order)
    data['permissions']['cancel_order'] = request.user.has_perm('orders.cancel_order')
    data['permissions']['request_order_finalize'] = request.user.has_perm('orders.request_order_finalize')
    data['permissions']['finalize_order'] = request.user.has_perm('orders.finalize_order', order)
    data['permissions']['lock_order'] = request.user.has_perm('orders.lock_order', order)
    data['permissions']['modify_order'] = request.user.has_perm('orders.modify_order', order)
    data['permissions']['modify_order_other_prices'] = request.user.has_perm('orders.modify_order_other_prices', order)
    data['permissions']['modify_order_trade_in_write_back'] = request.user.has_perm('orders.modify_order_trade_in_write_back', order)
    data['permissions']['modify_order_finalized'] = request.user.has_perm('orders.modify_order_finalized')
    data['permissions']['modify_retail_prices_finalized'] = request.user.has_perm('orders.modify_retail_prices_finalized', order)
    data['permissions']['modify_order_sales_rep'] = request.user.has_perm('orders.modify_order_sales_rep', order)

    return data


def has_month_empty_production_slots(month, production_unit):
    planning, _created = MonthPlanning.objects.get_or_create(
        production_unit=production_unit,
        production_month__month=month.month,
        production_month__year=month.year,
        defaults={'production_month': month}
    )

    # print('Available Slots:', planning.has_available_spots)
    return planning.has_available_spots()


def get_all_delivery_months(include_previous_months, production_unit):
    start = timezone.now()

    if include_previous_months:
        start = start - relativedelta(months=2)

    # Get all days with a capacity defined
    capacity_days = Capacity.objects.filter(
        day__gt=date(year=start.year, month=start.month, day=1),
        capacity__gt=0,
        production_unit=production_unit
    ).values_list('day', flat=True)

    # Put them in a set to have only one value for each month
    return list(OrderedSet([capacity_day.replace(day=1) for capacity_day in capacity_days]))


def get_available_delivery_months(include_previous_months, production_unit):
    return [month
        for month in get_all_delivery_months(include_previous_months, production_unit)
        if has_month_empty_production_slots(month, production_unit)
    ]


def send_email_from_template(order, recipients, email_template_role, request, error_message_suffix='', reject_reason='', email_subject_contains_id=False):
    """
    Send an email using given template
    Args:
        order: The order related to the email
        recipients: All recipients of the email.
        email_template_role: The EmailTemplate.role value for the email template to use
        request: The request object
        error_message_suffix: This will be appended to the error message
        email_subject_contains_id: subject of email template used contains a %s that shall be filled w/ id.

    Returns:
        If an error occured (for example if no template exist for the given role or if there was an issue while sending the email),
        returns a 500 error Response object
        Otherwise return None
    """

    error_message = None
    try:
        email_template = EmailTemplate.objects.get(role=email_template_role)

        html_content = generate_email_html_content(
            [order],
            recipients,
            email_template,
            request.get_host(),
            reject_reason
        )


        subject = email_template.subject
        if email_subject_contains_id:
            subject = subject % order.id

        if type(recipients) in (tuple, list):
            target_email = [r.email for r in recipients]
        else:
            target_email = recipients.email

        results = send_email(
            subject,
            html_content,
            settings.BATCH_EMAIL_FROM,
            settings.BATCH_EMAIL_FROM_NAME,
            target_email
        )

        for result in results:
            if result.get('status') != 'sent':
                error_message = 'There was an error while sending the notification email. ' + error_message_suffix

    except EmailTemplate.DoesNotExist:
        error_message = 'No template was found for the notification email. ' + error_message_suffix

    if error_message:
        return Response({'error': 500, 'message': error_message}, status=500)


def parse_date(date_str):
    try:
        return datetime.strptime(date_str, settings.FORMAT_DATE).date()
    except ValueError:
         # Using DATE_JS settings for error message because it is human readable
        raise ValidationError('Date {} must be in format {}.'.format(date_str, settings.FORMAT_DATE_JS.lower()))


def send_email_on_order_finalization(order, request):
    """
    :param order: finalized order
    :param request: request object
    :return:
    """

    recipients = list(set([user for user in ([order.customer_manager] + order.dealership.get_principals())]))
    send_email_from_template(order, recipients, EmailTemplate.EMAIL_TEMPLATE_ROLE_FINALIZE_ORDER_NOTIFICATION, request, email_subject_contains_id=True)
