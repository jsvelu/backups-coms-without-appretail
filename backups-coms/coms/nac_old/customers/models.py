import re

from authtools.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django_permanent.models import PermanentModel

from caravans.models import Model
from caravans.models import Series
from dealerships.models import Dealership
from newage.models import Address

RE_POSTCODE = re.compile(r'\d{4}')


# Create your models here.
class AcquisitionSource(PermanentModel, models.Model):

    EGM_VALUE_WALKIN = 1
    EGM_VALUE_TELEPHONE = 2
    EGM_VALUE_INTERNET_LEAD = 3
    EGM_VALUE_MANUCFACTURER_LEAD = 4

    EGM_VALUE_DEFAULT  = EGM_VALUE_INTERNET_LEAD

    # These are the textual values used in eGM
    EGM_VALUE_CHOICES = (
        (EGM_VALUE_WALKIN, 'Walkin'),
        (EGM_VALUE_TELEPHONE, 'Telephone'),
        (EGM_VALUE_INTERNET_LEAD, 'Internet Lead'),
        (EGM_VALUE_MANUCFACTURER_LEAD, 'Manufacturer Lead'),
    )

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    egm_value = models.IntegerField(choices=EGM_VALUE_CHOICES, null=False, blank=False, default=EGM_VALUE_DEFAULT, verbose_name=' eGM value')

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'acquisition_source'


class SourceOfAwareness(PermanentModel, models.Model):

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'source_of_awareness'
        verbose_name_plural = 'Source of Awareness'


class CustomerStatus(PermanentModel, models.Model):

    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50, blank=False, null=False)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'customer_status'
        verbose_name_plural = 'Customer Status'


class Customer(PermanentModel, models.Model):

    LEAD_TYPE_LEAD = 1
    LEAD_TYPE_CUSTOMER = 2
    LEAD_TYPE_EGM = 3

    LEAD_TYPE_CHOICES = (
        (LEAD_TYPE_LEAD, 'Lead'),
        (LEAD_TYPE_CUSTOMER, 'Customer'),
        (LEAD_TYPE_EGM, 'e-GoodManners'),
    )

    CUSTOMER_STATUS_NEED_TO_CONTACT = 1
    CUSTOMER_STATUS_QUOTED = 2
    CUSTOMER_STATUS_ORDERED = 3
    CUSTOMER_STATUS_NOT_INTERESTED = 4
    CUSTOMER_STATUS_NOT_INTERESTED_BOUGHT_ANOTHER = 5

    CUSTOMER_STATUS_CHOICES = (
        (CUSTOMER_STATUS_NEED_TO_CONTACT, 'Need to Contact'),
        (CUSTOMER_STATUS_QUOTED, 'Quoted'),
        (CUSTOMER_STATUS_ORDERED, 'Ordered'),
        (CUSTOMER_STATUS_NOT_INTERESTED, 'Not Interested'),
        (CUSTOMER_STATUS_NOT_INTERESTED_BOUGHT_ANOTHER, 'Not Interested Bought Another')
    )

    id = models.AutoField(primary_key=True)
    egm_customer_id = models.IntegerField(null=True, blank=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone1 = models.CharField(max_length=20, blank=True, null=True)
    phone2 = models.CharField(max_length=20, blank=True, null=True)
    phone_delivery = models.CharField(max_length=20, blank=True, null=True)
    phone_invoice = models.CharField(max_length=20, blank=True, null=True)

    partner_name = models.CharField(max_length=100, blank=True, null=True)

    physical_address = models.ForeignKey(Address, related_name='customer_physical_address', null=True, blank=True, on_delete=models.PROTECT)
    delivery_address = models.ForeignKey(Address, related_name='customer_delivery_address', null=True, blank=True, on_delete=models.PROTECT)
    postal_address = models.ForeignKey(Address, related_name='customer_postal_address', null=True, blank=True, on_delete=models.PROTECT)

    lead_type = models.IntegerField(choices=LEAD_TYPE_CHOICES, null=False, blank=False)
    appointed_dealer = models.ForeignKey(Dealership, null=True, blank=True, on_delete=models.PROTECT)
    acquisition_source = models.ForeignKey(AcquisitionSource, null=True, blank=True, on_delete=models.PROTECT)
    source_of_awareness = models.ForeignKey(SourceOfAwareness, null=True, blank=True, on_delete=models.PROTECT)
    customer_status = models.ForeignKey(CustomerStatus, null=False, blank=False, on_delete=models.PROTECT)
    lead_series = models.ForeignKey(Series, null=True, blank=True, on_delete=models.PROTECT)
    model_type = models.IntegerField(choices=Model.MODEL_TYPE_CHOICES, null=True, blank=True)
    creation_time = models.DateTimeField(null=False, default=timezone.now)

    appointed_rep = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT)

    tow_vehicle = models.CharField(max_length=200, null=True, blank=True)

    mailing_list = models.BooleanField(default=False)

    is_up_to_date_with_egm = models.BooleanField(default=False)

    fixtures_autodump = ['dev']

    def __str__(self):
        result = self.name
        if self.physical_address and self.physical_address.suburb.name is not None:
            result += ' ' + str(self.physical_address.suburb.name)
        if self.physical_address and self.physical_address.suburb.post_code.number is not None:
            if self.physical_address.suburb.post_code.state:
                result += ', ' + self.physical_address.suburb.post_code.state.name
        return result

    @property
    def name(self):
        return self.get_full_name()

    # Explicitly calling self.full_clean in the save because Django does not call this method (only the Form's full_clean when using a ModelForm)
    def save(self, do_not_clean=False, *args, **kwargs):
        if not do_not_clean:
            self.full_clean()
        return super(Customer, self).save(*args, **kwargs)

    def clean(self):
        errors = []
        if not self.first_name:
            errors.append(ValidationError('The first name is required.'))

        if not self.last_name:
            errors.append(ValidationError('The last name is required.'))

        if not self.phone1 and not self.phone2 and not self.email:
            errors.append(ValidationError('Either a phone number of an email address is required.'))

        if self.mailing_list and not self.email:
            errors.append(ValidationError('Need an email address if opting for mailing list.'))

        if not self.physical_address_id:
            errors.append(ValidationError('The main address is mandatory.'))
        else:
            # eGM can update a customer with partial address details, but this should not be allowed otherwise
            if self.physical_address.name in ('', None):
                errors.append(ValidationError("The main address' street is mandatory."))

            if self.physical_address.address in ('', None):
                errors.append(ValidationError("The main address' street is mandatory."))

            if self.physical_address.suburb.name is None:
                errors.append(ValidationError("The main address' suburb is mandatory."))

            if self.physical_address.suburb.post_code.number is None:
                errors.append(ValidationError("The postcode is mandatory."))

            if not RE_POSTCODE.match(self.physical_address.suburb.post_code.number):
                errors.append(ValidationError("The main address' postcode should be 4 digits."))

            if self.physical_address.suburb.post_code.state_id is None:
                errors.append(ValidationError("The main address' state is mandatory."))

        if self.delivery_address and self.delivery_address.suburb.post_code.number and not RE_POSTCODE.match(self.delivery_address.suburb.post_code.number):
            errors.append(ValidationError("The delivery address' postcode should be 4 digits."))

        if self.postal_address and self.postal_address.suburb.post_code.number and not RE_POSTCODE.match(self.postal_address.suburb.post_code.number):
            errors.append(ValidationError("The invoice address' postcode should be 4 digits."))

        if not self.tow_vehicle:
            errors.append(ValidationError('The tow vehicle description is mandatory.'))

        if not self.source_of_awareness:
            errors.append(ValidationError('The source of awareness is mandatory.'))

        if not self.acquisition_source:
            errors.append(ValidationError('The method of contact is mandatory.'))

        if errors:
            raise ValidationError(errors)

    class Meta:
        db_table = 'customer'
        permissions = (('list_customer', 'List Customers'),
                       ('broadcast_email', 'Broadcast Email to Leads'),
                       ('manage_self_and_dealership_leads_only', 'Can only manage leads that are assigned to self, or to dealerships where this user is principal'),
                       ('broadcast_email_self_and_dealership_leads_only', 'Can only broadcast emails to leads that are assigned to self, or to dealerships where this user is principal'),)

    def get_full_name(self):
        return '%s %s' % (
            self.first_name if self.first_name else '',
            self.last_name if self.last_name else '')


class CustomerStatusHistory(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)
    status_assignment_time = models.DateTimeField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.customer.first_name + ' ' + self.customer.last_name + ' on '\
            + self.status_assignment_time.strftime('%c')

    class Meta:
        db_table = 'customer_status_history'
