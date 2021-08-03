import os

from authtools.models import User
from django.contrib.auth.models import Group
from django.db import models
from django_permanent.models import PermanentModel

from newage.models import Address
from newage.utils import generate_random_str


def _get_dealer_sales_rep_group():
    return Group.objects.get(name='Dealer Sales Rep')


def dealership_logo_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['dealership', str(instance.pk), name + '_' + generate_random_str() + ext])
    return path


class Dealership(PermanentModel, models.Model):
    name = models.CharField(max_length=255)
    address = models.ForeignKey(Address, on_delete=models.DO_NOTHING, null=True, blank=True)
    logo = models.ImageField(upload_to=dealership_logo_path, null=True, blank=True)
    phone1 = models.CharField(max_length=20, null=True, blank=True)
    phone2 = models.CharField(max_length=20, null=True, blank=True)

    egm_implementation_date = models.DateField(null=True, blank=True, verbose_name=" eGM implementation date") # First character space of verbose_name is to prevent capitalisation

    _principals = None

    fixtures_autodump = ['users']

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'dealership'

    def get_principals(self):
        """
        Return a list of DealershipUser that are principals for this dealership
        Caches results
        """
        if not self._principals:
            self._principals = [dud.dealership_user for dud in DealershipUserDealership.objects.filter(dealership=self, is_principal=True)]
        return self._principals


class DealershipManager(models.Manager):
    def get_by_natural_key(self, email):
        return self.get(email=email)


class DealershipUser(User):
    objects = DealershipManager()
    dealerships = models.ManyToManyField(Dealership, through='DealershipUserDealership')

    # Django multi table inheritance fixture dumping is quite broken;
    # if you dump data you need to manually insert the user_ptr_id field
    fixtures_autodump = ['users']

    def __init__(self, *args, **kwargs):
        self._dealershipuserdealerships_lookup = None
        super(DealershipUser, self).__init__(*args, **kwargs)

    def __str__(self):
        return self.name + ' - ' + self.email

    class Meta:
        db_table = 'dealership_user'
        verbose_name = 'Dealership Staff'
        verbose_name_plural = 'Dealership Staff'

    def natural_key(self):
        return (self.email,)

    def save(self, *args, **kwargs):
        # self.is_staff = False
        # self.is_superuser = False

        is_new = self.pk is None
        if not is_new:
            self.groups.add(_get_dealer_sales_rep_group())
        super(DealershipUser, self).save(*args, **kwargs)
        if is_new:
            self.groups.add(_get_dealer_sales_rep_group())
            self.save()

    def _load_dealershipuserdealerships(self, reload_cache=False):
        """
        Get a cached copy of the DealershipUser-Dealership relationships
        :param reload_cache: whether to force a reload
        :return:
        """
        if self._dealershipuserdealerships_lookup is None or reload_cache:
            self._dealershipuserdealerships_lookup = dict((dud.dealership_id, dud) for dud in self.dealershipuserdealership_set.all())
        return self._dealershipuserdealerships_lookup

    def is_dealership_rep(self, dealership_id):
        """
        Check if user is a rep or principal for a dealership
        Dealership association results will be cached
        :param dealership_id: dealership to check
        :return:
        """
        return dealership_id in self._load_dealershipuserdealerships()

    def is_dealership_principal(self, dealership_id):
        """
        Check if user is a principal for a dealership
        Dealership association results will be cached
        :param dealership_id: dealership to check
        :return:
        """
        dealershipuserdealerships = self._load_dealershipuserdealerships()
        dealershipuserdealership = dealershipuserdealerships.get(dealership_id)
        return dealershipuserdealership and dealershipuserdealership.is_principal

    def get_dealership_ids(self):
        """
        Return a cached list of dealership IDs this user is related to
        Cached because is used a lot in permission checking
        :return: generator of IDs
        """
        return list(self._load_dealershipuserdealerships().keys())

    def get_dealership_principal_ids(self):
        """
        Return a cached list of dealership IDs this user is a principal of
        :param reload_cache: whether to force a reload
        :return: generator of IDs
        """
        return (dud.dealership_id for dud in list(self._load_dealershipuserdealerships().values()) if dud.is_principal)


class DealershipUserDealership(PermanentModel, models.Model):
    #dealership = models.ForeignKey(Dealership, on_delete=models.DO_NOTHING)
    #dealership_user = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    dealership_user = models.ForeignKey(DealershipUser, on_delete=models.DO_NOTHING)
    dealership = models.ForeignKey(Dealership, on_delete=models.DO_NOTHING)

    # dealership_user_dealership_ref = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='dealer_user_ref', default=None)
    #dealership_user = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='user_ref')
    #dealership = models.ForeignKey(Dealership, on_delete=models.DO_NOTHING, related_name='dealer_ref')
    is_principal = models.BooleanField(verbose_name='Principal?')

    fixtures_autodump = ['users']

    def __str__(self):
        return \
            (str(self.dealership) if self.dealership else '') \
            + ' / ' \
            + (str(self.dealership_user) if self.dealership_user else '')
