from datetime import datetime

from allianceutils.middleware import CurrentUserMiddleware
from dateutil import tz
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db.models.signals import post_save
from django.db.models.signals import pre_delete
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone

from audit.models import Audit
from audit.models import AuditField
from caravans.models import Series
from caravans.models import SeriesSKU
from orders.models import OrderNote


def create_audit_fields(audit, instance, pre_instance=None):
    """
    :returns: the number of fields created
    """

    audit_fields = []
    for field in instance._meta.fields:
        rel_to = None
        if hasattr(field, 'rel'):
                rel_to = field.rel.to if field.rel else None
        elif hasattr(field, 'remote_field'):
            rel_to = field.remote_field.model if field.remote_field else None
        field_name = (field.name + '_id') if rel_to else field.name

        try:
            new_value = getattr(instance, field_name, None)
        except AttributeError:
            continue

        log_this = True
        old_value = None
        if pre_instance:
            old_value = getattr(pre_instance, field_name, None)
            try:
                if old_value == new_value:
                    log_this = False

                # a funny hidden bug used to live here: as this's called pre_save, the new_value from instance's not yet casted into proper types
                # eg: for a FloatField, getattr gives decimal.Decimal on pre_instance but the new instance will be Unicode!
                # typecast is needed (not for None tho)

                if old_value == type(old_value)(new_value):
                    log_this = False

                # yet another annoying thing - timestamp - mysql stores the value w/ fraction of seconds where django ignores them
                if isinstance(old_value, datetime):
                    if old_value.replace(microsecond=0) == type(old_value)(new_value).replace(microsecond=0):
                        log_this=False

            except TypeError:
                pass # Assume the field has changed

        if log_this:
            audit_field = AuditField()
            audit_field.audit = audit
            audit_field.name = field_name
            if isinstance(old_value, datetime):
                old_value = old_value.astimezone(tz.tzlocal())
            if isinstance(new_value, datetime):
                new_value = new_value.astimezone(tz.tzlocal())
            audit_field.changed_to = new_value
            if old_value:
                audit_field.changed_from = old_value
            audit_fields.append(audit_field)

            if field.remote_field: # For foreign keys, also log the string repr of the related record
                audit_field = AuditField()
                audit_field.audit = audit
                audit_field.name = field.name

                # if the instance is not yet saved (which gives you None), ensure that an updated foreign key's new value is correctly retrieved
                if new_value is None:
                    audit_field.changed_to = getattr(instance, field.name, None)
                else:
                    try:
                        changed_to = field.remote_field.model.objects.get(id=new_value)
                        if field.remote_field.model != Series or changed_to is None:
                            audit_field.changed_to = str(changed_to)
                        else:
                            audit_field.changed_to = changed_to.code
                    except field.remote_field.model.DoesNotExist:
                        audit_field.changed_to = getattr(instance, field.name, None)

                if pre_instance:
                    changed_from = getattr(pre_instance, field.name, None)
                    if field.remote_field.model != Series or changed_from is None:
                        audit_field.changed_from = str(changed_from)
                    else:
                        audit_field.changed_from = changed_from.code
                audit_fields.append(audit_field)

    AuditField.objects.bulk_create(audit_fields)
    return len(audit_fields)


def create_audit():
    audit = Audit()
    try:
        user = CurrentUserMiddleware.get_user()
        audit.saved_by_id = user['user_id']
        audit.user_ip = user['remote_ip']
    except KeyError:
        # This could be a batch process or similar
        pass
    audit.saved_on = timezone.now()
    return audit

@receiver(pre_save)
def model_save(sender, instance, raw, using, update_fields, **kwargs):
    if not instance.pk or not sender.objects.filter(pk=instance.pk).exists():
        # This is a CREATE event, catch it in the post_save signal

        # The second part of the condition is required as certain models can have a pk even if they are not created.
        # eg Build take their pk from the order they belong to, and thus have a pk before they are first created.
        return

    if hasattr(instance, 'skip_audit') and instance.skip_audit:
        return

    if not raw and sender._meta.app_label in getattr(settings, 'AUDIT_APPS', []):
        audit = create_audit()
        audit.content_object = instance # Check this for deletes
        audit.content_repr = str(instance)

        try:
            audit.type = Audit.ACTION_UPDATED
            # Special Features needs to be treated differently because they can actually get erased from the db.
            # When this happens, all auditing record pointing to that entity is cascade-deleted as well.
            # As such, we'll instead record special feature actions into the Order Note as plain string
            # and flag the audit to use this action.
            if type(instance).__name__ == 'SpecialFeature':
                note = OrderNote()
                note.order = instance.order
                note.note = 'Placeholder'
                note.skip_audit = True
                note.note = '%s wholesale=%s retail=%s' % (
                        instance.customer_description,
                        instance.wholesale_price,
                        instance.retail_price,
                    )
                note.save()
                audit.content_object = note
                audit.content_repr = 'Special Feature Changed'
                audit.use_content_repr_as_action = True

            audit.save() # Need to save to get the PK
            previous_instance = sender.objects.get(pk=instance.pk)

            if type(instance).__name__ == 'SpecialFeature':
                if previous_instance.approved != instance.approved:
                    if instance.approved:
                        audit.content_repr = 'Special Feature Approved'
                    elif instance.approved is False:
                        audit.content_repr = 'Special Feature Rejected'
                        note.note = '%s wholesale=%s retail=%s Reason:%s' % (
                            instance.customer_description,
                            instance.wholesale_price,
                            instance.retail_price,
                            instance.reject_reason,
                        )
                        note.save()
                    else:
                        audit.content_repr = 'Special Feature Approval/Rejection Cancelled'
                    audit.use_content_repr_as_action = True
                    audit.save()
                else:
                    note.note = 'Old: %s wholesale=%s retail=%s\nNew: %s wholesale=%s retail=%s' % (
                        previous_instance.customer_description,
                        previous_instance.wholesale_price,
                        previous_instance.retail_price,
                        instance.customer_description,
                        instance.wholesale_price,
                        instance.retail_price,
                    )
                    note.save()

            if create_audit_fields(audit, instance, previous_instance) == 0:
                audit.delete()
        except ObjectDoesNotExist:
            # Assume a create
            audit.type = Audit.ACTION_CREATED

            if type(instance).__name__ == 'SpecialFeature':
                note = OrderNote()
                note.order = instance.order
                note.note = '%s wholesale=%s retail=%s' % (instance.customer_description, instance.wholesale_price, instance.retail_price)
                note.skip_audit = True
                note.save()
                audit.content_object = note
                audit.content_repr = 'Special Feature Added'
                audit.use_content_repr_as_action = True
            elif type(instance).__name__ == 'OrderSKU' and instance.base_availability_type == SeriesSKU.AVAILABILITY_OPTION:
                # See comments below in model_delete() for Optional Extra Deleted.
                note = OrderNote()
                note.order = instance.order
                note.note = '%s' % instance.sku
                note.skip_audit = True
                note.save()
                audit.content_object = note
                audit.content_repr = 'Optional Extra Added'
                audit.use_content_repr_as_action = True

            audit.save()
            create_audit_fields(audit, instance)


@receiver(post_save)
def model_save_post(sender, instance, created, raw, using, update_fields, **kwargs):
    """
    This signal is used to catch record creation
    """
    if hasattr(instance, 'skip_audit') and instance.skip_audit:
        return

    if not raw and sender._meta.app_label in getattr(settings, 'AUDIT_APPS', []) and created:
        audit = create_audit()

        if type(instance).__name__ == 'SpecialFeature':
            note = OrderNote()
            note.order = instance.order
            note.note = '%s wholesale=%s retail=%s' % (instance.customer_description, instance.wholesale_price, instance.retail_price)
            note.skip_audit = True
            note.save()
            audit.content_object = note
            audit.content_repr = 'Special Feature Added'
            audit.use_content_repr_as_action = True
        elif type(instance).__name__ == 'OrderSKU' and instance.base_availability_type == SeriesSKU.AVAILABILITY_OPTION:
            # See comments below in model_delete() for Optional Extra Deleted.
            note = OrderNote()
            note.order = instance.order
            note.note = '%s' % instance.sku
            note.skip_audit = True
            note.save()
            audit.content_object = note
            audit.content_repr = 'Optional Extra Added'
            audit.use_content_repr_as_action = True

        elif type(instance).__name__ == 'CertificateDeleted':
            note = OrderNote()
            note.order = instance.order
            note.note = '%s' % (instance.cert_title)
            note.skip_audit = True
            note.save()
            audit.content_object = note
            audit.content_repr = 'Certificate Deleted : '
            audit.use_content_repr_as_action = True

        else:
            audit.content_object = instance
            audit.content_repr = str(instance)

        audit.type = Audit.ACTION_CREATED
        audit.save()
        create_audit_fields(audit, instance)


@receiver(pre_delete)
def model_delete(sender, instance, using, **kwargs):
    if hasattr(instance, 'skip_audit') and instance.skip_audit: return

    if sender._meta.app_label in getattr(settings, 'AUDIT_APPS', []):
        audit = create_audit()

        if type(instance).__name__ == 'SpecialFeature':
            note = OrderNote()
            note.order = instance.order
            note.note = '%s wholesale=%s retail=%s' % (instance.customer_description, instance.wholesale_price, instance.retail_price)
            note.skip_audit = True
            note.save()
            audit.content_object = note
            audit.content_repr = 'Special Feature Deleted'
            audit.use_content_repr_as_action = True
        
        

        elif type(instance).__name__ == 'OrderSKU' and instance.base_availability_type == SeriesSKU.AVAILABILITY_OPTION:
            # Optional Extra OrderSKU records, just like special features, are not PermaModel - this means once they're deleted its gone from db &
            #   thus lead to issues for existing auditing records trying to trace back to the original object.
            # Because of that, instead of the actual record the string repr is stored here just like special features. Note this has the potential to
            #   cause unwanted side effects if client change the base_availability type eg. a SKU from "Upgrade" to "Optional Extra", in both from/to
            #   directions, then proceed to delete the Selection; but this scenario was ultimately considered to be extremely unlikely to happen at
            #   the time thus current approach is deemed acceptable.
            note = OrderNote()
            note.order = instance.order
            note.note = '%s' % instance.sku
            note.skip_audit = True
            note.save()
            audit.content_object = note
            audit.content_repr = 'Optional Extra Deleted'
            audit.use_content_repr_as_action = True
        

        # elif type(instance).__name__ == 'OrderDocument':
        #     if instance.type==7 or  instance.type==8 or instance.type==9 or instance.type==10 or instance.type==11 : 
        #         note = OrderNote()
        #         note.order = instance.order
        #         note.note = '%s' % (instance.cert_title)
        #         note.skip_audit = True
        #         note.save()
        #         audit.content_object = note
        #         audit.content_repr = 'Certificate Deleted : '
        #         audit.use_content_repr_as_action = True
        else:
            audit.content_object = instance
            audit.content_repr = str(instance)
        

        audit.type = Audit.ACTION_DELETED
        audit.save()

