from datetime import datetime
from decimal import Decimal
import json

from allianceutils.views.views import JSONExceptionAPIView
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.http.response import HttpResponseForbidden
from django.utils import timezone

from caravans.models import Rule
from caravans.models import Series
from caravans.models import SeriesSKU
from caravans.models import SKUCategory
from customers.models import AcquisitionSource
from customers.models import Customer
from customers.models import CustomerStatus
from customers.models import SourceOfAwareness
from dealerships.models import Dealership
from dealerships.models import DealershipUser
from dealerships.models import DealershipUserDealership
from emails.models import EmailTemplate
from newage.egm import update_customer_on_egm
from newage.egm import update_order_on_egm
from newage.models import Address
from orders.models import AfterMarketNote
from orders.models import Order
from orders.models import OrderConditions
from orders.models import OrderSeries
from orders.models import OrderShowSpecial
from orders.models import OrderShowSpecialLineItem
from orders.models import OrderSKU
from orders.models import Show
from orders.models import SpecialFeature
from orders.serializers import SpecialFeatureSerializer
from orders.views.api.utils import get_available_delivery_months
from orders.views.api.utils import order_data
from orders.views.api.utils import parse_date
from orders.views.api.utils import send_email_from_template
from production.models import Build
from schedule.models import OrderTransport

# def get_principals(self):
#     """
#     Return a list of DealershipUser that are principals for this dealership
#     Caches results
#     """
#     if not self._principals:
#         self._principals = [dud.dealership_user for dud in DealershipUserDealership.objects.filter(dealership=self, is_principal=True)]
#     return self._principals

class SaveOrder(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while saving the order.'

    def post(self, request):

        data = json.loads(request.data['data']).get('order')

        if data.get('id', None) is not None:
            if not request.user.has_perm('orders.modify_order'):
                return HttpResponseForbidden()
            else:
                order = Order.objects.get(id=data['id'])
        else:
            if not request.user.has_perm('orders.create_order'):
                return HttpResponseForbidden()
            else:
                order = Order()

        if order.get_order_stage() == Order.STAGE_CANCELLED:
            raise ValidationError('This order has been cancelled and cannot be modified.')

        # No changes allowed once the order has been finalised, except:
        # - Customer details update (including show)
        # - Converting the order from a stock order to a customer order
        # - Detailed special features update from someone with appropriate permission
        # - Approve special feature from someone with correct permission
        # - Retail price, dealer load price, and trade-in writeback from someone with appropriate permission
        # - if the user has the permission 'orders.modify_order_finalized'
        # - Notes and comments are saved irrespective of the order state
        if order.get_finalization_status() == Order.STATUS_APPROVED and not request.user.has_perm('orders.modify_order_finalized'):
            return self.save_finalized_order(data, request, order)
        return self.save_order(data, request, order)

    def save_finalized_order(self, data, request, order):
        data_updated = False

        deals = [dud.dealership_user.id for dud in DealershipUserDealership.objects.filter(dealership=order.dealership, is_principal=True)]

        if request.user.id in deals:
            is_user_principal = True
        else:
            is_user_principal = False

        if self.is_note_updated(data):
            self.update_note_details(data, order)
            data_updated = True

        if request.user.has_perm('orders.modify_special_features'):
            self.update_special_features(request, order, data['special_features'])
            data_updated = True

        if request.user.has_perm('orders.approve_special_features'):
            for special_feature in data['special_features']:
                try:
                    special_feature_object = SpecialFeature.objects.get(id=special_feature.get('id'))
                    special_feature_object.approved = special_feature.get('approved')
                    special_feature_object.reject_reason = special_feature.get('reject_reason') or ''
                    special_feature_object.save()
                except SpecialFeature.DoesNotExist:
                    pass

            order.update_special_features_status(request.user)
            data_updated = True


        if request.user.has_perm('orders.modify_retail_prices_finalized', order):
            order.price_adjustment_retail = data.get('price_adjustments', {}).get('retail') or 0
            
            if order.dispatch_date_actual is None:
                # if request.user.has_perm('order-status.can_edit_display_totals_after_dispatch') or is_user_principal:
                order.dealer_load = data.get('dealer_load') or 0
                order.trade_in_write_back = data.get('trade_in_write_back') or 0
                order.after_sales_wholesale = data.get('after_sales', {}).get('wholesale') or 0
            else:
                if request.user.has_perm('order-status.can_edit_display_totals_after_dispatch') or is_user_principal:
                    order.dealer_load = data.get('dealer_load') or 0
                    order.trade_in_write_back = data.get('trade_in_write_back') or 0
                    order.after_sales_wholesale = data.get('after_sales', {}).get('wholesale') or 0
        

            order.after_sales_retail = data.get('after_sales', {}).get('retail') or 0
            order.after_sales_description = data.get('after_sales', {}).get('description') or ''

            order.save()
            data_updated = True


        if request.user.has_perm('orders.modify_order_other_prices', order): 

            if 'price_adjustments' in data:
                if order.dispatch_date_actual is None:
                    order.price_adjustment_wholesale = data.get('price_adjustments', {}).get('wholesale') or 0
                else:
                    if request.user.has_perm('order-status.can_edit_display_totals_after_dispatch') or is_user_principal:
                        
                        order.price_adjustment_wholesale = data.get('price_adjustments', {}).get('wholesale') or 0

                order.price_adjustment_wholesale_comment = data.get('price_adjustments', {}).get('wholesale_comment') or ''
                if order.price_adjustment_wholesale and not order.price_adjustment_wholesale_comment:
                    raise ValidationError('You need to enter a comment for the wholesale price adjustment.')
                order.save()
                data_updated = True

            if 'trade_in_write_back' in data:
                if order.dispatch_date_actual is None:
                    order.trade_in_write_back = data.get('trade_in_write_back') or 0
                    order.save()
                    data_updated = True
                else:
                    if request.user.has_perm('order-status.can_edit_display_totals_after_dispatch') or is_user_principal:
                        order.trade_in_write_back = data.get('trade_in_write_back') or 0
                        order.save()
                        data_updated = True

            if 'dealer_load' in data:
                if order.dispatch_date_actual is None:
                    order.dealer_load = data.get('dealer_load') or 0
                    order.save()
                    data_updated = True
                else:
                    if request.user.has_perm('order-status.can_edit_display_totals_after_dispatch') or is_user_principal:
                        order.dealer_load = data.get('dealer_load') or 0
                        order.save()
                        data_updated = True

            if 'after_sales' in data:
                if order.dispatch_date_actual is None:
                    order.after_sales_wholesale = data.get('after_sales', {}).get('wholesale') or 0
                else:
                    if request.user.has_perm('order-status.can_edit_display_totals_after_dispatch') or is_user_principal:
                        order.after_sales_wholesale = data.get('after_sales', {}).get('wholesale') or 0
                
                order.after_sales_retail = data.get('after_sales', {}).get('retail') or 0
                order.after_sales_description = data.get('after_sales', {}).get('description') or ''
                order.save()
                data_updated = True

            if 'price_comment' in data :
                order.price_comment = data.get('price_comment')
                order.save()
                data_updated = True
       


        if data.get('update_customer_only'):

            if data.get('order_type') == 'Customer' or order.customer:
                order.customer = self.update_customer(request, data.get('customer'), order.dealer_sales_rep, order.dealership,
                                                      '{order.orderseries.series.model.name} {order.orderseries.series.code}'.format(
                                                          order=order) if hasattr(order, 'orderseries') else None)
                try:
                    order.show = Show.objects.get(id=data.get('show_id', None))
                except Show.DoesNotExist:
                    pass
                order.is_order_converted = data.get('is_order_converted')
                if data.get('order_converted'):
                    order.order_converted = parse_date(data.get('order_converted'))
                order.save()

            if data.get('order_type') == 'Stock':
                order.is_order_converted = False
                order.order_converted = None
                order.show = None
                order.customer = None
                order.save()

            data_updated = True

        if data_updated:
            return JsonResponse(order_data(order, request))

        raise ValidationError('Only comments and note will be saved as order has already been finalised')

    def save_order(self, data, request, order):
        if (order.order_submitted or order.order_submitted) and not request.user.has_perm('orders.modify_order_requested', order):
            return JsonResponse(order_data(order, request))

        series_id = data.get('series', None)
        create_order_series = False
        if series_id is not None:

            if hasattr(order, 'orderseries'):
                if order.orderseries.series_id != series_id and order.get_order_stage() in [Order.STAGE_ORDER, Order.STAGE_ORDER_FINALIZED]:
                    raise ValidationError('Model and Series cannot be changed once the order is placed.')

                series = Series.objects.get(id=series_id)
                # print('Before First',order.orderseries.series,'Prod Unit',order.orderseries.production_unit)
                order.orderseries.series = series
                print('After First',order.orderseries.series,order.orderseries.production_unit)

                if not order.get_finalization_status() == Order.STATUS_APPROVED: # once order's finalized, these numbers no longer change
                    order.orderseries.cost_price = series.cost_price
                    order.orderseries.wholesale_price = series.wholesale_price
                    order.orderseries.retail_price = series.retail_price
                    ###### modified for production unit 2 ###########
                    # order.orderseries.production_unit = series.production_unit
                    ###### modified for production unit 2 ###########
                    print('Finalization : ',order.orderseries.series,order.orderseries.production_unit)
                order.orderseries.save()
                
            else:
                series = Series.objects.get(id=series_id)
                create_order_series = True

        order.custom_series_name = data.get('custom_series_name') or ''
        order.custom_series_code = data.get('custom_series_code') or ''

        dealership_id = data.get('dealership', None)
        dealership_user = DealershipUser.objects.filter(id=request.user.id).first()

        if dealership_user is None:  # as in the case of non-dealership users
            dealership = Dealership.objects.filter(pk=dealership_id).first()
        else:
            if dealership_id:
                dealership = dealership_user.dealerships.filter(pk=dealership_id).first()
            else:
                dealership = dealership_user.dealerships.first()

        if dealership is None:
            raise ValidationError("Could not find dealership.")

        order.dealership = dealership

        if data.get('delivery_date'):
            try:
                production_unit = order.orderseries.production_unit
            except OrderSeries.DoesNotExist:
                production_unit = series.production_unit

            requested_delivery_month = datetime.strptime(data.get('delivery_date').split("T")[0], settings.FORMAT_DATE_ISO).date()
            
            if requested_delivery_month != order.delivery_date:
                if requested_delivery_month not in get_available_delivery_months(include_previous_months = False, production_unit = production_unit) and not request.user.has_perm('orders.manual_override'):
                    raise ValidationError('The selected delivery month is not currently available (might be full or closed)')

                order.delivery_date = requested_delivery_month
                try:
                    print('Build : ' , order.build)
                    print(' Build Order Id : ' , order.build.build_order_id)
                    if (order.build) and (order.build.build_order_id is None ):
                        order.build = None
                        order.build.save(force_create_build_order=True)
                
                except Build.DoesNotExist:
                    pass

        else:
            order.delivery_date = None

        try:
            order.dealer_sales_rep
        except ObjectDoesNotExist:
            if dealership_user:
                dealer_sales_rep = dealership_user
            else:
                dealer_sales_rep = order.dealership.dealershipuser_set.filter(dealershipuserdealership__is_principal=True).first()

            if dealer_sales_rep is None:
                raise ValidationError('No dealer sales representative selected.')

            order.dealer_sales_rep = dealer_sales_rep

        if create_order_series:
            order.save()
            ###### modified for production unit 2 ###########
            orderseries = OrderSeries.objects.create(order=order, series=series, cost_price=series.cost_price, wholesale_price=series.wholesale_price, retail_price=series.retail_price, production_unit=series.production_unit)
            order.orderseries = orderseries # normally we dont need this but order is cached.
            ###### modified for production unit 2 ###########

        if data.get('order_type') == 'Customer' or order.customer:
            order.is_order_converted = data.get('is_order_converted')
            if data.get('order_converted'):
                order.order_converted = parse_date(data.get('order_converted'))
            try:
                order.show = Show.objects.get(id=data.get('show_id', None))
            except Show.DoesNotExist:
                pass
            if request.user.has_perm('customers.list_customer'):
                customer = self.update_customer(request, data.get('customer'), order.dealer_sales_rep, order.dealership, '{order.orderseries.series.model.name} {order.orderseries.series.code}'.format(order=order) if hasattr(order, 'orderseries') else None)
                order.customer = customer

        if data.get('order_type') == 'Stock':
            order.is_order_converted = False
            order.order_converted = None
            order.show = None
            order.customer = None

        if data.get('price') is not None:
            order.price = data.get('price')


        if request.user.has_perm('orders.modify_order_other_prices', order):
            order.price_comment = data.get('price_comment') or ''
            order.dealer_load = data.get('dealer_load') or 0
            order.trade_in_write_back = data.get('trade_in_write_back') or 0

            if 'after_sales' in data:
                order.after_sales_wholesale = data.get('after_sales', {}).get('wholesale') or 0
                order.after_sales_retail = data.get('after_sales', {}).get('retail') or 0
                order.after_sales_description = data.get('after_sales', {}).get('description') or ''

            if 'price_adjustments' in data:
                order.price_adjustment_cost = data.get('price_adjustments', {}).get('cost') or 0
                order.price_adjustment_wholesale = data.get('price_adjustments', {}).get('wholesale') or 0
                order.price_adjustment_wholesale_comment = data.get('price_adjustments', {}).get('wholesale_comment') or ''

                if order.price_adjustment_wholesale and not order.price_adjustment_wholesale_comment:
                    raise ValidationError('You need to enter a comment for the wholesale price adjustment.')

                order.price_adjustment_retail = data.get('price_adjustments', {}).get('retail') or 0
    


        if data.get('weight_estimate_disclaimer', None) is not None:
            order.weight_estimate_disclaimer_checked = data.get('weight_estimate_disclaimer')

        order.custom_tare_weight_kg = data.get('custom_tare_weight')
        order.custom_ball_weight_kg = data.get('custom_ball_weight')

        order.caravan_details_saved_on = timezone.now()
        order.caravan_details_saved_by = request.user
        order.save()

        if order.customer:
            update_order_on_egm(order)  # Only sync customer orders with eGM

        if data.get('items', None) is not None:
            self.update_order_items(order, data['items'])

        if data.get('special_features') is not None:
            self.update_special_features(request, order, data['special_features'])

        if data.get('items', None) is None and data.get('special_features') is None and data.get('base_order') is not None:
            # Base order has been selected, but not saved from the feature pages,
            # i.e. there is no items or special features sent along with the save request,
            # but we still need to update according to what has been selected in the base order.
            base_order = Order.objects.get(id=data.get('base_order'))

            items = {
                item.sku_category_id: {
                    'id': item.sku_id,
                    'sku_category': item.sku_category_id,
                    'availability_type': item.base_availability_type,
                    'retail_price': item.retail_price,
                    'wholesale_price': item.wholesale_price,
                    'cost_price': item.cost_price,
                }
                for item in base_order.ordersku_set.all()
            }
            self.update_order_items(order, items)

            special_features = SpecialFeatureSerializer(base_order.specialfeature_set.all(), many=True).data
            self.update_special_features(request, order, special_features)

        if data.get('show_special') is not None:
            self.update_show_special(order, data['show_special'])

        self.update_note_details(data, order)
        return JsonResponse(order_data(order, request))

    def update_customer(self, request, customer_data, dealer_sales_rep, dealership, series_code):
        customer = None
        if customer_data.get('id'):
            customer = Customer.objects.filter(id=customer_data.get('id')).first()

        if not customer:
            customer = Customer()

        customer.first_name = customer_data.get('first_name')
        customer.last_name = customer_data.get('last_name')
        customer.email = customer_data.get('email')
        customer.phone1 = customer_data.get('phone1')
        customer.tow_vehicle = customer_data.get('tow_vehicle')
        customer.mailing_list = bool(customer_data.get('mailing_list'))  # When checkbox is unticked mailing_list is present in the data but has value of None

        try:
            customer.acquisition_source = AcquisitionSource.objects.get(id=customer_data.get('acquisition_source'))
        except AcquisitionSource.DoesNotExist:
            pass

        try:
            customer.source_of_awareness = SourceOfAwareness.objects.get(id=customer_data.get('source_of_awareness'))
        except SourceOfAwareness.DoesNotExist:
            pass

        if customer_data.get('partner_name', None) is not None:
            customer.partner_name = customer_data['partner_name']

        if customer_data.get('physical_address', {}):
            address = Address.create_or_find_matching(customer_data['physical_address'].get('name'),
                                                      customer_data['physical_address'].get('address'),
                                                      customer_data['physical_address'].get('suburb', {}).get('name'),
                                                      customer_data['physical_address'].get('suburb', {}).get('post_code', {}).get('number'),
                                                      customer_data['physical_address'].get('suburb', {}).get('post_code', {}).get('state', {}).get('code'))
            customer.physical_address = address

        if customer_data.get('delivery_address') and customer_data.get('delivery_address').get('name', None) is not None:
            address = customer_data['delivery_address']
            delivery_address = Address.create_or_find_matching(
                address.get('name'),
                address.get('address'),
                address.get('suburb', {}).get('name'),
                address.get('suburb', {}).get('post_code', {}).get('number'),
                address.get('suburb', {}).get('post_code', {}).get('state', {}).get('code'))
            customer.delivery_address = delivery_address
            customer.phone_delivery = customer_data.get('phone_delivery')

        if customer_data.get('postal_address') and customer_data.get('postal_address').get('name', None) is not None:
            address = customer_data['postal_address']
            invoice_address = Address.create_or_find_matching(
                address.get('name'),
                address.get('address'),
                address.get('suburb', {}).get('name'),
                address.get('suburb', {}).get('post_code', {}).get('number'),
                address.get('suburb', {}).get('post_code', {}).get('state', {}).get('code'))
            customer.postal_address = invoice_address
            customer.phone_invoice = customer_data.get('phone_invoice')

        customer.appointed_rep = dealer_sales_rep
        customer.appointed_dealer = dealership

        try:
            status = CustomerStatus.objects.get(name__iexact='quote')
        except ObjectDoesNotExist:
            status = CustomerStatus()
            status.name = 'Quote'
            status.id = 1
            status.save()

        customer.customer_status = status
        customer.lead_type = Customer.LEAD_TYPE_CUSTOMER
        customer.save()
        update_customer_on_egm(customer, series_code)
        return customer

    def update_order_items(self, order, skus):
        existing = []  # Track selected extras so we can remove ones that have been un-selected

        types_available = (SeriesSKU.AVAILABILITY_SELECTION,
                           SeriesSKU.AVAILABILITY_STANDARD,
                           SeriesSKU.AVAILABILITY_OPTION,
                           SeriesSKU.AVAILABILITY_UPGRADE,)

        order_skus = {osku.sku.sku_category_id: osku for osku in order.ordersku_set.filter(base_availability_type__in=types_available).select_related('sku')}

        for _department_id, sku_object in list(skus.items()):
            existing.append(sku_object['id'])

            order_sku = order_skus.get(sku_object['sku_category'])

            if not order_sku:
                order_sku = OrderSKU()
            order_sku.order_id = order.id
            order_sku.sku_id = sku_object['id']
            order_sku.base_availability_type = sku_object['availability_type']
            order_sku.retail_price = Decimal(sku_object['retail_price'])
            order_sku.wholesale_price = Decimal(sku_object['wholesale_price'])
            order_sku.cost_price = Decimal(sku_object['cost_price'])
            order_sku.save()

        # Remove any extras that are not in the current selection
        OrderSKU.all_objects \
            .filter(order=order)\
            .exclude(sku_id__in=existing) \
            .delete(force=True)

        order.update_missing_selections_status()
        order.save()

    def update_special_features(self, request, order, special_features):
        # Checking that we don't have 2 special features defined for the same department
        errors = []
        category_ids = [special_feature.get('sku_category') for special_feature in special_features]
        duplicates = set([cat_id for cat_id in category_ids if category_ids.count(cat_id) > 1])
        duplicates = [str(department) for department in SKUCategory.objects.filter(id__in=duplicates).exclude(parent=SKUCategory.top())]
        for name in duplicates:
            errors.append(ValidationError('The department {} have several special features defined, please merge them into one.'.format(name)))

        if errors:
            raise ValidationError(errors)

        ids = []  # Track ids, so we can delete stale features
        for special_feature_data in special_features:

            # Filter out all unwanted fields and transforming required fields to the appropriate format
            special_feature_fields = {
                'id': special_feature_data.get('id'),
                'order': order,
                'customer_description': special_feature_data.get('customer_description') or '',
                'retail_price': special_feature_data.get('retail_price'),
                'wholesale_price': special_feature_data.get('wholesale_price'),
                'sku_category_id': special_feature_data.get('sku_category'),
                'factory_description': special_feature_data.get('factory_description') or '',
                'approved': special_feature_data.get('approved'),
                'reject_reason': special_feature_data.get('reject_reason') or '',
            }

            if 'document' not in special_feature_data:
                special_feature_fields.update({'document': None})

            if 'new_document' in special_feature_data:
                special_feature_fields.update({'document': request.FILES.get(str(special_feature_data.get('file_id')))})

            special_feature_id = special_feature_data.get('id')

            if special_feature_id:
                # Using qs.filter().update(...) wouldn't trigger pre/post save signals and wouldn't create an Audit instance
                # https://code.djangoproject.com/ticket/12184
                try:
                    special_feature = SpecialFeature.objects.get(id=special_feature_id)

                    for field, value in list(special_feature_fields.items()):
                        setattr(special_feature, field, value)

                    special_feature.save()
                    ids.append(special_feature_id)
                except SpecialFeature.DoesNotExist:
                    pass
            else:
                feature = SpecialFeature(**special_feature_fields)
                if not feature.is_blank():
                    feature.save()
                    ids.append(feature.id)

        stale = order.specialfeature_set.exclude(id__in=ids)
        stale.delete()

        previous_status = order.get_special_features_status()
        order.update_special_features_status(request.user)
        new_status = order.get_special_features_status()

        if new_status == Order.STATUS_REJECTED and previous_status != new_status:
            reject_reasons = order.specialfeature_set.filter(approved=False).values_list('reject_reason', flat=True)
            send_email_from_template(
                order,
                order.customer_manager,
                EmailTemplate.EMAIL_TEMPLATE_ROLE_SPECIAL_FEATURES_REJECTED,
                request,
                'The special features have been correctly marked as rejected.',
                reject_reason=' ; '.join(reject_reasons),
            )

    def update_show_special(self, order, show_special):
        OrderShowSpecial.objects.filter(order=order).delete()

        if len(show_special.get('applied_rules', [])) == 0:
            return  # No rules were applied for this special, hence no discounts

        order_special = OrderShowSpecial.objects.create(order=order, special_id=show_special['id'])

        for rule_id in show_special['applied_rules']:
            rule = Rule.objects.get(id=rule_id)
            if rule.type == Rule.RULE_PRICE_ADJUSTMENT:
                line_item = OrderShowSpecialLineItem()
                line_item.order_show_special = order_special
                line_item.name = rule.title
                line_item.description = rule.text
                line_item.price_adjustment = rule.price_adjustment
                line_item.save()

    def update_order_conditions(self, order, orderconditions_data):
        try:
            orderconditions = order.orderconditions
        except ObjectDoesNotExist:
            orderconditions = OrderConditions(order=order)

        orderconditions.details = orderconditions_data.get('details', '')
        orderconditions.fulfilled = orderconditions_data.get('fulfilled', False)
        orderconditions.save()

    def update_after_market_note(self, order, aftermarketnote_data):
        try:
            aftermarketnote = order.aftermarketnote
        except ObjectDoesNotExist:
            aftermarketnote = AfterMarketNote(order=order)

        aftermarketnote.note = aftermarketnote_data.get('note', '')
        aftermarketnote.save()

    def is_note_updated(self, data):
        if data.get('orderconditions') or data.get('aftermarketnote') or data.get('trade_in_comment'):
           return True

        return False

    def update_note_details(self, data, order):

        if data.get('orderconditions') is not None:
            self.update_order_conditions(order, data['orderconditions'])

        if data.get('aftermarketnote') is not None:
            self.update_after_market_note(order, data['aftermarketnote'])

        if data.get('trade_in_comment'):
            order.trade_in_comment = data.get('trade_in_comment') or ''

        order.save()

class UpdateSalesforce(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while updating Salesforce.'

    def post(self, request):

        order_id = request.data.get('order_id')

        if not request.user.has_perm('orders.modify_order'):
            return HttpResponseForbidden()

        order = Order.objects.get(id=order_id)
        order.sync_salesforce(request.build_absolute_uri('/'))
        return JsonResponse({})
