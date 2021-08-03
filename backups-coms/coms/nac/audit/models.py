import collections

from authtools.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.query_utils import Q


class Audit(models.Model):
    ACTION_CREATED = 1
    ACTION_UPDATED = 2
    ACTION_DELETED = 3

    ACTION_TYPE_CHOICES = (
        (ACTION_CREATED, 'Created'),
        (ACTION_UPDATED, 'Updated'),
        (ACTION_DELETED, 'Deleted'),
    )

    id = models.AutoField(primary_key=True)
    type = models.IntegerField(choices=ACTION_TYPE_CHOICES)
    saved_by = models.ForeignKey(User, related_name='%(class)s_audit_set', null=True, on_delete=models.DO_NOTHING)
    user_ip = models.GenericIPAddressField(null=True)
    saved_on = models.DateTimeField()

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    content_repr = models.CharField(max_length=512)

    use_content_repr_as_action = models.BooleanField(default=False)

    class Meta:
        index_together = ["object_id", "content_type"]
        ordering = ('-id', )

    def changes(self):
        changes = [str(f) for f in self.auditfield_set.all()]
        return ', '.join(changes)

    @staticmethod
    def get_last_change(obj, field_name):
        """
        Get the last change of a given field for a given record
        If field_name is a list or tuple, returns the latest change to these fields

        :return: {
            'before': field value before change,
            'after': field value before change,
            'saved_by': field value before change,
            'saved_on': date/time of change
        }
        """

        if isinstance(field_name, str):
            field_name = (field_name,)

        last = AuditField.objects \
            .filter(name__in=field_name,
                    audit__content_type=ContentType.objects.get_for_model(obj),
                    audit__object_id=obj.pk) \
            .filter((models.Q(changed_from__isnull=False) |
                     models.Q(changed_to__isnull=False)) &
                    (models.Q(changed_to__isnull=True) | # Need to include the special case where the new value is None as the next comparison would not match the AuditField
                    ~models.Q(changed_from=models.F('changed_to')))) \
            .order_by('-audit__saved_on') \
            .first()

        if last:
            return {
                'before': last.changed_from,
                'after': last.changed_to,
                'saved_by': last.audit.saved_by,
                'saved_on': last.audit.saved_on,
            }
        else:
            return None

    @staticmethod
    def get_creation_audit(obj):
        """
        Get the audit that records the creation of a record
        :return: Audit
        """
        return Audit.objects.filter(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.pk,
            type=Audit.ACTION_CREATED
        ).first()

    @staticmethod
    def get_all_changes(obj):
        """
        Get all audits for a given record
        :return: [{
            'before': field value before change,
            'after': field value before change,
            'saved_by': field value before change,
            'saved_on': date/time of change
        }]
        """
        if isinstance(obj, collections.Iterable):
            # content_types = [ContentType.objects.get_for_model(o) for o in obj]
            # object_pks = [o.pk for o in obj]
            filters = Q()
            for o in obj:
                filters |= Q(content_type=ContentType.objects.get_for_model(o)) & Q(object_id=o.pk)

            audits = Audit.objects.filter(filters).prefetch_related('auditfield_set')
        else:
            audits = Audit.objects.filter(content_type=ContentType.objects.get_for_model(obj), object_id=obj.pk).prefetch_related('auditfield_set')

        audits = audits.order_by('id')

        return audits


class AuditFieldBase(models.Model):
    audit = models.ForeignKey(Audit, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=128, null=True)

    class Meta:
        abstract = True
        ordering = ('name', )


class AuditField(AuditFieldBase):
    id = models.AutoField(primary_key=True)
    changed_from = models.TextField(null=True)
    changed_to = models.TextField(null=True)

    def __str__(self):
        return '%s: %s -> %s' % (
            self.name,
            self.changed_from,
            self.changed_to,
        )
