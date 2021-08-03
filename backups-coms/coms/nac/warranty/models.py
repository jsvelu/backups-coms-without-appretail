import os

from authtools.models import User
from django.db import models
from django_permanent.models import PermanentModel

from caravans.models import SKU
from newage.utils import generate_random_str
from orders.models import Order


def warranty_image_path(instance, filename):
    name, ext = os.path.splitext(filename)
    path = '/'.join(['warranty', str(instance.warranty_claim.pk), name + '_' + generate_random_str() + ext])
    return path

class WarrantyClaim(PermanentModel, models.Model):

    WARRANTY_STATUS_NOT_ACTIONED = 1
    WARRANTY_STATUS_REQUESTED_QUOTE = 2
    WARRANTY_STATUS_UNDER_APPROVAL = 3
    WARRANTY_STATUS_UNDER_REPAIR = 4
    WARRANTY_STATUS_COMPLETED = 5

    WARRANTY_STATUS_TYPES = (
        (WARRANTY_STATUS_NOT_ACTIONED, 'Not Actioned'),
        (WARRANTY_STATUS_REQUESTED_QUOTE, 'Requested Quote'),
        (WARRANTY_STATUS_UNDER_APPROVAL, 'Under Approval'),
        (WARRANTY_STATUS_UNDER_REPAIR, 'Under Repair'),
        (WARRANTY_STATUS_COMPLETED, 'Completed'),
    )

    order = models.ForeignKey(Order, null=False, blank=False, on_delete=models.DO_NOTHING)
    creation_time = models.DateTimeField(null=False, blank=False)
    created_by = models.ForeignKey(User, null=False, blank=False, on_delete=models.DO_NOTHING)
    sku = models.ForeignKey(SKU, null=False, blank=False, on_delete=models.DO_NOTHING)
    sku_name = models.CharField(max_length=255, null=False, blank=False)
    description = models.TextField(null=False, blank=False)
    status = models.IntegerField(choices=WARRANTY_STATUS_TYPES)
    repairer = models.CharField(max_length=255, null=True, blank=True)
    date_fixed = models.DateField(null=True, blank=True)
    cost_price = models.DecimalField(null=True, blank=True, decimal_places=2, max_digits=10)

    fixtures_autodump = ['dev']
    def __str__(self):
        return self.sku_name + ' | ' + self.description + ' | ' + self.WARRANTY_STATUS_TYPES[int(self.status) - 1][1]

    class Meta:
        db_table = 'warranty_claim'


class WarrantyClaimNote(PermanentModel, models.Model):
    warranty_claim = models.ForeignKey(WarrantyClaim, on_delete=models.DO_NOTHING)
    creation_time = models.DateTimeField(null=False, blank=False)
    created_by = models.ForeignKey(User, null=False, blank=False, on_delete=models.DO_NOTHING)
    note = models.TextField(null=False, blank=False)

    fixtures_autodump = ['dev']

    def __str__(self):
        return str(self.creation_time) + ' | ' + self.note

    class Meta:
        db_table = 'warranty_claim_note'


class WarrantyClaimPhoto(PermanentModel, models.Model):
    warranty_claim = models.ForeignKey(WarrantyClaim, on_delete=models.DO_NOTHING)
    photo = models.ImageField(upload_to=warranty_image_path, null=False, blank=False)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.photo.url

    class Meta:
        db_table = 'warranty_claim_photo'
