import os

from authtools.models import User
from django.db import models
from django_permanent.models import PermanentModel

from customers.models import Customer
from customers.models import CustomerStatus
from newage.utils import generate_random_str


def lead_activity_image_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['lead_activity', str(instance.activity.id), name + '_' + generate_random_str() + ext])
    return path

def email_attachment_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['broadcast_email_attachment', generate_random_str() + ext])
    return path

# Create your models here.

class LeadActivity(PermanentModel, models.Model):
    LEAD_ACTIVITY_TYPE_PHONE_CALL = 1
    LEAD_ACTIVITY_TYPE_EMAIL = 2
    LEAD_ACTIVITY_TYPE_EMAIL_GALLERY_SHARE = 3
    LEAD_ACTIVITY_TYPE_NEW_INBOUND = 4
    LEAD_ACTIVITY_TYPE_SALES_STAFF_APPOINTMENT = 5

    LEAD_ACTIVITY_TYPE_CHOICES = (
        (LEAD_ACTIVITY_TYPE_PHONE_CALL, 'Phone Call'),
        (LEAD_ACTIVITY_TYPE_EMAIL, 'Email'),
        (LEAD_ACTIVITY_TYPE_EMAIL_GALLERY_SHARE, 'Gallery Share Email'),
        (LEAD_ACTIVITY_TYPE_NEW_INBOUND, 'New Inbound'),
        (LEAD_ACTIVITY_TYPE_SALES_STAFF_APPOINTMENT, 'Sales Staff Appointment'),
    )

    id = models.AutoField(primary_key=True)
    creator = models.ForeignKey(User, related_name='created_by', on_delete=models.DO_NOTHING)
    customer = models.ForeignKey(Customer, on_delete=models.DO_NOTHING)
    lead_activity_type = models.IntegerField(choices=LEAD_ACTIVITY_TYPE_CHOICES)
    activity_time = models.DateTimeField()
    followup_date = models.DateField(blank=True, null=True)
    followup_reminder_sent_time = models.DateTimeField(blank=True, null=True)
    new_customer_status = models.ForeignKey(CustomerStatus, blank=False, null=False, on_delete=models.DO_NOTHING)
    notes = models.TextField()

    def __str__(self):
        return str(self.get_lead_activity_type_display()) + "|" + str(self.activity_time)

    class Meta:
        db_table = 'lead_activity'
        verbose_name_plural = 'Lead Activities'


class LeadActivityAttachment(PermanentModel, models.Model):
    activity = models.ForeignKey(LeadActivity, on_delete=models.DO_NOTHING)
    attachment = models.FileField(upload_to=lead_activity_image_path, blank=True, null=True)


class BroadcastEmailAttachment(PermanentModel, models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
    file = models.FileField(upload_to=email_attachment_path, null=False, blank=False)
    mime_type = models.CharField(max_length=100, null=False, blank=False)

    def __str__(self):
        return self.name + ' / ' + self.mime_type

    class Meta:
        db_table = 'broadcast_email_attachment'
