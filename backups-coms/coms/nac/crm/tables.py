from django.conf import settings
from django.urls import reverse
from django.db.models.aggregates import Count
from django.db.models.expressions import Case
from django.db.models.expressions import When
from django.db.models.fields import CharField
from django.template import Context
from django.template.loader import get_template
from django.utils.safestring import mark_safe
from django.utils.timezone import get_default_timezone
import django_tables2 as tables
from pytz import timezone

from crm.models import LeadActivity
from customers.models import Customer

name_link_template = """
<a class="record-link" href="{% url 'crm:edit_lead' record.id %}">{{ record.first_name }}</a>
"""


class CustomerTable(tables.Table):
    first_name = tables.TemplateColumn(verbose_name='First Name', order_by='first_name', template_code=name_link_template)
    first_name_plain = tables.Column(accessor='first_name', order_by='first_name', verbose_name='First Name')
    last_name = tables.Column(verbose_name='Last Name')
    email = tables.Column(verbose_name='Email')
    dealership = tables.Column(verbose_name='Dealership', accessor='appointed_dealer')
    state = tables.Column(verbose_name='State', accessor='physical_address.suburb.post_code.state.name')
    latest_activity = tables.Column(verbose_name='Latest Activity', empty_values=(), orderable=False)  # Ordering by custom columns doesn't work well in django-tables2 : https://github.com/bradleyayers/django-tables2/issues/413
    action = tables.Column(verbose_name='Actions', empty_values=(), orderable=False)  # Ordering by custom columns doesn't work well in django-tables2 : https://github.com/bradleyayers/django-tables2/issues/413

    def render_latest_activity(self, record):
        latest_activity = LeadActivity.objects.filter(customer_id=record.id).order_by(
                '-activity_time').first()

        if latest_activity is not None:
            act_time = latest_activity.activity_time
            act_time.replace(tzinfo=get_default_timezone())
            return mark_safe("<a class='record-link' href='%s'>%s</a> on %s" % (
                reverse('crm:view_activity', kwargs={'activity_id': latest_activity.id}),
                dict(LeadActivity.LEAD_ACTIVITY_TYPE_CHOICES)[latest_activity.lead_activity_type],
                act_time.strftime(settings.FORMAT_DATE)
            ))
        else:
            return mark_safe('None')

    def render_action(self, record):
        if hasattr(record, 'order_id') and record.order_id:
            if LeadActivity.objects.filter(customer__id=record.id).filter(lead_activity_type=LeadActivity.LEAD_ACTIVITY_TYPE_EMAIL_GALLERY_SHARE).count():
                label = 'Reshare Gallery'
            else:
                label = "Share Gallery"

            markup = get_template('crm/invite_button.html').render(Context({
                    'value': record.order_id,
                    'label': label,
                }))
            return mark_safe(markup)
            #return mark_safe('<a href="#" type="button" id="share_gallery_%d" class="btn btn-newage btn-share-gallery">Share Gallery</a>' % (record.order_id))
        else:
            return ''

    class Meta:
        model = Customer
        attrs = {'class': 'table table-striped'}
        fields = (
            'first_name',
            'first_name_plain',
            'last_name',
            'email',
            'dealership',
            'state',
            'latest_activity',
            'action',
        )


date_link_template = """
<a class="record-link" href="{% url 'crm:view_activity' record.id %}">{{ record.activity_time }}</a>
"""


class LeadActivityTable(tables.Table):
    activity_time = tables.TemplateColumn(template_code=date_link_template)

    class Meta:
        model = LeadActivity
        attrs = {'class': 'table table-striped'}
        fields = (
            'activity_time',
            'creator',
            'lead_activity_type',
            'followup_date',
            'notes',
        )
