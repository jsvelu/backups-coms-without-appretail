

from io import StringIO
import gzip
import os

from allianceutils.models import combine_querysets_as_manager
from allianceutils.models import NoDeleteModel
from allianceutils.models import NoDeleteQuerySet
from ckeditor_uploader.fields import RichTextUploadingField
from django.core.files.base import ContentFile
from django.db import models
from django.utils import timezone
from django_permanent.models import PermanentModel

from newage.utils import generate_random_str


def archive_file_path(instance, filename):
    path = '/'.join(['archive', str(timezone.now().toordinal()), filename + ".gzip"])
    return path


def get_autodump_labels(app_config, fixture):
    import allianceutils.management.commands.autodumpdata
    extras = {
        'groups': [
            'auth.group',
            # 'auth.group_permissions',
        ],
        'users': [
            'authtools.user',
        ],
    }
    return allianceutils.management.commands.autodumpdata.get_autodump_labels(app_config, fixture) + extras.get(fixture, [])


class Settings(NoDeleteModel, models.Model):
    SETTING_ID = 1
    ID_CHOICES = (
        (SETTING_ID, 'Settings is a single record'),
    )
    id = models.IntegerField(primary_key=True, choices=ID_CHOICES, default=SETTING_ID)
    home_page_banner_html = RichTextUploadingField(blank=True, null=True, help_text='HTML banner that is displayed at the top of the home page')
    showroom_splash = models.ImageField(upload_to='settings', blank=True, null=True, help_text='Image that is displayed on the showroom order entry page')

    schedule_lockdown_month = models.DateField(null=True, blank=True)
    schedule_lockdown_number = models.IntegerField(default=0)

    fixtures_autodump = ['dev']

    def __str__(self):
        return 'Settings'

    class Meta:
        verbose_name = 'Settings'
        verbose_name_plural = 'Settings'
        permissions = (('view_commons', 'Access the Common Lookup API'),)

    @classmethod
    def get_settings(cls):
        return cls.objects.get_or_create(id=cls.SETTING_ID)[0]


class StateNaturalKeyQuerySet(models.QuerySet):
    def get_by_natural_key(self, code):
        return self.get(code=code)


class State(NoDeleteModel, models.Model):
    objects = combine_querysets_as_manager(StateNaturalKeyQuerySet, NoDeleteQuerySet)

    name = models.CharField(max_length=50, blank=True, null=True, unique=True)
    code = models.CharField(max_length=5, blank=True, null=True, unique=True)

    # loading via fixtures too slow; we use direct SQL loading
    # fixtures_autodump = ['initial']

    def __str__(self):
        return self.name + ' (' + self.code + ')'

    def natural_key(self):
        return (self.code,)

    class Meta:
        db_table = 'state'
        app_label = 'newage'


class PostcodeNaturalKeyQuerySet(models.QuerySet):
    def get_by_natural_key(self, number, state_code):
        return self.get(number=number, state__code=state_code)


class Postcode(NoDeleteModel, models.Model):
    objects = combine_querysets_as_manager(PostcodeNaturalKeyQuerySet, NoDeleteQuerySet)

    number = models.CharField(max_length=4, blank=True, null=True)
    state = models.ForeignKey(State, on_delete=models.DO_NOTHING, null=True)

    # loading via fixtures too slow; we use direct SQL loading
    # fixtures_autodump = ['initial']

    def __str__(self):
        return "%s %s" % (self.number, self.state.name if self.state_id else '(Unknown)')

    def natural_key(self):
        return self.number, self.state.code

    class Meta:
        db_table = 'postcode'
        unique_together = ('number', 'state')
        app_label = 'newage'


class SuburbNaturalKeyQuerySet(models.QuerySet):
    def get_by_natural_key(self, name, post_code_number):
        return self.get(name=name, post_code__number=post_code_number)


class Suburb(NoDeleteModel, models.Model):
    objects = combine_querysets_as_manager(SuburbNaturalKeyQuerySet, NoDeleteQuerySet)

    name = models.CharField(max_length=255, blank=True, null=True)
    post_code = models.ForeignKey(Postcode, on_delete=models.DO_NOTHING)

    # loading via fixtures too slow; we use direct SQL loading
    # fixtures_autodump = ['initial']

    def __str__(self):
        return "%s %s" % (self.name, self.post_code)

    def natural_key(self):
        return self.name, self.post_code.number

    class Meta:
        db_table = 'suburb'
        unique_together = ('name', 'post_code')
        app_label = 'newage'


class Address(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    suburb = models.ForeignKey(Suburb, on_delete=models.DO_NOTHING)

    fixtures_autodump = ['dev']

    def __str__(self):
        return "%s %s" % (self.address, self.suburb)

    @staticmethod
    def create_or_find_matching(address_name, street, suburb_name, postcode_number, state_code, street2=None):

        if address_name is None or address_name == '':
            return None

        state = State.objects.filter(code=state_code).first()

        postcode = Postcode.objects.filter(state=state).filter(number=postcode_number).first()

        if postcode is None:
            postcode = Postcode.objects.create(
                number=postcode_number,
                state=state,
            )

        suburb = Suburb.objects.filter(post_code=postcode).filter(name=suburb_name).first()
        if suburb is None:
            suburb = Suburb.objects.create(
                name=suburb_name,
                post_code=postcode,
            )

        address = Address.objects.filter(name=address_name, address=street, address2=street2, suburb=suburb).first()
        if address is None:
            address = Address.objects.create(
                name=address_name,
                address=street,
                address2=street2,
                suburb=suburb,
            )

        return address

    class Meta:
        db_table = 'address'
        app_label = 'newage'
        verbose_name_plural = 'Address'


class ArchiveFile(PermanentModel, models.Model):

    ARCHIVE_TYPE_BOM_OSTENDO = 1
    ARCHIVE_TYPE_BOM_CSV = 2

    ARCHIVE_TYPES = (
        (ARCHIVE_TYPE_BOM_OSTENDO, 'Bill of Materials Ostendo'),
        (ARCHIVE_TYPE_BOM_CSV, 'Bill of Materials CSV'),
    )

    name = models.TextField(null=False, blank=False)
    file = models.FileField(upload_to=archive_file_path, null=False, blank=False)
    gen_time = models.DateTimeField(blank=False, null=False)
    type = models.IntegerField(choices=ARCHIVE_TYPES, blank=False, null=False)

    def __str__(self):
        return "File type " + self.ARCHIVE_TYPES[self.type - 1][1] + ' | ' + self.file.name

    @staticmethod
    def create(file_content, file_name, type):
        #first zip file in memory
        fgz = StringIO()
        gzip_obj = gzip.GzipFile(
            filename=file_name, mode='wb', fileobj=fgz)
        gzip_obj.write(file_content)
        gzip_obj.close()

        f = ArchiveFile()
        f.name = file_name
        f.type = type
        f.gen_time = timezone.now()
        name_part, ext_part = os.path.splitext(file_name)

        f.file.save(generate_random_str() + ext_part, ContentFile(fgz.getvalue()))
        f.save()
