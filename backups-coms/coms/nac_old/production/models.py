import os

from allianceutils.models import NoDeleteModel
from authtools.models import User
from django.conf import settings
from django.db import DatabaseError
from django.db import models
from django.db import transaction
import django.utils
from django_permanent.models import PermanentModel

from newage.utils import generate_random_str
from orders.models import Order


class CoilType(PermanentModel, models.Model):
    name = models.CharField(max_length=255, blank=False, verbose_name='Coil Type')

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'build_coil_type'
        verbose_name = 'Coil Type'


class BuildOrder(models.Model):
    production_month = models.DateField()
    order_number = models.IntegerField(default=None, blank=True, null=True)
    production_unit = models.IntegerField(default=1)

    class Meta:
        unique_together = ('production_month', 'order_number', 'production_unit',)

    fixtures_autodump = ['dev']

    def get_or_create_next(self):
        "Returns the next BuildOrder in the same month. Create a new one if it doesn't exist yet"
        return BuildOrder.objects.get_or_create(production_month=self.production_month, production_unit=self.production_unit, order_number=self.order_number + 1)[0]

    def get_previous(self):
        "Returns the previous BuildOrder in the same month, or None if the current BuildOrder is the first one in the month"
        if self.order_number == 1:
            return None
        return BuildOrder.objects.get(production_month=self.production_month, order_number=self.order_number - 1)

    def save(self, *args, **kwargs):
        self.production_month = self.production_month.replace(day=1)
        return super(BuildOrder, self).save()

    def __str__(self):
        return 'BuildOrder: #{} in {}'.format(self.order_number, self.production_month.strftime(settings.FORMAT_DATE_MONTH))


class Build(PermanentModel, models.Model):
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        primary_key=True
    )

    BUILD_PRIORITY_ASAP = 1
    BUILD_PRIORITY_FIXED = 2
    BUILD_PRIORITY_TENTATIVE = 3
    BUILD_PRIORITY_CHOICES = (
        (BUILD_PRIORITY_ASAP, 'ASAP'),
        (BUILD_PRIORITY_FIXED, 'Fixed'),
        (BUILD_PRIORITY_TENTATIVE, 'Tentative'),
    )
    BUILD_PRIORITY_CLASS = {
        BUILD_PRIORITY_ASAP: 'priority-asap',
        BUILD_PRIORITY_FIXED: 'priority-fixed',
        BUILD_PRIORITY_TENTATIVE: 'priority-tentative',
    }

    build_date_original = models.DateField(null=True, verbose_name='Build Date')
    build_date = models.DateField(null=True, verbose_name='Build Date', db_index=True)
    build_priority = models.IntegerField(verbose_name='Build Status', choices=BUILD_PRIORITY_CHOICES, default=BUILD_PRIORITY_TENTATIVE)

    drawing_on = models.DateTimeField(null=True, verbose_name='Drawings completed')
    drawing_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, verbose_name='Drawings completed by', related_name='%(class)s_drawing_set')

    drawing_to_prod_on = models.DateTimeField(null=True, verbose_name='Drawings to Production on')
    drawing_to_prod_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, verbose_name='Drawings to Production by', related_name='%(class)s_drawing_to_prod_by_set')

    chassis_ordered_on = models.DateTimeField(null=True, verbose_name='Chassis Ordered on')
    chassis_ordered_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, verbose_name='Chassis Ordered by', related_name='%(class)s_chassis_ordered_by_set')

    coils_ordered_on = models.DateTimeField(null=True, verbose_name='Coils Ordered by')
    coils_ordered_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, verbose_name='Coils Ordered on', related_name='%(class)s_coils_ordered_by_set')

    frame_galvanized = models.NullBooleanField(verbose_name='Galvanised Frame?')

    coil_type = models.ForeignKey(CoilType, on_delete=models.PROTECT, verbose_name='Coil Type')

    drafter = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True, verbose_name='Drafter Appointed')

    qc_date_planned = models.DateField(null=True)
    qc_date_actual = models.DateField(null=True)
    vin_number = models.CharField(max_length=255, null=True, blank=True, verbose_name='VIN Appointed')
    weight_tare = models.IntegerField(null=True)
    weight_atm = models.IntegerField(null=True)
    weight_tow_ball = models.IntegerField(null=True)
    weight_tyres = models.CharField(max_length=15, null=True, blank=True)
    weight_chassis_gtm = models.IntegerField(null=True)
    weight_gas_comp = models.IntegerField(null=True)
    weight_payload = models.IntegerField(null=True)

    build_order = models.OneToOneField(BuildOrder, null=True, on_delete=models.DO_NOTHING)

    fixtures_autodump = ['dev']

    def __str__(self):
        # print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", self.order, str(self.order))
        return str(self.order)

    class Meta:
        db_table = 'build'
        verbose_name = 'Order Build Details'
        verbose_name_plural = 'Order Build Details'
        permissions = (
        )

    def save(self, do_not_assign_build_order=False, force_create_build_order=False, *args, **kwargs):
        # If do_not_assign_build_order == True, do not assign a new build order even if the build doesn't have one at the moment.
        # If force_create_build_order == True, assign a new build order even if one already exists.

        self.build_date_original = self.build_date_original or self.build_date
        current_month = None
        if force_create_build_order or (self.build_order is None and not do_not_assign_build_order):
            current_month = self.build_order.production_month if self.build_order else None
            production_month = self.order.delivery_date.replace(day=1)
            production_unit=self.order.orderseries.production_unit
            build_orders = BuildOrder.objects.filter(production_month=production_month, production_unit=production_unit, build__isnull=False)

            if build_orders.last():
                self.build_order = build_orders.last().get_or_create_next()
            else:
                self.build_order, _created = BuildOrder.objects.get_or_create(production_month=production_month, production_unit=production_unit, order_number=1)
        result = super(Build, self).save(*args, **kwargs)

        # if, on the other hand, this order either have no submitted date or have cancelled date, it should not have a build order linking to it.
        if self.build_order and (self.order.order_cancelled or not self.order.order_submitted):
            # two things need to happen here:

            # 1 - all orders after current one shall have their build-order-seq id regenerated
            # the code down below outside this block is able to handle this, we just need to feed it "current_month":
            current_month = self.build_order.production_month
            # 2 - this "self" should have its build order removed
            self.build_order = None
            super(Build, self).save(*args, **kwargs)

        if current_month:
            production_unit=self.order.orderseries.production_unit

            self.reset_sequence_for_month(current_month, production_unit)

        return result

    def get_priority_string(self):
        return Build.BUILD_PRIORITY_CHOICES[self.build_priority - 1][1]

    @staticmethod
    def get_or_create_from_order(order):
        """
        Get the build from an order; if it doesn't exist then return a new (unsaved) one
        """
        try:
            return order.build
        except models.ObjectDoesNotExist:
            return Build(order_id=order.id)

    def move_to_position_in_month(self, position, month, production_unit, expected_previous_order_id=None, expected_next_order_id=None):
        """
        Moves the current build into the given build order position in the given month.
        The expected order ids can be provided to identify race conditions.

        Args:
            position: The new position in the month. Accepts negative values.
            month: The month to move the build to
            expected_previous_order_id: If provided, the function will check that the id of the order before this one (after is has been moved) matches this value, otherwise doesn't commit the change.
            expected_next_order_id: If provided, the function will check that the id of the order after this one (after is has been moved) matches this value, otherwise doesn't commit the change.

        Returns: True if the build has been moved, False otherwise.

        """
        month = month.replace(day=1)
        previous_order_id = None
        next_order_id = None

        try:
            with transaction.atomic():

                # Remove current build from current month
                old_month = self.build_order.production_month
                last_order_in_month = Build.objects.filter(build_order__production_month=month, build_order__production_unit= production_unit).order_by('build_order__order_number').last()

                self.build_order = None
                self.save(do_not_assign_build_order=True)

                # Calculate new position for build in new month
                build_orders = BuildOrder.objects.filter(production_month=month, production_unit=production_unit, build__isnull=False)
                if build_orders.count() > 0:
                    max_position = build_orders.aggregate(models.Max('order_number'))['order_number__max'] + 1
                    last_build_order = build_orders.latest('order_number')
                else:
                    max_position = 1
                    last_build_order = None

                if position > max_position:  # Insert at end of the month
                    if old_month != month:
                        position = max_position + 1
                    else:
                        # Current month - If order is last don't move, else move.
                        # If move since we will move an order which is above and place it at end position will max -1
                        position = max_position if last_order_in_month == self else max_position - 1

                # Negative indexing puts the order at the end of the month
                if position < 0:
                    position += max_position + 1

                new_position = max(1, min(position, max_position))  # new_position between 1 and (max order_number)+1 for this month

                # Reassigning all build order for the destination month

                # Make sure there is a build order after the current last one, so that we know we can assign it a build
                if last_build_order:
                    last_build_order.get_or_create_next()

                new_month_build_order_ids = list(BuildOrder.objects.filter(production_month=month, production_unit=production_unit).order_by('order_number').values_list('id', flat=True))  # Converting to list to avoid issue in django-permanent (https://github.com/meteozond/django-permanent/issues/62)
                new_month_build_ids = list(Build.objects.filter(build_order__production_month=month, build_order__production_unit=production_unit).order_by('build_order__order_number').values_list('pk', flat=True))

                # Unassign all build orders for month
                Build.objects.filter(build_order__production_month=month, build_order__production_unit=production_unit).update(build_order_id=None)

                # Reassign build orders in order, up to new position
                for index, build_id in enumerate(new_month_build_ids[:new_position - 1]):  # -1 because position starts from 1
                    Build.objects.filter(pk=build_id).update(build_order_id=new_month_build_order_ids[index])

                # Assign new build to build order at new position
                new_build_order, _created = BuildOrder.objects.get_or_create(production_month=month, order_number=new_position, production_unit=production_unit)
                Build.objects.filter(pk=self.pk).update(build_order_id=new_build_order.id)

                # Reassign build orders in order, from new position
                for index, build_id in enumerate(new_month_build_ids[new_position - 1:]):
                    Build.objects.filter(pk=build_id).update(build_order_id=new_month_build_order_ids[new_position + index])

                # Check previous and next order ids
                new_month_build_ids = [b.pk for b in Build.objects.filter(build_order__production_month=month, build_order__production_unit=production_unit).order_by('build_order__order_number')]
                if new_position > 1:
                    previous_order_id = new_month_build_ids[new_position - 2]  # -1 because new_position starts from 1 and not from 0, and -1 to get the previous one

                if new_position < len(new_month_build_ids):
                    next_order_id = new_month_build_ids[new_position]  # -1 because new_position starts from 1 and not from 0, and +1 to get the next one

                is_valid = (
                    (expected_previous_order_id is None or previous_order_id == expected_previous_order_id) and
                    (expected_next_order_id is None or next_order_id == expected_next_order_id)
                )

                if not is_valid:
                    raise self.DoNotCommitException()

                if old_month != month:
                    # Reset the build order sequence within old month
                    self.reset_sequence_for_month(old_month, production_unit)

        except self.DoNotCommitException:
            return False

        return True

    def reset_sequence_for_month(self, month, production_unit):
        month_build_order_ids = list(BuildOrder.objects.filter(production_month=month, production_unit=production_unit).order_by('order_number').values_list('id', flat=True))  # Converting to list to avoid issue in django-permanent (https://github.com/meteozond/django-permanent/issues/62)
        month_build_ids = list(Build.objects.filter(build_order_id__in=month_build_order_ids, build_order__production_unit=production_unit).order_by('build_order__order_number').values_list('pk', flat=True))
        for index, build_id in enumerate(month_build_ids):
            # Using filter().update() generates an SQL UPDATE instead of going through the django save logic which is much faster and done in 1 request.

            # WARNING: This means we don't generate an Audit entry for this modification

            Build.objects.filter(pk=build_id).update(build_order_id=month_build_order_ids[index])

    class DoNotCommitException(DatabaseError):
        "Any subclass of DatabaseError will cause a `transaction.atomic()` block to be rolled back."
        pass


class Checklist(PermanentModel, models.Model):
    BUILD_SECTION_PRODUCTION = 10
    BUILD_SECTION_QUALITY = 20
    BUILD_SECTION_NOTES = 30
    BUILD_SECTION_CHOICES = (
        (BUILD_SECTION_PRODUCTION, 'Production'),
        (BUILD_SECTION_QUALITY, 'Quality Control'),
        (BUILD_SECTION_NOTES, 'Notes'),
    )

    section = models.IntegerField(choices=BUILD_SECTION_CHOICES)

    display_order = models.IntegerField()

    name = models.CharField(max_length=255)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.get_section_display() + ': ' + self.name

    class Meta:
        db_table = 'build_checklist'
        verbose_name = 'Build Checklist'


class BuildNote(PermanentModel, models.Model):
    """
    A general department note for a given build
    """
    build = models.ForeignKey(Build, on_delete=models.PROTECT)
    checklist = models.ForeignKey(Checklist, on_delete=models.PROTECT)
    recorded_on = models.DateTimeField()
    recorded_by = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    text = models.TextField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return django.utils.text.Truncator(self.text).chars(50)

    class Meta:
        db_table = 'build_note'
        verbose_name = 'Build Note'


class Step(PermanentModel, models.Model):
    """
    A step in the build or QA process
    """
    checklist = models.ForeignKey(Checklist, on_delete=models.PROTECT)
    display_order = models.IntegerField()
    name = models.CharField(max_length=255)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.checklist + ': ' + self.name

    class Meta:
        db_table = 'build_step'
        verbose_name = 'Build Step'


class ChecklistOverride(NoDeleteModel, models.Model):
    """
    Override of checklist completion for a build
    """
    build = models.ForeignKey(Build, on_delete=models.PROTECT)

    checklist = models.ForeignKey(Checklist, on_delete=models.PROTECT)

    recorded_on = models.DateTimeField(verbose_name='Recorded on')
    recorded_by = models.ForeignKey(User, verbose_name='Recorded by', on_delete=models.DO_NOTHING)

    COMPLETION_CHOICES = (
        (None, 'Default'),
        (False, 'Override as incomplete'),
        (True, 'Override as complete'),
    )
    is_complete = models.NullBooleanField(choices=COMPLETION_CHOICES, verbose_name='Completion Override')

    fixtures_autodump = ['dev']

    class Meta:
        db_table = 'build_checklist_override'
        verbose_name = 'Build Checklist Override'
        unique_together = (
            ('build', 'checklist'),
        )
        default_permissions = ()
        permissions = (
            ('modify_checklistoverride', 'Can set build checklist overrides'),
        )


class Outcome(PermanentModel, models.Model):
    """
    The outcome of completing (or attempting to complete) a build step
    """
    BUILD_STATUS_NO = 0
    BUILD_STATUS_YES = 1
    BUILD_STATUS_NA = 2
    BUILD_STATUS_CHOICES = (
        (BUILD_STATUS_YES, 'Yes'),
        (BUILD_STATUS_NO, 'No'),
        (BUILD_STATUS_NA, 'NA'),
    )
    build = models.ForeignKey(Build, on_delete=models.PROTECT)

    step = models.ForeignKey(Step, on_delete=models.PROTECT)

    recorded_on = models.DateTimeField(verbose_name='Recorded on')
    recorded_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, verbose_name='Recorded by')

    status = models.IntegerField(choices=BUILD_STATUS_CHOICES)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.step + ': ' + self.get_status_display()

    class Meta:
        db_table = 'build_outcome'
        verbose_name = 'Build Outcome'
        unique_together = (
            ('build', 'step'),
        )

    def is_complete(self):
        """
        Return true if this item has been resolve (either with a YES or a NA)
        """
        return self.status == Outcome.BUILD_STATUS_YES or self.status == Outcome.BUILD_STATUS_NO


class OutcomeNote(PermanentModel, models.Model):
    """
    A note made while completing a step in the build process
    """
    outcome = models.ForeignKey(Outcome, on_delete=models.DO_NOTHING)
    recorded_on = models.DateTimeField()
    recorded_by = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    text = models.TextField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.text

    class Meta:
        db_table = 'build_outcome_note'
        verbose_name = 'Build Outcome Note'


def _invoke_image_file_path(instance, filename):
    return instance.image_file_path(filename)


class AbstractBuildImage(models.Model):
    image_file = models.ImageField(max_length=255, upload_to=_invoke_image_file_path)
    recorded_on = models.DateTimeField()
    recorded_by = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    is_shared = models.BooleanField(default=False)

    class Meta:
        abstract = True


class OutcomeImage(PermanentModel, AbstractBuildImage):
    """
    An image taken while completing a step in the build process
    """
    outcome = models.ForeignKey(Outcome, on_delete=models.DO_NOTHING)

    fixtures_autodump = ['dev']

    def image_file_path(self, filename):
        name, ext = os.path.splitext(filename)
        return '/'.join(['builds', str(self.outcome_id), name + '_' + generate_random_str() + ext])

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.outcome.step.name + " in " + str(self.outcome.step.checklist.section)\
               + " | " + self.image_file.name

    class Meta:
        db_table = 'build_outcome_image'
        verbose_name = 'Build Outcome Image'
