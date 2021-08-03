from ckeditor.fields import RichTextField
from django.db import models
from django_permanent.models import PermanentModel


class EmailTemplate(PermanentModel, models.Model):

    EMAIL_TEMPLATE_ROLE_COMPLETION_REMINDER1 = 1    # No longer used
    EMAIL_TEMPLATE_ROLE_COMPLETION_REMINDER2 = 2    # No longer used
    EMAIL_TEMPLATE_ROLE_SIGNOFF_REMINDER1 = 3
    EMAIL_TEMPLATE_ROLE_SIGNOFF_REMINDER2 = 4       # No longer used
    EMAIL_TEMPLATE_ROLE_ORDER_SUBMITTED = 5
    EMAIL_TEMPLATE_ROLE_CUSTOMER_PLANS_REJECTED = 6
    EMAIL_TEMPLATE_ROLE_SPECIAL_FEATURES_REJECTED = 7
    EMAIL_TEMPLATE_ROLE_FINALIZE_ORDER_NOTIFICATION = 8

    EMAIL_TEMPLATE_ROLE_CHOICES = (
        (None, 'None'),
        (EMAIL_TEMPLATE_ROLE_SIGNOFF_REMINDER1, 'Sign off reminder'),
        (EMAIL_TEMPLATE_ROLE_ORDER_SUBMITTED, 'Order Submitted'),
        (EMAIL_TEMPLATE_ROLE_CUSTOMER_PLANS_REJECTED, 'Customer Plans Rejected'),
        (EMAIL_TEMPLATE_ROLE_SPECIAL_FEATURES_REJECTED, 'Special Features Rejected'),
        (EMAIL_TEMPLATE_ROLE_FINALIZE_ORDER_NOTIFICATION, 'Order Finalise Notification'),
    )

    name = models.CharField(max_length=255, blank=False, null=False)
    subject = models.CharField(max_length=77, blank=False, null=False) # 77 characters is the maximum number of characters for which most systems will display the subject correctly.
    role = models.IntegerField(null=True, blank=True, unique=True, choices=EMAIL_TEMPLATE_ROLE_CHOICES)
    message = RichTextField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name
