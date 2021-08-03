from email.utils import parseaddr
import re

from django.conf import settings
from django.template.base import Template
from django.template.context import Context
from django.template.loader import get_template
import mandrill

from production.models import Build
from schedule.models import MonthPlanning

EMAIL_TEMPLATE = 'email_base.html'
TODO_LIST_TEMPLATE = 'email_todo_list.html'


def send_mandrill_email(attachments, html, recipient, recipient_name, subject, text, send_time, user):

    email_tuple = parseaddr(user.email)
    sender_name = email_tuple[0]
    if sender_name == '':
        sender_name = user.email

    try:
        if settings.MANDRILL_TEST_MODE:
            mandrill_client = mandrill.Mandrill(settings.MANDRILL_API_TEST_KEY)
        else:
            mandrill_client = mandrill.Mandrill(settings.MANDRILL_API_KEY)

        message = {
         'attachments': attachments,
         'auto_html': None,
         'auto_text': None,
         'bcc_address': None,
         'from_email': '%s@%s' % (sender_name, settings.MANDRILL_SENDER_DOMAIN),
         'from_name': 'New Age Caravans Sales Team',
         'global_merge_vars': [{'content': 'merge1 content', 'name': 'merge1'}],
         'google_analytics_campaign': 'message.from_email@example.com',
         'google_analytics_domains': ['example.com'],
         'headers': {'Reply-To': 'message.reply@example.com'},
         'html': html,
         'images': None,
         'important': False,
         'inline_css': None,
         'merge': True,
         'merge_language': 'mailchimp',
         'merge_vars': None,
         'metadata': None,
         'preserve_recipients': None,
         'recipient_metadata': [{'rcpt': recipient, 'values': {}}],
         'return_path_domain': None,
         'signing_domain': None,
         'subaccount': None,
         'subject': subject,
         'tags': [],
         'text': text,
         'to': [{'email': recipient,
                 'name': recipient_name,
                 'type': 'to'}],
         'track_clicks': None,
         'track_opens': None,
         'tracking_domain': None,
         'url_strip_qs': None,
         'view_content_link': None}

        # for scheduling pass a time parameter as: timezone.now().strftime(settings.FORMAT_DATETIME)

        #async_flag = send_time is not None << was trying to set async value to true or false depending upon scheduling, but is not needed
        #scheduled messsages are received with a 5/6 min delay

        result = mandrill_client.messages.send(message=message, asy=False, ip_pool='Main Pool', send_at=send_time)

    except mandrill.Error as e:
        # Mandrill errors are thrown as exceptions
        print ('A mandrill error occurred: %s - %s' % (e.__class__, e))
        raise


def send_email(subject, content, from_email, from_name, recipients_to, recipients_cc=None):
    """
    Sends an email using Mandrill.

    Args:
        subject: The email subject
        content: The email content, as HTML
        from_email: The sender's email address
        from_name: The sender's name
        recipients_to: The list of recipient's email addresses to go in the 'to' box
        recipients_cc: The list of recipient's email addresses to go in the 'cc' box

    Returns: The JSON response from Mandrill

    """

    if type(recipients_to) not in (list, tuple):
        recipients_to = [recipients_to]

    recipients_cc = recipients_cc or []

    if settings.MANDRILL_TEST_MODE:
        mandrill_client = mandrill.Mandrill(settings.MANDRILL_API_TEST_KEY)
    else:
        mandrill_client = mandrill.Mandrill(settings.MANDRILL_API_KEY)

    message = {
        'subject': subject,
        'html': content,
        'from_email': from_email,
        'from_name': from_name,
        'to': [{'email': email} for email in recipients_to] + [{'email': email, 'type': 'cc'} for email in recipients_cc],
        'important': True,
        'auto_text': True,
    }

    # setting email backend to console in settings apparently has no effect as this one go thru mandrill, not django email module
    # prevent CI test from sending actual emails as well
    if settings.DEBUG or settings.BODY_ENV_CLASS == 'env-ci':
        print ('=====SENDING EMAIL=====\n', '\n'.join('%s %s' % (k,v) for k,v in message.items()), '\n====================')
        return [{'status':'sent'}]

    return mandrill_client.messages.send(message)


def generate_email_html_content(order_list, recipient, email_template, host, reject_reason=''):
    """
    Assumes all orders in order_list belong to the same MonthPlanning.

    Generates and returns the html content for the given email_tempalte instance.

    All supported placeholders are replaced with the appropriate value. This include:
    %%completion_date%%
    %%customer_name%%
    %%order_chassis%%
    %%order_series%%
    %%order_status_link%%
    %%order_special_features%%
    %%recipient_name%%
    %%reject_reason%%
    %%schedule_month%%
    %%signoff_date%%
    %%todo_list%%
    """

    if len(order_list) < 1:
        return None

    content = email_template.message

    single_order = order_list[0]

    try:
        month_planning = MonthPlanning.objects.get(production_month=single_order.build.build_order.production_month, production_unit = single_order.build.build_order.production_unit)
    except (MonthPlanning.DoesNotExist, Build.DoesNotExist):
        month_planning = None

    email_body_substitutions = re.findall(r'%%.+?%%', email_template.message)

    for substitution in email_body_substitutions:

        if substitution == '%%recipient_name%%':
            if type(recipient) in (tuple, list):
                name = ', '.join([r.name for r in recipient])
            else:
                name = recipient.name
            content = content.replace(substitution, name)

        if substitution == '%%order_series%%':
            content = content.replace(substitution, str(single_order.orderseries.series) if single_order.orderseries.series else str(single_order.id))

        if substitution == '%%order_chassis%%':
            content = content.replace(substitution, single_order.chassis if single_order.chassis else str(single_order.id))

        if substitution == '%%customer_name%%':
            customer_name = single_order.customer.name if single_order.customer else '(None)'
            content = content.replace(substitution, customer_name)

        if substitution == '%%order_status_link%%':
            link_template = Template('<a href="http://{{ host }}{% url "newage:angular_app" app="orders" %}#/{{ order.id }}/status">View Status</a>')
            content = content.replace(substitution, link_template.render(Context({'host': host, 'order': single_order})))

        if substitution == '%%order_special_features%%':
            special_features = single_order.specialfeature_set.filter(approved=True)
            sp_desc_wrapper = '<table width=600px border=1><tr><td>Description</td><td>Price</td></tr>%s</table>'
            sp_desc = []
            for special_feature in special_features:
                if special_feature.customer_description:
                    sp_desc.append('<tr><td>%s</td><td>$%s</td></tr>' % (special_feature.customer_description, special_feature.wholesale_price or '0.00'))
                elif special_feature.wholesale_price:
                    sp_desc.append('<tr><td>%s</td><td>$%s</td></tr>' % (special_feature.factory_description, special_feature.wholesale_price or '0.00'))
            sp_desc = '\n'.join(sp_desc) if sp_desc else 'None'
            content = content.replace(substitution, sp_desc_wrapper % sp_desc)

        if month_planning and substitution == '%%schedule_month%%':
            content = content.replace(substitution, month_planning.production_month.strftime(settings.FORMAT_DATE_MONTH))

        if month_planning and substitution == '%%signoff_date%%':
            content = content.replace(substitution, month_planning.sign_off_reminder.strftime(settings.FORMAT_DATE))

        if substitution == '%%todo_list%%':
            order_table = get_template(TODO_LIST_TEMPLATE).render({'order_list': order_list, 'host': host})
            content = content.replace(substitution, order_table)

        if substitution == '%%reject_reason%%':
            content = content.replace(substitution, reject_reason)

    html_content = get_template(EMAIL_TEMPLATE).render({
        'content': content,
    })

    return html_content
