import os

from authtools.models import User
from django.db import models
from django_permanent.models import PermanentModel

from newage.utils import generate_random_str
from production.models import AbstractBuildImage
from production.models import Build


class PortalImageCollection(PermanentModel, models.Model):
    """
    A collection of images that can be shared and viewed by a customer
    """

    build = models.OneToOneField(
        Build,
        on_delete=models.CASCADE,
        primary_key=True
    )

    url_hash = models.CharField(max_length=255, verbose_name="URL Hash")
    num_visits = models.IntegerField(default=0)

    fixtures_autodump = ['dev']

    def __str__(self):
        return str(self.build)

    class Meta:
        db_table = 'portal_image_collection'
        verbose_name = 'Portal Image Collection'


class PortalImage(PermanentModel, AbstractBuildImage):
    """
    Stores an image that can be shared with a customer for a particular build
    """

    image_collection = models.ForeignKey(
            PortalImageCollection,
            on_delete=models.PROTECT,
            verbose_name='Portal Image Collection'
    )

    def image_file_path(self, filename):
        name, ext = os.path.splitext(filename)
        path = '/'.join(['builds', str(self.image_collection.build_id), name + '_' + generate_random_str() + ext])
        return path

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.image_file.name

    class Meta:
        db_table = 'portal_image'
        verbose_name = 'Portal Image'
