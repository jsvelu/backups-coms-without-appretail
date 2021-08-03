from django.db import models
from django_permanent.models import PermanentModel
from django.utils.safestring import mark_safe

from orders.models import Order


# Create your models here.
class QAType(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'qa_type'


class QAItem(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    qa_type = models.ForeignKey(QAType, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name + ' under ' + str(self.qa_type)

    class Meta:
        db_table = 'qa_item'


class OrderQAItem(PermanentModel, models.Model):
    VERIFIED_CHOICES = (
        ('Y', 'Yes'),
        ('N', 'No'),
        ('/', 'N/A'),
    )

    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    qa_item = models.ForeignKey(QAItem, on_delete=models.DO_NOTHING)
    verified = models.CharField(max_length=1, choices=VERIFIED_CHOICES)

    def __str__(self):
        return str(self.order.id) + '| ' + str(self.qa_item)

    class Meta:
        db_table = 'order_qa_item'


class OrderQAItemPhoto(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    order_qa_item = models.ForeignKey(OrderQAItem, on_delete=models.DO_NOTHING)
    photo = models.ImageField(upload_to='skus', null=True)

    @mark_safe
    def image_tag(self):
        if self.photo:
            return '<img src="%s" style="width:125px;height:125px;" />' % self.photo.url
        else:
            'No image'

    image_tag.short_description = 'Image'
    image_tag.allow_tags = True

    def __str__(self):
        try:
            item_photo = '' if self.photo.name is None else self.photo.name
        except Exception:
            item_photo = ''

        return item_photo + ' | ' + str(self.order_qa_item.qa_item.name)

    class Meta:
        db_table = 'order_qa_item_photo'
