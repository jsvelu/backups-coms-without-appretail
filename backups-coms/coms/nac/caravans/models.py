from __future__ import unicode_literals

import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db import transaction
from django.db.models.expressions import F
from django.db.models.expressions import Value
from django.db.models.functions import Concat
from django.utils import dateformat
from django.utils import timezone
from django_permanent.models import PermanentModel
from django.utils.safestring import mark_safe

from dealerships.models import Dealership
from newage.utils import generate_random_str


def sku_image_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['skus', str(instance.id), name + '_' + generate_random_str() + ext])
    return path


def series_image_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['series', str(instance.series.pk), name + '_' + generate_random_str() + ext])
    return path


def model_logo_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['model_logos', str(instance.pk), name + '_' + generate_random_str() + ext])
    return path


class Model(PermanentModel, models.Model):
    MODEL_TYPE_CHOICES = (
        (1, 'Family Caravans'),
        (2, 'Luxury Caravans'),
        (3, 'Offroad Caravans'),
        (4, 'Caravans over 19 foot'),
        (5, 'Caravans under 19 foot')
    )
    name = models.CharField(max_length=255, blank=True, null=True, unique=True)
    logo = models.ImageField(upload_to=model_logo_path)

    fixtures_autodump = ['dev']

    @mark_safe
    def logo_tag(self):
        if self.logo:
            return '<img src="%s" class="model-thumbnail" />' % self.logo.url
        else:
            'No image'

    logo_tag.short_description = 'Image'
    logo_tag.allow_tags = True

    def __str__(self):
        # print('Model name', self.name)
        return self.name

    class Meta(object):
        db_table = 'model'
        ordering = ('name',)
        permissions = (
            ("browse_all_models", "Can browse all models"),
        )


class Series(PermanentModel, models.Model):
    SCHEDULE_I = 1
    SCHEDULE_II = 2

    SCHEDULE_UNIT = (
        (SCHEDULE_I, 'Caravans'),
        (SCHEDULE_II, 'Pop-Top/Campers'),
    )

    SERIES_TYPE =( 
        ('Caravans','Caravans'),
        ('PopTops','PopTops'),
        ('Campers','Campers'),
    )

    
    model = models.ForeignKey(Model, on_delete=models.PROTECT)
    series_type = models.CharField(max_length=32,choices=SERIES_TYPE,default='Caravans')
    production_unit = models.IntegerField(choices = SCHEDULE_UNIT)
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=255)
    dealerships = models.ManyToManyField(Dealership, blank=True)
    cost_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    wholesale_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    length_mm = models.IntegerField(blank=True, null=True, verbose_name = 'Length in mm')
    length_incl_aframe_mm = models.IntegerField(blank=True, null=True, verbose_name='Travel Length in mm')
    length_incl_bumper_mm = models.IntegerField(blank=True, null=True, verbose_name = 'Max External Travel Height in mm')
    height_max_incl_ac_mm = models.IntegerField(blank=True, null=True, verbose_name='Max Internal Living Height in mm')
    width_mm = models.IntegerField(blank=True, null=True, verbose_name = 'Width in mm')
    width_incl_awning_mm = models.IntegerField(blank=True, null=True, verbose_name='Max Travel Width in mm')

    avg_tare_weight = models.IntegerField(blank=True, null=True, verbose_name='Avg Tare Weight in kg')
    avg_ball_weight = models.IntegerField(blank=True, null=True, verbose_name='Avg Ball Weight in kg')

    fixtures_autodump = ['dev']

    def __str__(self):
        return '%s: %s %s' % (self.code, self.model.name, self.name)

    class Meta(object):
        db_table = 'series'
        ordering = ('model__name', 'name',)
        verbose_name_plural = 'Series'

    def save(self, *args, **kwargs):
        # Series code is a unique field, but Series also inherit from PermanentModel.
        # This means that if a Series is deleted, it will still exist in the database, and adding new series with the same code will fail.
        # If such Series exist, update its code to append a unique string so that the record is not lost
        with transaction.atomic():
            timestamp = dateformat.format(timezone.now(), 'U')
            Series.deleted_objects.filter(code=self.code).update(code=Concat(F('code'), Value('_'), F('id'), Value('_'), Value(timestamp)))
            super(Series, self).save(*args, **kwargs)

            for orderseries in self.orderseries_set.all():
                if orderseries.order.get_finalization_status() != orderseries.order.STATUS_APPROVED:
                    orderseries.cost_price = self.cost_price
                    orderseries.wholesale_price = self.wholesale_price
                    orderseries.retail_price = self.retail_price
                    orderseries.save()

class SeriesPhoto(PermanentModel, models.Model):
    series = models.ForeignKey(Series, on_delete=models.PROTECT)
    photo = models.ImageField(upload_to=series_image_path, null=True)
    is_main_photo = models.BooleanField(blank=False, null=False, default=False)
    is_floor_plan = models.BooleanField(blank=False, null=False, default=False)
    brochure_order = models.IntegerField(null=True, blank=True)

    fixtures_autodump = ['dev']

    @mark_safe
    def image_tag(self):
        if self.photo:
            return '<img src="%s" class="model-thumbnail" />' % self.photo.url
        else:
            'No image'

    image_tag.short_description = 'Image'
    image_tag.allow_tags = True

    def __str__(self):
        item_photo = (self.photo.name if self.photo else '') or ''
        return item_photo + ' | ' + str(self.series)

    class Meta(object):
        db_table = 'series_photo'
        verbose_name = 'Series Photo'
        verbose_name_plural = 'Series Photos'
        ordering = ['series__code', '-is_main_photo']


class SKUCategory(PermanentModel, models.Model):
    parent = models.ForeignKey('self', null=True, on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True, null=True)
    screen_order = models.IntegerField()
    print_order = models.IntegerField()

    read_only = models.BooleanField(default=False)

    is_archived = models.BooleanField(default=False)

    fixtures_autodump = ['dev']

    @staticmethod
    def objects_for_choices(leaf_nodes_only=False):
        """
        Return a queryset of SKUCategories for selection by a user
        Will select_related on parents so that this can be conveniently used in a dropdown
        :param leaf_nodes_only: Will only include category leaf nodes if True. Assumes leaf nodes are exactly MAX_CATEGORY_DEPTH deep
        """
        parent_relationships = ['__'.join(['parent'] * (i + 1)) for i in range(settings.MAX_CATEGORY_DEPTH - 1)]
        order_fields = [parent + '__name' for parent in reversed(parent_relationships)] + ['name']

        qs = SKUCategory.objects
        if leaf_nodes_only:
            filters = {
                parent_relationships[-1] + '__isnull': False,
                parent_relationships[-1] + '__parent__isnull': True,
            }
            qs = qs.filter(**filters)
        else:
            qs = qs.all()
        return qs \
            .order_by(*order_fields) \
            .select_related('__'.join(['parent'] * settings.MAX_CATEGORY_DEPTH))

    def get_depth(self, depth_check_limit=settings.MAX_CATEGORY_DEPTH + 1):
        """
        How many category levels deep is this category?
        The root node (Top) will be 1; leaf categories will be MAX_CATEGORY_DEPTH
        :param depth_check_limit: Maximum depth to check for
        :return: integer
        """
        cat = self
        for depth in range(depth_check_limit):
            if not cat.parent: return depth + 1
            cat = cat.parent
        else:
            return depth_check_limit

    def __str__(self):
        names = []
        parent = self.parent
        for depth in range(settings.MAX_CATEGORY_DEPTH):
            if not parent: break
            names.insert(0, parent.name)
            parent = parent.parent

        names.append(self.name)

        return " > ".join(names)

    @staticmethod
    def top():
        return SKUCategory.objects.get(parent=None)

    class Meta(object):
        db_table = 'sku_category'
        ordering = ('screen_order', 'name', 'id',)
        verbose_name = 'SKU Category'
        verbose_name_plural = 'SKU Categories'

    def clean(self):
        if self.get_depth() > settings.MAX_CATEGORY_DEPTH:
            raise ValidationError('Category is nested too deeply')

        if self.parent and self.parent.skucategory_set.filter(name=self.name).exclude(id=self.id) or SKUCategory.objects.filter(parent__isnull=True, name=self.name).exclude(id=self.id):
            raise ValidationError(
                'This name already exists in this category: %(name)s',
                code='duplicate_name',
                params={'name': self.name},
            )

        if self.is_archived and self.sku_set.filter(is_archived=False).count() > 0:
            raise ValidationError("Cannot archive a department with non-archived items.")


class Supplier(PermanentModel, models.Model):
    name = models.CharField(max_length=255, blank=False, null=False)
    is_bom_report_visible = models.BooleanField(blank=False, null=False, default=True)
    is_bom_ostendo_exportable = models.BooleanField(blank=False, null=False, default=True)
    is_bom_csv_exportable = models.BooleanField(blank=False, null=False, default=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta(object):
        db_table = 'supplier'


class SKU(PermanentModel, models.Model):
    sku_category = models.ForeignKey(SKUCategory, on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    wholesale_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    cost_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    supplier = models.ForeignKey(Supplier, blank=True, null=True, on_delete=models.PROTECT)
    code = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to=sku_image_path, null=True, blank=True)

    # Fields needing confirmation - added for SKU/BoM import
    quantity = models.FloatField(default=1)
    public_description = models.CharField(max_length=512, null=True)
    is_visible = models.BooleanField(default=True, verbose_name='Show on Specification')
    unit = models.CharField(max_length=64, null=True, blank=True)

    contractor_description1 = models.CharField(max_length=512, null=True, blank=True)
    contractor_description2 = models.CharField(max_length=512, null=True, blank=True)
    contractor_description3 = models.CharField(max_length=512, null=True, blank=True)
    contractor_description4 = models.CharField(max_length=512, null=True, blank=True)
    contractor_description5 = models.CharField(max_length=512, null=True, blank=True)

    is_archived = models.BooleanField(default=False)

    fixtures_autodump = ['dev']

    @mark_safe
    def image_tag(self):
        if self.photo:
            return '<img src="%s" class="sku-thumbnail" />' % self.photo.url
        else:
            'No image'

    image_tag.short_description = 'Image'
    image_tag.allow_tags = True

    def __str__(self):
        if self.code:
            return self.name + ' | ' + self.code

        return self.name

    class Meta(object):
        db_table = 'sku'
        ordering = ('name',)
        verbose_name = 'SKU'
        verbose_name_plural = 'SKUs'

        permissions = (
            ("import_sku", "Can Import SKU's"),
            ("export_sku", "Can Export SKU's"),
        )

    def clean(self):
        if self.sku_category.get_depth() != settings.MAX_CATEGORY_DEPTH:
            raise ValidationError('Invalid Category Depth')

    def save(self, *args, **kwargs):
        super(SKU, self).save(*args, **kwargs)

        if self.is_archived:
            # Hide the item
            self.seriessku_set.update(availability_type=SeriesSKU.AVAILABILITY_NOT_USED)

            # Remove the item from all non-finalised orders
            for order_sku in self.ordersku_set.all():
                if order_sku.order.get_finalization_status() != order_sku.order.STATUS_APPROVED: # Using non-static reference to avoid cyclic importing
                    order_sku.delete()


class UOM(PermanentModel, models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta(object):
        db_table = 'uom'
        ordering = ('name',)
        verbose_name = 'Unit of Measure'
        verbose_name_plural = 'Units of Measure'


class RawMaterial(PermanentModel, models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    uom = models.ForeignKey(UOM, on_delete=models.DO_NOTHING)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta(object):
        db_table = 'raw_material'
        ordering = ('name',)


class SKURawMaterial(PermanentModel, models.Model):
    sku = models.ForeignKey(SKU, on_delete=models.DO_NOTHING)
    raw_material = models.ForeignKey(RawMaterial, on_delete=models.DO_NOTHING)
    quantity = models.FloatField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return '%s(%s)' % (self.sku.name, self.quantity)

    class Meta(object):
        db_table = 'sku_raw_material'


class LabourType(PermanentModel, models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    hourly_rate = models.FloatField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return '%s ($%0.2f)' % (self.name, self.hourly_rate)

    class Meta(object):
        db_table = 'labour_type'
        ordering = ('name',)


class SKULabour(PermanentModel, models.Model):
    labour_type = models.ForeignKey(LabourType, on_delete=models.DO_NOTHING)
    sku = models.ForeignKey(SKU, on_delete=models.DO_NOTHING)
    building_time = models.FloatField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.labour_type.name + ': ' + self.sku.name + ': ' + str(self.building_time) + ' hours'

    class Meta(object):
        db_table = 'sku_labour'
        verbose_name = 'Series Labour'
        verbose_name_plural = 'Series Labour'


class SeriesSKU(PermanentModel, models.Model):
    AVAILABILITY_STANDARD = 1
    AVAILABILITY_UPGRADE = 2
    AVAILABILITY_NOT_USED = 3
    AVAILABILITY_OPTION = 4
    AVAILABILITY_SELECTION = 5

    AVAILABILITY_TYPE_CHOICES = (
        (AVAILABILITY_STANDARD, 'Standard'),
        (AVAILABILITY_UPGRADE, 'Upgrade'),
        (AVAILABILITY_NOT_USED, 'Not Used'),
        (AVAILABILITY_OPTION, 'Optional Extra'),
        (AVAILABILITY_SELECTION, 'Selection'),
    )

    series = models.ForeignKey(Series, on_delete=models.DO_NOTHING)
    sku = models.ForeignKey(SKU, on_delete=models.DO_NOTHING)
    availability_type = models.IntegerField(choices=AVAILABILITY_TYPE_CHOICES)
    is_visible_on_spec_sheet = models.BooleanField(default=False)
    contractor_description = models.CharField(max_length=512, null=True, blank=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return "%s | %s | %s"%(self.series, self.sku.name, self.get_availability_type_display())

    class Meta(object):
        db_table = 'series_sku'
        verbose_name = 'Series SKU'
        verbose_name_plural = 'Series SKUs'


class Rule(PermanentModel, models.Model):
    RULE_ADD_EXTRAS = 1
    RULE_MAKE_SELECTION = 2
    RULE_WARNING_NOTE = 3
    RULE_CUSTOMER_ENTRY_DETAILS = 4
    RULE_PRICE_MULTIPLY = 5
    RULE_ADD_PRODUCTION_NOTE = 6
    RULE_MARK_ON_PLAN = 7
    RULE_FORCE_SELECTION = 8
    RULE_PRICE_ADJUSTMENT = 9
    RULE_FORCE_UNSELECTION = 10

    RULE_TYPE_CHOICES = (
        (RULE_ADD_EXTRAS, 'Add Extras'),
        (RULE_MAKE_SELECTION, 'Make Selection'),
        (RULE_WARNING_NOTE, 'Display Warning'),
        (RULE_CUSTOMER_ENTRY_DETAILS, 'Customer Entry Details'),
        (RULE_PRICE_MULTIPLY, 'Multiply Price'),
        (RULE_ADD_PRODUCTION_NOTE, 'Add Production Note'),
        (RULE_MARK_ON_PLAN, 'Mark on Plan'),
        (RULE_FORCE_SELECTION, 'Force Selection'),
        (RULE_FORCE_UNSELECTION, 'Force Unselection'),
        (RULE_PRICE_ADJUSTMENT, 'Price Adjustment Based on Selection'),
    )

    RULE_TYPE_CODE_MAP = {
        RULE_ADD_EXTRAS: 'ADD_EXTRAS',
        RULE_MAKE_SELECTION: 'MAKE_SELECTION',
        RULE_WARNING_NOTE: 'WARNING',
        RULE_CUSTOMER_ENTRY_DETAILS: 'CUSTOMER_ENTRY',
        RULE_PRICE_MULTIPLY: 'PRICE_MULTIPLY',
        RULE_ADD_PRODUCTION_NOTE: 'PRODUCTION_NOTE',
        RULE_MARK_ON_PLAN: 'MARK_PLAN',
        RULE_FORCE_SELECTION: 'FORCE_SELECTION',
        RULE_FORCE_UNSELECTION: 'FORCE_UNSELECTION',
        RULE_PRICE_ADJUSTMENT: 'PRICE_ADJUSTMENT',
    }

    title = models.CharField(max_length=128)
    type = models.IntegerField(choices=RULE_TYPE_CHOICES)
    text = models.TextField()
    sku = models.ForeignKey(SKU, null=True, blank=True, on_delete=models.DO_NOTHING)
    series = models.ManyToManyField(Series, blank=True)
    associated_skus = models.ManyToManyField(SKU, related_name='associated_skus', blank=True)
    price_adjustment = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return "%s (%s)" % (self.title, self.get_type_display())

    @property
    def type_code(self):
        return self.RULE_TYPE_CODE_MAP[self.type]

    class Meta(object):
        ordering = ('title', 'type')
        verbose_name = 'Rule'
        verbose_name_plural = 'Rules'
