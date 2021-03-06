

from datetime import timedelta
from os import path

from allianceutils.models import combine_querysets_as_manager
from authtools.models import User
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
import django_permanent.models
from django_permanent.models import PermanentModel

from caravans.models import Rule
from caravans.models import Series
from caravans.models import SeriesSKU
from caravans.models import SKU
from caravans.models import SKUCategory
from customers.models import Customer
from dealerships.models import Dealership
from dealerships.models import DealershipUser
import production
from salesforce.api import SalesforceApi
from salesforce.api import SalesforceAPIError
from salesforce.api import SalesforceAPIResponseError
from functools import reduce


def add_timestamp(filename):
    fileparts = path.splitext(filename)
    filename = "%s_%s%s" % (fileparts[0], timezone.now().strftime(settings.FORMAT_DATETIME_ONEWORD), fileparts[1])
    return filename


def order_document_path(instance, filename):
    subdir = 'documents'
    if instance.type == OrderDocument.DOCUMENT_CUSTOMER_PLAN:
        subdir = 'customer_plans'
    elif instance.type == OrderDocument.DOCUMENT_FACTORY_PLAN:
        subdir = 'factory_plans'
    elif instance.type == OrderDocument.DOCUMENT_CHASSIS_PLAN:
        subdir = 'chassis_plans'
    elif instance.type == OrderDocument.PLUMBING_CERTIFICATE:
        subdir = 'plumbing'
    elif instance.type == OrderDocument.ELECTRICAL_CERTIFICATE:
        subdir = 'electrical'
    elif instance.type == OrderDocument.WEIGHBRIDGE_CERTIFICATE:
        subdir = 'weighbridge'
    elif instance.type == OrderDocument.QUALITYCONTROL_CERTIFICATE:
        subdir = 'qualitycontrol'
    elif instance.type == OrderDocument.DOCUMENT_CERTIFICATE:
        subdir = 'certificates'
    return '/'.join(['orders', str(instance.order.id), subdir, add_timestamp(filename)])


def order_note_path(instance, filename):
    subdir = 'notes'
    return '/'.join(['orders', str(instance.order.id), subdir, add_timestamp(filename)])


def order_special_feature_document_path(instance, filename):
    subdir = 'special_feature'
    return '/'.join(['orders', str(instance.order.id), subdir, add_timestamp(filename)])


def rule_plan_path(instance, filename):
    return '/'.join(['orders', str(instance.order.id), 'rule_plans', add_timestamp(filename)])


class OrderQuerySet(models.QuerySet):
    def filter_by_visible_to(self, user):
        # filter by orders that are viewable to user
        if user.has_perm('orders.view_order_all'): return self
        if not user.has_perm('orders.view_order_own'): return self.none()
        if not user.id: return self.none()

        try:
            user = user.dealershipuser
        except DealershipUser.DoesNotExist:
            return self.none()

        dealership_ids = user.dealershipuser.get_dealership_ids()
        dealership_principal_ids = user.dealershipuser.get_dealership_principal_ids()
        return self.filter(
            Q(dealership_id__in=dealership_ids) |
            Q(dealership_id__in=dealership_principal_ids)
        )


class Show(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    stand_manager = models.ForeignKey(User, related_name="stand_manager_1_order_set", verbose_name="Stand Manager 1", on_delete=models.PROTECT)
    stand_manager_2 = models.ForeignKey(User, related_name="stand_manager_2_order_set", on_delete=models.PROTECT, null=True, blank=True)
    stand_manager_3 = models.ForeignKey(User, related_name="stand_manager_3_order_set", on_delete=models.PROTECT, null=True, blank=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return '{} ({} - {})'.format(self.name, self.start_date, self.end_date)

    @classmethod
    def is_user_standmanager(cls, user):
        today = timezone.now().date()
        show_filter = cls.objects.filter(start_date__lte=today, end_date__gte=today)
        return show_filter.filter(stand_manager=user).exists() \
               or show_filter.filter(stand_manager_2=user).exists() \
               or show_filter.filter(stand_manager_3=user).exists()


class ChassisNumber(models.Model):
    """
    This model serves no real purpose but was created and now kept here for historical reasons.
    While it will *mostly* match order.chassis, its NOT always the case - and when these two values conflict with each other,
    the order.chassis value should be respected.
    """
    id = models.AutoField(primary_key=True)
    assigned_at = models.DateTimeField()
    assigned_by = models.ForeignKey(User, on_delete=models.PROTECT)
    order = models.OneToOneField('Order', null=True, on_delete=models.DO_NOTHING)

    fixtures_autodump = ['dev']

    @property
    def number(self):
        return self.id

    def __str__(self):
        return "NA{:04}".format(self.number)


class FinalizationError(Exception):
    pass


class Order(PermanentModel, models.Model):
    EXPIRY_PERIOD = timedelta(30) # 30 days after creation
    EXPIRY_PERIOD_AFTER_SHOW = timedelta(2) # 2 days after show

    objects = combine_querysets_as_manager(OrderQuerySet, django_permanent.models.NonDeletedQuerySet)
    deleted_objects = combine_querysets_as_manager(OrderQuerySet, django_permanent.models.DeletedQuerySet)
    all_objects = combine_querysets_as_manager(OrderQuerySet, django_permanent.models.PermanentQuerySet)

    """
    The ordering of these stages matters as it is used to determine when a quote becomes an order
    The exact integer value is not important as it is not saved in the model
    """
    # Initial quote
    STAGE_QUOTE = 1
    # Quote with selections made
    STAGE_QUOTE_SELECTIONS = 2
    # Quote submitted for approval but rejected
    STAGE_ORDER_REJECTED = 3
    # Quote submitted
    STAGE_ORDER_REQUESTED = 4
    # Quote approved; is now an order
    STAGE_ORDER = 5
    # Order cancelled
    STAGE_CANCELLED = 6
    # Order finalization approved
    STAGE_ORDER_FINALIZED = 7

    STAGE_CODE = {
        STAGE_QUOTE: 'QUOTE',
        STAGE_QUOTE_SELECTIONS: 'QUOTE_SELECTIONS',
        STAGE_ORDER_REQUESTED: 'ORDER_REQUESTED',
        STAGE_ORDER_REJECTED: 'ORDER_REJECTED',
        STAGE_ORDER: 'ORDER',
        STAGE_CANCELLED: 'CANCELLED',
        STAGE_ORDER_FINALIZED: 'ORDER_FINALIZED',
    }

    STATUS_NONE = 0
    STATUS_REJECTED = 1
    STATUS_PENDING = 2
    STATUS_APPROVED = 3

    id = models.AutoField(primary_key=True)

    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.PROTECT)
    dealership = models.ForeignKey(Dealership, on_delete=models.PROTECT)
    dealer_sales_rep = models.ForeignKey(DealershipUser, related_name='dealer_sales_reap_order_set', on_delete=models.PROTECT)
    customer_manager = models.ForeignKey(DealershipUser, related_name='customer_manager_order_set', on_delete=models.PROTECT)
    delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    show = models.ForeignKey(Show, null=True, blank=True, on_delete=models.PROTECT)

    custom_series_name = models.CharField(max_length=500, blank=True)
    custom_series_code = models.CharField(max_length=500, blank=True)

    weight_estimate_disclaimer_checked = models.BooleanField(default=False)
    custom_tare_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    custom_ball_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    price = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    price_adjustment_cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    price_adjustment_wholesale = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    price_adjustment_wholesale_comment = models.CharField(max_length=2000, blank=True)
    price_adjustment_retail = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    dealer_load = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    trade_in_write_back = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    trade_in_comment = models.CharField(max_length=2000, blank=True)

    after_sales_wholesale = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    after_sales_retail = models.DecimalField(max_digits=8, decimal_places=2, null=True, default=0)
    after_sales_description = models.CharField(max_length=2000, blank=True)

    price_comment = models.CharField(max_length=2000, blank=True)

    # The value of this field should only be upadted by calling Order.update_missing_selections_status()
    # This is a very expensive operation in terms of database access and should only be updated when changes are done in selections
    has_missing_selections = models.BooleanField(default=True)

    created_on = models.DateTimeField()

    caravan_details_saved_on = models.DateTimeField(null=True, blank=True, verbose_name='Caravan Details Saved on')
    caravan_details_saved_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Caravan Details Saved by', related_name='%(class)s_caravan_details_saved_by_set', on_delete=models.PROTECT)

    # When not null, date/time order requested by sales rep
    order_requested = models.DateTimeField(null=True, blank=True)

    # When not null, date/time order rejected by dealer principal
    order_rejected = models.DateTimeField(null=True, blank=True)

    # When not null, date/time order placed by dealer principal
    order_submitted = models.DateTimeField(null=True, blank=True)

    # When not null, date/time order converted from stock order to customer order (and a flag for tracking if converted)
    order_converted = models.DateField(null=True, blank=True)
    is_order_converted = models.BooleanField(default=False)

    order_cancelled = models.DateTimeField(null=True, blank=True)
    order_cancelled_reason = models.CharField(max_length=2000, blank=True)

    # When not null, date/time order is accepted by newage
    order_date = models.DateTimeField(null=True, blank=True)

    # When not null, date/time order is requested for final approval (and who's requesting)
    order_finalization_requested_at = models.DateTimeField(null=True, blank=True)  # Used only for legacy data
    order_finalization_requested_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Finalization requested by', related_name='%(class)s_order_finalization_requested_by_set', on_delete=models.PROTECT)  # Used only for legacy data

    # When not null, date/time order is finalised, no further changes can be made
    order_finalized_at = models.DateTimeField(null=True, blank=True)
    order_finalization_was_auto = models.NullBooleanField(default=None, verbose_name='Finalization was automatic?')

    order_finalization_cancelled_at = models.DateTimeField(null=True, blank=True)
    order_finalization_cancelled_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Finalization cancelled by', related_name='%(class)s_order_finalization_cancelled_by_set', on_delete=models.PROTECT)
    order_finalization_cancel_reason = models.CharField(max_length=2000, blank=True)

    special_features_changed_at = models.DateTimeField(null=True, blank=True)
    special_features_changed_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Special features changed by', related_name='%(class)s_special_features_changed_by_set', on_delete=models.PROTECT)
    special_features_approved_at = models.DateTimeField(null=True, blank=True)
    special_features_approved_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Special features approved by', related_name='%(class)s_special_features_approved_by_set', on_delete=models.PROTECT)
    special_features_rejected_at = models.DateTimeField(null=True, blank=True)
    special_features_rejected_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Special features rejected by', related_name='%(class)s_special_features_rejected_by_set', on_delete=models.PROTECT)

    customer_plan_changed_at = models.DateTimeField(null=True, blank=True)
    customer_plan_changed_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Customer plan changed by', related_name='%(class)s_customer_plan_changed_by_set', on_delete=models.PROTECT)
    customer_plan_approved_at = models.DateTimeField(null=True, blank=True)
    customer_plan_approved_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Customer plan approved by', related_name='%(class)s_customer_plan_approved_by_set', on_delete=models.PROTECT)
    customer_plan_rejected_at = models.DateTimeField(null=True, blank=True)
    customer_plan_rejected_by = models.ForeignKey(User, null=True, blank=True, verbose_name='Customer plan rejected by', related_name='%(class)s_customer_plan_rejected_by_set', on_delete=models.PROTECT)
    customer_plan_rejected_reason = models.CharField(max_length=2000, blank=True)
    customer_plan_disclaimer_checked = models.BooleanField(default=False)

    chassis = models.CharField(max_length=255, blank=True)
    deposit_paid_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name='Deposit Amount')
    dispatch_date_planned = models.DateField(null=True, blank=True)
    dispatch_date_actual = models.DateField(null=True, blank=True)
    received_date_dealership = models.DateField(null=True, blank=True)
    delivery_date_customer = models.DateField(null=True, blank=True)

    scheduling_comments = models.CharField(max_length=2000, blank=True)
    dealer_comments = models.CharField(max_length=2000, blank=True)

    is_up_to_date_with_egm = models.BooleanField(default=False)

    salesforce_handover_recorded_at = models.DateTimeField(blank=True, null=True)
    salesforce_delivery_recorded_at = models.DateTimeField(blank=True, null=True)

    salesforce_sync_error = models.BooleanField(default=False)

    fixtures_autodump = ['dev']

    def save(self, ignore_cancellation_check=False, **kwargs):
        if self.created_on is None:
            self.created_on = timezone.now()

        try:
            self.customer_manager
        except DealershipUser.DoesNotExist:
            self.customer_manager = self.dealer_sales_rep

        if not ignore_cancellation_check and self.id and Order.objects.get(id=self.id).order_cancelled is not None:
            raise Order.OrderCancelledException()

        super(Order, self).save(**kwargs)

    def sync_salesforce(self, host_name):
        from emails.utils import send_email

        salesforce_sync_error = None

        if self.orderdocument_set.filter(type=OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM).exists():
            if self.delivery_date_customer and not self.is_stock():
                try:
                    self.salesforce_sync_error = False
                    self.send_salesforce(SalesforceApi.TRIGGER_TYPE_DELIVERY)
                except SalesforceAPIError as e:
                    self.salesforce_sync_error = True
                    salesforce_sync_error = e

                if not self.salesforce_sync_error:
                    self.salesforce_delivery_recorded_at = timezone.now()

                super(Order, self).save(update_fields=['salesforce_delivery_recorded_at', 'salesforce_sync_error'])

            else:
                try:
                    self.salesforce_sync_error = False
                    self.send_salesforce(SalesforceApi.TRIGGER_TYPE_HANDOVER)
                except SalesforceAPIError as e:
                    self.salesforce_sync_error = True
                    salesforce_sync_error = e

                if not self.salesforce_sync_error:
                    self.salesforce_handover_recorded_at = timezone.now()

                super(Order, self).save(update_fields=['salesforce_handover_recorded_at', 'salesforce_sync_error'])

        if salesforce_sync_error:
            order_url = '{}newage/orders/#/{}/customer/'.format(host_name, self.id)
            if isinstance(salesforce_sync_error, SalesforceAPIResponseError):
                error_details = ''.join(['<li>{}: {}</li>'.format(k, v) for k, v in list(salesforce_sync_error.error_block.items())])
            else:
                error_details = '<li>Connection Error: {}</li>'.format(salesforce_sync_error)

            content = '<p>There was an error updating Salesforce</p>'
            content += '<p>Order URL: <a href="{}">{}</a></p>'.format(order_url, order_url)
            content += '<p>Error message:<ul>{}</ul></p>'.format(error_details)
            send_email(
                'Salesforce Sync Error',
                content,
                settings.BATCH_EMAIL_FROM,
                settings.BATCH_EMAIL_FROM_NAME,
                settings.SALESFORCE_ERROR_EMAIL,
            )

    def send_salesforce(self, trigger):
        """
        Send this order to the Salesforce API
        :param trigger: The trigger type - SalesforceApi.TRIGGER_TYPE_DELIVERY or SalesforceApi.TRIGGER_TYPE_HANDOVER
        :return:
        """

        if self.customer:
            customer_data = {
                'first_name': self.customer.first_name,
                'last_name': self.customer.last_name,
                'customer_id': self.customer.id,
                'email': self.customer.email,
                'email_opt_in_flag': 1 if self.customer.mailing_list else 0,
                'phone_number1': self.customer.phone1,
                'phone_number2': self.customer.phone2,
                'partner_name': self.customer.partner_name,
                'registered_owner': self.customer.physical_address.name,
                'street_address': '{} {}'.format(self.customer.physical_address.address, self.customer.physical_address.address2),
                'city': self.customer.physical_address.suburb.name,
                'state': self.customer.physical_address.suburb.post_code.state.code,
                'postcode': self.customer.physical_address.suburb.post_code.number,
                'tow_vehicle': self.customer.tow_vehicle,
            }
        else:
            customer_data = {}

        caravan_data = {
            'model': self.orderseries.series.model.name,
            'series': self.orderseries.series.code,
            'trade_in_comment': self.trade_in_comment,
            'after_market_note': self.aftermarketnote.note if hasattr(self, 'aftermarketnote') else '',
            'tyres': self.build.weight_tyres,
            'tare': self.build.weight_tare,
            'atm': self.build.weight_atm,
            'tow_ball': self.build.weight_tow_ball,
            'wob': (self.build.weight_tare - self.build.weight_tow_ball) if self.build.weight_tow_ball else '',
            'gtm': (self.build.weight_atm - self.build.weight_tow_ball) if self.build.weight_tow_ball else '',
            'chassis_gtm': self.build.weight_chassis_gtm,
            'gas_comp': self.build.weight_gas_comp,
            'payload': self.build.weight_payload,
            'customer_delivery_date': self.delivery_date_customer.strftime('%Y-%m-%d') if self.delivery_date_customer else '',
        }

        api = SalesforceApi()
        return api.predict_customer(
            self.id,
            SalesforceApi.ORDER_TYPE_STOCK if self.is_stock() else SalesforceApi.ORDER_TYPE_CUSTOMER,
            trigger,
            self.dealership.name,
            self.chassis,
            self.build.vin_number,
            customer_data,
            caravan_data,
        )

    def get_order_type(self):
        """
        Returns a human-readable description of the order type
        Don't use this for logic, strings could change
        """
        if self.customer_id:
            return 'Customer'
        else:
            return 'Stock'

    def is_stock(self):
        """
        Returns true if this is a (dealership) stock order
        """
        return not self.customer_id

    def has_unmet_subject_to(self):
        """
        :return: bool - whether this order has any Subject To condition still marked as unmet.
        """
        return OrderConditions.objects.filter(order=self).exclude(details='').exclude(fulfilled=True).exists()

    def is_quote(self):
        """
        Returns true is this order is still in one of the quoting stages

        See also the JS function isStageQuote()
        """
        return self.get_order_stage() <= self.STAGE_ORDER_REQUESTED

    def get_order_stage(self):
        """
        Returns the current stage of the order
        """
        if self.order_cancelled:
            return self.STAGE_CANCELLED

        if self.order_finalized_at and (self.order_finalization_cancelled_at is None or self.order_finalization_cancelled_at < self.order_finalized_at):
            return self.STAGE_ORDER_FINALIZED

        if self.order_submitted:
            return self.STAGE_ORDER

        if self.order_rejected:
            return self.STAGE_ORDER_REJECTED

        if self.order_requested:
            return self.STAGE_ORDER_REQUESTED

        if hasattr(self, 'orderseries') and not self.has_missing_selections:
            return self.STAGE_QUOTE_SELECTIONS

        return self.STAGE_QUOTE

    def update_missing_selections_status(self):

        if not hasattr(self, 'orderseries'):
            self.has_missing_selections = True
            return

        if self.get_order_stage() == Order.STAGE_ORDER_FINALIZED:
            self.has_missing_selections = False
            return

        # Counting all SeriesSKU:
        # - whose sku.sku_category is not one of the sku_category of one of the items of the current order with an availability type of standard, selection, upgrade
        # - whose sku.sku_category is a level 2 category (department)
        # - whose availability type is one of standard, selection, upgrade
        # - whose series is the series selected for the current order
        # - which is visible on spec
        # If that count is 0, then all selections have been made
        availability_types = [
            SeriesSKU.AVAILABILITY_STANDARD,
            SeriesSKU.AVAILABILITY_SELECTION,
            SeriesSKU.AVAILABILITY_UPGRADE,
        ]

        exclude_sku_categories = list(
            row['sku__sku_category_id']
            for row
            in self.ordersku_set
                .filter(base_availability_type__in=availability_types)
                .values('sku__sku_category_id')
        )

        count = SeriesSKU.objects \
            .exclude(sku__sku_category__in=exclude_sku_categories) \
            .filter(
                is_visible_on_spec_sheet=True,
                series=self.orderseries.series,
                sku__sku_category__in=SKUCategory.objects.filter(parent__parent__isnull=False, parent__parent__parent__isnull=True),
                availability_type__in=availability_types
            ) \
            .count()

        self.has_missing_selections = count > 0

    def get_order_stage_details(self):
        """
        Returns the order stage details as a dict with fields `number`, `code` and `label`
        """
        order_stage = self.get_order_stage()

        return {
            'number': order_stage,
            'code': self.STAGE_CODE[order_stage],
            'label': 'Quote' if self.is_quote() else 'Order',
        }

    def get_status(self, requested_at, approved_at, rejected_at):
        """
        :param requested_at the latest change date
        :param approved_at the latest approval date
        :param rejected_at the latest rejection date

        :returns
         - Order.STATUS_NONE if none of the provided dates are set on the order
         - Order.STATUS_REJECTED if the rejected date is the latest of the provided dates
         - Order.STATUS_PENDING if the changed date is the latest of the provided dates
         - Order.STATUS_APPROVED if the approved date is the latest of the provided dates
        """

        def max_if_none(*args):
            """
            Returns the max of the provided item
            None values are considered smaller.
            """
            items = list([_f for _f in args if _f])
            if not items:
                return None
            return max(items)

        latest = max_if_none(requested_at, approved_at, rejected_at)

        if latest is None:
            return self.STATUS_NONE

        if latest == approved_at:
            return self.STATUS_APPROVED

        if latest == requested_at:
            return self.STATUS_PENDING

        if latest == rejected_at:
            return self.STATUS_REJECTED

        raise Exception('Unable to determine the status of the order.')

    def get_special_features_status(self):
        return self.get_status(self.special_features_changed_at, self.special_features_approved_at, self.special_features_rejected_at)

    def get_finalization_status(self):
        return self.get_status(self.order_finalization_requested_at, self.order_finalized_at, self.order_finalization_cancelled_at)

    def get_customer_plan_status(self):
        status = self.get_status(self.customer_plan_changed_at, self.customer_plan_approved_at, self.customer_plan_rejected_at)

        # When plans are removed, the actual status of the customer plans needs to be NONE (ie no plan has been added to the order)
        # even though the self.customer_plan_changed_at date is set
        if status == Order.STATUS_PENDING and OrderDocument.DOCUMENT_CUSTOMER_PLAN not in self.get_current_document_types():
            status = Order.STATUS_NONE

        return status

    def update_special_features_status(self, user):
        current_status = self.get_special_features_status()
        special_feature_list = list(self.specialfeature_set.all())

        if len(special_feature_list) == 0:
            if current_status != Order.STATUS_NONE:
                self.special_features_changed_at = None
                self.special_features_changed_by = None
                self.special_features_approved_at = None
                self.special_features_approved_by = None
                self.special_features_rejected_at = None
                self.special_features_rejected_by = None
                self.special_features_rejected_reason = None
                self.save()
            return

        if any(sp.approved is None for sp in special_feature_list):
            if current_status != Order.STATUS_PENDING:
                self.special_features_changed_at = timezone.now()
                self.special_features_changed_by = user
                self.special_features_approved_at = None
                self.special_features_approved_by = None
                self.save()
            return

        if any(not sp.approved for sp in special_feature_list):
            if current_status != Order.STATUS_REJECTED:
                self.special_features_rejected_at = timezone.now()
                self.special_features_rejected_by = user
                self.special_features_approved_at = None
                self.special_features_approved_by = None
                # Only cancel finalized orders otherwise we will create spurious status histories
                if self.get_order_stage() == Order.STAGE_ORDER_FINALIZED:
                    self.cancel_finalization(user, 'Special features rejected')  # Cancel and Save
                else:
                    self.save()
            return

        # All special features have been approved.
        if current_status != Order.STATUS_APPROVED:
            self.special_features_approved_at = timezone.now()
            self.special_features_approved_by = user
            self.save()

        return

    def finalize_order(self, user, auto_finalization = False):
        with transaction.atomic():
            if self.get_finalization_status() == Order.STATUS_APPROVED:
                raise FinalizationError('This order has already been finalised')

            if not self.order_submitted:
                raise FinalizationError('This order has not been placed')

            if self.get_special_features_status() not in [Order.STATUS_APPROVED, Order.STATUS_NONE]:
                raise FinalizationError('This order cannot be finalised while it has unapproved special features')

            previous_missing_selection_status = self.has_missing_selections
            self.update_missing_selections_status()
            if previous_missing_selection_status != self.has_missing_selections:
                # This can happen if the series specifications have changed between the moment the order has been requested for finalisation and now
                self.save()

            if self.has_missing_selections:
                # Revert the request for finalisation and Move to Quote State as there are missing selections
                self.cancel_finalization(user, "Finalisation failed because the order has missing selections.")
                raise FinalizationError('This order cannot be finalised while it has missing selections')

            if not self.chassis:
                self.allocate_chassis_number(user)

            self.order_finalized_at = timezone.now()
            self.order_finalization_was_auto = auto_finalization

            self.save()

            return

    def cancel_finalization(self, user, reason):
        with transaction.atomic():
            # Mark order cancelled
            self.order_finalization_cancelled_at = timezone.now()
            self.order_finalization_cancelled_by = user
            self.order_finalization_cancel_reason = reason

            self.order_submitted = None
            self.order_requested = None

            # Remove plans
            self.orderdocument_set.all().delete()

            # Clear customer signoff status
            self.customer_plan_changed_at = None
            self.customer_plan_changed_by = None
            self.customer_plan_approved_at = None
            self.customer_plan_approved_by = None
            self.customer_plan_rejected_at = None
            self.customer_plan_rejected_by = None
            self.customer_plan_rejected_reason = ''
            # Clear Chassis
            if hasattr(self, 'chassisnumber'):
                self.chassisnumber.delete()
            self.chassis = ''
            # Clear Appointed Drafter
            self.build.drafter = None
            self.build.save()

            self.save()

    def cancel_order(self, reason):
        try:
            build = self.build

            month = build.build_order.production_month
            production_unit = build.build_order.production_unit

            # Moving this build to the last position in month will reassign all build orders for this month
            build.move_to_position_in_month(-1, month, production_unit)

            # Then remove it
            self.build.delete(force=True)

        except production.models.Build.DoesNotExist:
            pass

        self.order_cancelled = timezone.now()
        self.order_cancelled_reason = reason
        self.save()

    def get_recipient(self):
        """
        Returns the target recipient name (customer or dealership)
        """
        return self.customer.name if self.customer else self.dealership.name

    def get_chassis_description(self):
        """
        Returns the description of the chassis depending on the current stage of the order.
        """
        if self.chassis:
            return str(self.chassis)
        elif self.is_quote():
            return 'Quote #{}'.format(self.id)
        else:
            return 'Order #{}'.format(self.id)

    def get_size_description(self):
        """
        Returns a string representing the dimension of the series if the information is available, or an empty string otherwise.
        """
        if self.orderseries.series.length_mm and self.orderseries.series.width_mm:
            return """{} X {} MM""".format(self.orderseries.series.length_mm, self.orderseries.series.width_mm)
        return ""

    def get_series_name(self):
        if not hasattr(self, 'orderseries'):
            return ''

        return self.custom_series_name or self.orderseries.series.name

    def get_series_code(self):
        if not hasattr(self, 'orderseries'):
            return ''

        return self.custom_series_code or self.orderseries.series.code

    def get_series_description(self):
        if not hasattr(self, 'orderseries'):
            return ''

        name = self.get_series_name()
        code = self.get_series_code()
        return '{} ({})'.format(name, code)

    def get_production_month(self):
        try:
            build = self.build
            if build.build_order is None:
                return ''
            month = build.build_order.production_month
            return month or ''
        except production.models.Build.DoesNotExist:
            return ''


    def get_production_start_date(self):
        try:
            build = self.build
            build_date = build.build_date
            return build_date or ''
        except production.models.Build.DoesNotExist:
            return ''

    def is_expired(self):
        if not self.is_quote():
            return False

        return False
        # as this customer has a tendency of changing mind we'll just disable expiry check here and preserve original expiry codes.
        """
        if self.get_finalization_status() == Order.STATUS_REJECTED:
            expiry_date = self.order_finalization_cancelled_at + Order.EXPIRY_PERIOD
        elif self.show:
            # Calculate expiry date from last date of the show (finishing at 23:59) + EXPIRY_PERIOD_AFTER_SHOW
            expiry_date = datetime.combine(self.show.end_date, time(23, 59)).replace(tzinfo=self.created_on.tzinfo) + Order.EXPIRY_PERIOD_AFTER_SHOW
        else:
            expiry_date = self.created_on + Order.EXPIRY_PERIOD

        return timezone.now() > expiry_date
        """

    def get_current_document_types(self):
        """
        Returns a set of the document types currently attached to the order
        """
        return set(od.type for od in self.orderdocument_set.all())

    def allocate_chassis_number(self, user):
        """Automatically assign a chassis number"""
        if self.chassis:
            return
        chassis = ChassisNumber.objects.create(
            assigned_at=timezone.now(),
            assigned_by=user,
            order=self,
        )
        self.chassis = str(chassis)
        self.save()

    def set_chassis_number(self, chassis_number, user):
        """Sets a chassis number manually"""
        if hasattr(self, 'chassisnumber'):
            self.chassisnumber.delete()

        chassis = ChassisNumber.objects.create(
            id=chassis_number,
            assigned_at=timezone.now(),
            assigned_by=user,
            order=self,
        )

        self.chassis = str(chassis)
        self.save()

    def __str__(self):
        return "Order %(order_id)d: %(chassis)s (%(series)s) for %(recipient)s %(order_date)s" % {
            'order_id': self.id,
            'chassis': str(self.chassis),
            'series': str(self.orderseries.series) if hasattr(self, 'orderseries') else 'None',
            'recipient': self.get_recipient(),
            'order_date': self.order_date.strftime('%x') if self.order_date else '',
        }

    class OrderCancelledException(ValidationError):
        def __init__(self, *args, **kwargs):
            super(Order.OrderCancelledException, self).__init__("This order has been cancelled and cannot be modified.", *args, **kwargs)


    class Meta:
        db_table = 'order'
        index_together = ['dealership']

        permissions = (
            ('view_order_all', 'Can view all orders'),
            ('view_order_own', 'Can view own orders'),
            ('view_production_data', 'Can view production data'),
            ('print_for_autocad', 'Can print Order for AutoCAD'),
            ('create_order_all', 'Can create new orders for all dealerships'),
            ('create_order_own', 'Can create new orders only for assigned dealerships'),
            ('modify_order_all', 'Can modify all orders'),
            ('modify_order_dealership', 'Can modify orders for assigned dealership'),
            ('modify_order_finalized', 'Can modify an order after it has been finalised'),

            ('request_order_approval', 'Request for an order to be approved: Step 1 in approval workflow'),
            ('approve_order_all', 'Approve any order and pass it to production for build scheduling: Step 2 in approval workflow'),
            ('approve_order_own', 'Approve order in own dealership only and pass it to production for build scheduling: Step 2 in approval workflow'),
            ('cancel_order', 'Cancel any order'),
            ('finalize_order_all', 'Finalise an order: Step 3 in approval workflow'),
            ('cancel_finalization', 'Reverse order finalisation'),
            # next step in the order approval workflow uses the default permission builds.add_build permission

            ('view_order_cost_price', 'View the cost price for an order'),
            ('view_order_trade_price_all', 'View the trade price for all orders'),
            ('view_order_retail_price', 'View the retail price for an order'),
            ('modify_order_trade_price', 'Can modify the trade price for all orders'),
            ('modify_order_retail_price', 'Can modify the retail price for an order'),
            ('modify_order_other_prices_all', 'Can modify prices for an order (including retail, dealer load, trade-in and comments'),

            ('modify_order_deposit', 'Can modify the deposit paid on an order'),
            ('modify_chassis_number', 'Can assign a chassis number for an order'),
            ('modify_order_drafter', 'Can modify drafter for an order'),

            ('modify_order_qc_date_planned', 'Can modify the planned QC date for an order'),
            ('modify_order_qc_date_actual', 'Can modify the actual QC date for an order'),
            ('modify_order_vin_number', 'Can modify VIN Number for an order'),
            ('modify_order_weights', 'Can modify weights for an order'),
            ('modify_order_dispatch_date_planned', 'Can modify the planned dispatch date for an order'),
            ('modify_order_dispatch_date_actual', 'Can modify the actual dispatch date for an order'),
            ('update_handover_to_driver_form', 'Can update the handover to driver form for an order'),
            ('modify_order_received_date_dealership', 'Can modify the dealership received date for an order'),
            ('update_handover_to_dealership_form', 'Can update the handover to dealership form for an order'),
            ('modify_order_delivery_date_customer', 'Can modify customer delivery date for an order'),

            ('print_invoice_all', 'Can print invoice for all orders'),
            ('print_invoice_own', 'Can print invoice for own orders'),

            ('reassign_order_all', 'Can reassign orders'),
            ('reassign_stock_orders', 'Can assign stock orders to a different Dealership'),

            ('approve_special_features', 'Can approve or reject special features'),
            ('modify_special_features_wholesale', 'Can modify the wholesale price of special features'),
            ('modify_special_features', 'Can modify the detailed special features'),
            ('set_custom_series', 'Can set a custom series name and code'),

            ('view_schedule_availability', 'Can view the Schedule Availability screen'),

            ('manual_override', 'Can manually override any value'),

            ('replace_sku', 'Can use the "Replace SKU" function'),
        )


class OrderDocument(PermanentModel, models.Model):
    DOCUMENT_CUSTOMER_PLAN = 1
    DOCUMENT_FACTORY_PLAN = 2
    DOCUMENT_CHASSIS_PLAN = 3
    DOCUMENT_CONTRACT = 4
    DOCUMENT_HANDOVER_TO_DRIVER_FORM = 5
    DOCUMENT_HANDOVER_TO_DEALERSHIP_FORM = 6
    PLUMBING_CERTIFICATE = 7
    ELECTRICAL_CERTIFICATE = 8
    WEIGHBRIDGE_CERTIFICATE = 9
    QUALITYCONTROL_CERTIFICATE = 10
    DOCUMENT_CERTIFICATE = 11

    DOCUMENT_TYPE_CHOICES = (
        (DOCUMENT_CUSTOMER_PLAN, 'Customer Plan'),
        (DOCUMENT_FACTORY_PLAN, 'Factory Plan'),
        (DOCUMENT_CHASSIS_PLAN, 'Chassis Plan'),
        (DOCUMENT_CONTRACT, 'Contract'),
        (DOCUMENT_HANDOVER_TO_DRIVER_FORM, 'Handover to driver form'),
        (DOCUMENT_HANDOVER_TO_DEALERSHIP_FORM, 'Handover to dealership form'),
        (PLUMBING_CERTIFICATE, 'Plumbing Certificate'),
        (ELECTRICAL_CERTIFICATE, 'Electrical Certificate'),
        (WEIGHBRIDGE_CERTIFICATE, 'Weighbridge Certificate'),
        (QUALITYCONTROL_CERTIFICATE, 'Quality Control Certificate'),
        (DOCUMENT_CERTIFICATE, 'Other Certificates'),
    )

    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    file = models.FileField(upload_to=order_document_path, null=True)
    is_separated = models.BooleanField(default=False)
    type = models.IntegerField(choices=DOCUMENT_TYPE_CHOICES)
    cert_title=models.CharField(max_length=500, blank=True)
    cert_status=models.CharField(max_length=500, blank=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.file.file.name if self.file else '(Attached separately)'

    class Meta:
        ordering = ('order', )
        permissions = (
            ('modify_orderdocument_customer_plan_own', 'Can modify a customer plan that is assigned to self'),
            ('modify_orderdocument_customer_plan_all', 'Can modify all customer plans'),
            ('modify_orderdocument_factory_plan_own', 'Can modify a factory plan that is assigned to self'),
            ('modify_orderdocument_factory_plan_all', 'Can modify all factory plans'),
            ('modify_orderdocument_chassis_plan_own', 'Can modify a chassis plan that is assigned to self'),
            ('modify_orderdocument_chassis_plan_all', 'Can modify all chassis plans'),
            ('review_customer_plan_own', 'Can approve or reject the customer plans for own orders'),
            ('review_customer_plan_all', 'Can approve or reject all customer plans'),
        )

    def save(self, *args, **kwargs):

        if self.file is None and not self.is_separated:
            raise ValidationError('A file is required if it is not attached separately')
        # print('Before Entering Serializer')
        super(OrderDocument, self).save(*args, **kwargs)


class OrderNote(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    note = models.TextField(null=True)
    file = models.FileField(upload_to=order_note_path, null=True)

    fixtures_autodump = ['dev']

    def __str__(self):
        repr = ''
        if self.note:
            repr += self.note
        if self.file:
            repr += (' ' if self.note else '') + ' File: ' + self.file.file.name
        return repr

    class Meta:
        ordering = ('order',)


class OrderSeries(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    series = models.ForeignKey(Series, on_delete=models.PROTECT)
    order = models.OneToOneField(Order, on_delete=models.PROTECT)

    cost_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    wholesale_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    ###### modified for production unit 2 ###########
    production_unit = models.IntegerField(default=1)
    ###### modified for production unit 2 ###########
    fixtures_autodump = ['dev']

    def __str__(self):
        return '%s for %s' % (self.series, self.order)

    class Meta:
        db_table = 'order_series'


class OrderSKU(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    sku = models.ForeignKey(SKU, on_delete=models.PROTECT)
    order = models.ForeignKey(Order, on_delete=models.PROTECT)
    base_availability_type = models.IntegerField(choices=SeriesSKU.AVAILABILITY_TYPE_CHOICES)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    wholesale_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    cost_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    fixtures_autodump = ['dev']

    def save(self, *args, **kwargs):
        # Checks that there is no 2 skus within the same category for an order
        if (OrderSKU.objects
                    .exclude(id=self.id)
                    .filter(order=self.order, sku__sku_category=self.sku.sku_category).exists()):

            raise ValidationError('An item already exists in department {}.'.format(self.sku.sku_category))

        return super(OrderSKU, self).save(*args, **kwargs)

    def __str__(self):
        return '%s as %s for %s' % (self.sku, self.get_base_availability_type_display(), self.order)

    class Meta:
        db_table = 'order_sku'

        ordering = ['sku__sku_category__screen_order', 'sku__sku_category__name']


class SpecialFeature(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    customer_description = models.TextField(blank=True)
    retail_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    wholesale_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    document = models.FileField(upload_to=order_special_feature_document_path, null=True)
    sku_category = models.ForeignKey(SKUCategory, on_delete=models.PROTECT, default=None) # Can target a Category or a Department
    factory_description = models.TextField(blank=True)
    approved = models.NullBooleanField()
    reject_reason = models.CharField(max_length=1000, blank=True)

    fixtures_autodump = ['dev']

    def is_blank(self):
        """
        Return True if the special feature have no notes, no charge, no wholesale price and no document attached
        """
        return (
            not self.customer_description and
            not self.retail_price and
            not self.wholesale_price and
            not self.document
        )

    def __str__(self):
        result = "An additional expense of " + str(self.retail_price)
        try:
            result += ' in ' + str(self.sku_category)
        except SKUCategory.DoesNotExist:
            pass

        result += " for Order No. " + str(self.order_id)

        return result

    class Meta:
        verbose_name = 'Special Feature'


class OrderConditions(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.PROTECT)
    details = models.TextField()
    fulfilled = models.BooleanField(default=False)

    fixtures_autodump = ['dev']


class AfterMarketNote(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.DO_NOTHING)
    note = models.TextField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.note


class OrderRulePlan(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    sku = models.ForeignKey(SKU, on_delete=models.DO_NOTHING)
    file = models.FileField(upload_to=rule_plan_path)
    notes = models.TextField()

    fixtures_autodump = ['dev']

    def __str__(self):
        return "(%(order)s) Rule Plan: %(item)s, %(file)s" % {
            'order': str(self.order.chassis),
            'item': str(self.sku),
            'file': str(self.file),
        }

    class Meta:
        ordering = (
            'order',
            'sku',
            'file',
        )


class ShowSpecial(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    availability_description = models.TextField()
    available_from = models.DateField()
    available_to = models.DateField()
    dealerships = models.ManyToManyField(Dealership)
    rules = models.ManyToManyField(Rule)
    tac_url = models.URLField("Terms and Conditions URL", max_length=2000, null=True, blank=True)

    fixtures_autodump = ['dev']

    @property
    def normal_price(self):
        """
        Returns the total price of the items included in this special, without price adjustments
        """
        return sum([sku.retail_price for rule in self.rules.all() for sku in rule.associated_skus.all()])

    @property
    def price(self):
        """
        Returns the price of this Special, after price adjustments.
        """
        return self.normal_price + sum([(rule.price_adjustment or 0) for rule in self.rules.all()])

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('name',)
        permissions = (
            ('apply_specials_all', 'Can apply any special to an order'),
        )


class OrderShowSpecial(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    special = models.ForeignKey(ShowSpecial, on_delete=models.PROTECT)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.special.name

    def value(self):
        """
        Return the total value of this special as applied to this order
        """
        return reduce(
            lambda total, line_item: total + line_item.price_adjustment,
            self.ordershowspeciallineitem_set.all(),
            0
        )

    class Meta:
        ordering = ('order',)


class OrderShowSpecialLineItem(models.Model):
    id = models.AutoField(primary_key=True)
    order_show_special = models.ForeignKey(OrderShowSpecial, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=128)
    description = models.TextField()
    price_adjustment = models.DecimalField(max_digits=8, decimal_places=2)

    fixtures_autodump = ['dev']

    def __str__(self):
        return self.name

    class Meta:
        ordering = (
            'order_show_special',
            'name',
        )


class SalesforceError(models.Model):
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING, related_name='salesforce_errors')
    timestamp = models.DateTimeField(auto_now=True)
    payload = models.TextField()
    response_code = models.CharField(max_length=255)
    response = models.TextField()
    response_delay = models.FloatField()


class CertificateDeleted(PermanentModel, models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.DO_NOTHING)
    doc_id = models.CharField(max_length=500, blank=True)
    cert_title=models.CharField(max_length=500, blank=True)
    cert_status=models.CharField(max_length=500, blank=True)

    fixtures_autodump = ['dev']

    class Meta:
        ordering = ('order', )
        db_table = 'certificates_deleted'
        verbose_name = 'Certificates Deleted'
        verbose_name_plural = 'Certificates Deleted Details'

