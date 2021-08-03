
from django.core.exceptions import ValidationError
from django.db.models.fields import BooleanField


class TrueUniqueBooleanField(BooleanField):

    def __init__(self, unique_for=None, *args, **kwargs):
        self.unique_for = unique_for
        super(TrueUniqueBooleanField, self).__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        value = super(TrueUniqueBooleanField, self).pre_save(model_instance, add)

        objects = model_instance.__class__.objects

        if self.unique_for:
            objects = objects.filter(**{self.unique_for: getattr(model_instance, self.unique_for)})

        if value and objects.exclude(id=model_instance.id).filter(**{self.attname: True}):
            msg = 'Only one instance of {} can have its field {} set to True'.format(model_instance.__class__, self.attname)
            if self.unique_for:
                msg += ' for each different {}'.format(self.unique_for)
            raise ValidationError(msg)

        return value
