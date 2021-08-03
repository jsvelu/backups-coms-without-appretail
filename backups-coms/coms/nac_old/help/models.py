from ckeditor_uploader.fields import RichTextUploadingField
from django.db import models
from django_permanent.models import PermanentModel


class HelpContent(PermanentModel, models.Model):
    code = models.CharField(max_length=32, blank=False, null=False)
    name = models.CharField(max_length=255, blank=False, null=False)
    content = RichTextUploadingField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return str(self.name)
