import json
from os import path
import re
from django.conf import settings
from django.core import serializers
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.http import JsonResponse
from django.http.response import HttpResponseBadRequest
from django.http.response import HttpResponseForbidden
from django.utils import timezone
from django.http import HttpResponse
from authtools.models import User

from datetime import timedelta
from datetime import datetime
import allianceutils.rules
from allianceutils.views.views import JSONExceptionAPIView

import collections
from django.db.models.query_utils import Q
from django.db import models
from django.contrib.contenttypes.models import ContentType

from emails.models import EmailTemplate
from orders.models import ChassisNumber
from orders.models import Order
from orders.models import OrderSeries
from caravans.models import Series
from orders.models import OrderDocument
from orders.models import OrderNote
from audit.models import Audit
from audit.models import AuditField
from production.models import Build
from schedule.models import OrderTransport
from production.models import CoilType

import orders.rules
from orders.serializers import OrderHistorySerializer
from orders.views.api.utils import parse_date
from orders.views.api.utils import send_email_from_template

from salesforce.api import SalesforceApi
from salesforce.api import SalesforceAPIConnectionError
from salesforce.api import SalesforceAPIResponseError



class Status(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting the status information.'

    STATUS_COMPLETE = 'Complete'
    STATUS_PENDING = 'Requires Action'
    STATUS_OPTIONAL = 'Optional'
    STATUS_REJECTED = 'Rejected'

    def post(self, request):
        def simple_status(on, by, **kwargs):
            data_test = True
            if 'data' in kwargs and kwargs.get('data') is None:
                data_test = False

            if 'condition' in kwargs:
                data_test = kwargs.get('condition')

            return {
                'status': self.STATUS_COMPLETE if (on and data_test) else kwargs.get('status', self.STATUS_PENDING),
                'submitted_on': on,
                'submitted_by': str(by) if by else None,
                'data': kwargs.get('data'),
                'permission': kwargs.get('permission'),
            }

        def audit_status(last_change, **kwargs):
            return simple_status(last_change['saved_on'] if last_change else None,
                                 last_change['saved_by'] if last_change else None,
                                 **kwargs)


        def doc_status(label, doctype, permission, is_permission_order_based=True, extra_data=None):
            plans = order.orderdocument_set.filter(type=doctype)
            status['approval'][label] = {
                'status': self.STATUS_PENDING,
                'permission': request.user.has_perm(permission, order) if is_permission_order_based else request.user.has_perm(permission),
            }
            if plans.count():
                latest = Audit.get_creation_audit(plans.first())
                status['approval'][label]['status'] = self.STATUS_COMPLETE
                status['approval'][label]['submitted_on'] = latest.saved_on
                status['approval'][label]['submitted_by'] = str(latest.saved_by)
                status['approval'][label]['data'] = [
                    {
                        'id': plan.id,
                        'file': path.basename(plan.file.name) if plan.file else '',
                        'url': plan.file.url if plan.file else '',
                        'is_separated': plan.is_separated,
                    }
                    for plan in plans
                ]
                status['approval'][label]['extra_data'] = extra_data

        data = request.data
        order = Order.objects.get(id=data.get('order_id'))
        #modified
        # ordertrans = OrderTransport.objects.get(order_id=data.get('order_id'))   
       

        order_created = Audit.get_creation_audit(order)

        status = {
            'quote': {
                'customer_details_captured': simple_status(
                    order_created.saved_on if order_created else '',
                    order_created.saved_by if order_created else ''),
                'caravan_details_saved': simple_status(
                    order.caravan_details_saved_on,
                    order.caravan_details_saved_by,
                    condition=not order.has_missing_selections
                )
            },
            'history': {
                #TODO: review with Steve. History note creation is automated so this always returns true
                'permission': request.user.has_perm('orders.create_history_note', order),
            },
            'permissions': {
                'view_status_customer_details_captured': request.user.has_perm('order-status.view_status_customer_details_captured'),
                'view_status_caravan_details_saved': request.user.has_perm('order-status.view_status_caravan_details_saved'),
                'view_status_caravan_order_requested': request.user.has_perm('order-status.view_status_caravan_order_requested'),
                'view_status_caravan_ordered': request.user.has_perm('order-status.view_status_caravan_ordered'),
                'view_status_deposit_paid': request.user.has_perm('order-status.view_status_deposit_paid'),
                'view_status_special_features_reviewed': request.user.has_perm('order-status.view_status_special_features_reviewed'),
                'view_status_caravan_finalization_requested': request.user.has_perm('order-status.view_status_caravan_finalization_requested'),
                'view_status_caravan_finalized': request.user.has_perm('order-status.view_status_caravan_finalized'),
                'any_quote': allianceutils.rules.has_any_perms(
                    (
                        'order-status.view_status_customer_details_captured',
                        'order-status.view_status_caravan_details_saved',
                        'order-status.view_status_caravan_order_requested',
                        'order-status.view_status_caravan_ordered',
                        'order-status.view_status_deposit_paid',
                        'order-status.view_status_special_features_reviewed',
                        'order-status.view_status_caravan_finalization_requested',
                        'order-status.view_status_caravan_finalized',
                    )
                )(request.user),

                'view_status_chassis_number_appointed': request.user.has_perm('order-status.view_status_chassis_number_appointed'),
                'view_status_drafter_appointed': request.user.has_perm('order-status.view_status_drafter_appointed'),
                'view_status_customer_plans_specs_produced': request.user.has_perm('order-status.view_status_customer_plans_specs_produced'),
                'view_status_customer_plan_approval': request.user.has_perm('order-status.view_status_customer_plan_approval'),
                'view_status_factory_plans_produced': request.user.has_perm('order-status.view_status_factory_plans_produced'),
                'view_status_chassis_plans_produced': request.user.has_perm('order-status.view_status_chassis_plans_produced'),
                'any_order_awaiting_approval': allianceutils.rules.has_any_perms(
                    (
                        'order-status.view_status_chassis_number_appointed',
                        'order-status.view_status_drafter_appointed',
                        'order-status.view_status_customer_plans_specs_produced',
                        'order-status.view_status_customer_plan_approval',
                        'order-status.view_status_factory_plans_produced',
                        'order-status.view_status_chassis_plans_produced',
                    )
                )(request.user),

                'view_status_qc_date_planned': request.user.has_perm('order-status.view_status_qc_date_planned'),
                'view_status_qc_date_actual': request.user.has_perm('order-status.view_status_qc_date_actual'),
                'view_status_vin_number': request.user.has_perm('order-status.view_status_vin_number'),
                'view_status_weights': request.user.has_perm('order-status.view_status_weights'),
                'view_status_dispatch_date_planned': request.user.has_perm('order-status.view_status_dispatch_date_planned'),
                'view_status_dispatch_date_actual': request.user.has_perm('order-status.view_status_dispatch_date_actual'),
                'view_status_handover_to_driver_form': request.user.has_perm('order-status.view_status_handover_to_driver_form'),
                'view_status_received_date_dealership': request.user.has_perm('order-status.view_status_received_date_dealership'),
                'view_status_handover_to_dealership_form': request.user.has_perm('order-status.view_status_handover_to_dealership_form'),
                'view_status_delivery_date_customer': request.user.has_perm('order-status.view_status_delivery_date_customer'),
                'view_production_dashboard_audit_history': request.user.has_perm('order-status.view_production_dashboard_audit_history'),
                'can_delete_date_in_production_field': request.user.has_perm('order-status.can_delete_date_in_production_field'),

                'any_delivery': allianceutils.rules.has_any_perms(
                    (
                        'order-status.view_status_qc_date_planned',
                        'order-status.view_status_qc_date_actual',
                        'order-status.view_status_vin_number',
                        'order-status.view_status_weights',
                        'order-status.view_status_dispatch_date_planned',
                        'order-status.view_status_dispatch_date_actual',
                        'order-status.view_status_handover_to_driver_form',
                        'order-status.view_status_received_date_dealership',
                        'order-status.view_status_handover_to_dealership_form',
                        'order-status.view_status_delivery_date_customer',
                        'order-status.view_production_dashboard_audit_history',
                        'order-status.can_delete_date_in_production_field',
                    )
                )(request.user),

                'any_delivered': False, # Will be filled in later
            }
        }

        order_submitted = Audit.get_last_change(order, 'order_requested')
        order_request_condition = not order.order_rejected and order.order_requested

        status['quote']['caravan_order_requested'] = audit_status(
            order_submitted,
            condition=order_request_condition
        )

        if not order_request_condition:
            return JsonResponse(status)

        caravan_ordered = Audit.get_last_change(order, 'order_submitted')
        status['quote']['caravan_ordered'] = audit_status(caravan_ordered, condition=order.order_submitted)
        status['quote']['caravan_ordered']['schedule_date'] = order.build.build_order.production_month if hasattr(order, 'build') and order.build.build_order else None

        status['approval'] = {}
        status['approval']['deposit_paid'] = audit_status(
            Audit.get_last_change(order, 'deposit_paid_amount'),
            status=self.STATUS_OPTIONAL,
            data=order.deposit_paid_amount,
            permission=request.user.has_perm('orders.modify_order_deposit'))

        if not order.order_submitted:
            return JsonResponse(status)

        finalization_cancelled_status = {
            'cancelled_at': order.order_finalization_cancelled_at,
            'cancelled_by': str(order.order_finalization_cancelled_by) if order.order_finalization_cancelled_by else '',
            'cancel_reason': order.order_finalization_cancel_reason,
        }

        auto_finalization_status = {
            'auto_finalization': order.order_finalization_was_auto,
        }

        caravan_order_finalized_at = Audit.get_last_change(order, 'order_finalized_at')

        order_finalized_condition = order.get_finalization_status() == Order.STATUS_APPROVED

        status['quote']['caravan_order_finalized_at'] = audit_status(caravan_order_finalized_at, condition=order_finalized_condition, permission=request.user.has_perm('orders.cancel_finalization'))

        if status['quote']['caravan_order_finalized_at']['status'] == self.STATUS_PENDING:
            status['quote']['caravan_order_finalized_at'].update(finalization_cancelled_status)

        elif order.order_finalization_was_auto:
            status['quote']['caravan_order_finalized_at'].update(auto_finalization_status)

        special_features_status = order.get_special_features_status()

        if special_features_status == Order.STATUS_PENDING:
            status['approval']['special_features_reviewed'] = {
                'status': self.STATUS_PENDING,
                'submitted_on': order.special_features_changed_at,
                'submitted_by': str(order.special_features_changed_by),
                'permission': request.user.has_perm('orders.approve_special_features'),
            }
        elif special_features_status == Order.STATUS_APPROVED:
            status['approval']['special_features_reviewed'] = {
                'status': self.STATUS_COMPLETE,
                'submitted_on': order.special_features_approved_at,
                'submitted_by': str(order.special_features_approved_by),
                'permission': request.user.has_perm('orders.approve_special_features'),
            }
        elif special_features_status == Order.STATUS_REJECTED:
            status['approval']['special_features_reviewed'] = {
                'status': self.STATUS_REJECTED,
                'submitted_on': order.special_features_rejected_at,
                'submitted_by': str(order.special_features_rejected_by),
                'permission': request.user.has_perm('orders.approve_special_features'),
            }
        else:
            status['approval']['special_features_reviewed'] = None

        if order.get_finalization_status() != Order.STATUS_APPROVED:
            return JsonResponse(status)

        status['approval']['chassis_appointed'] = audit_status(
            Audit.get_last_change(order, 'chassis'),
            data=str(order.chassis) if order.chassis else '',
            condition=bool(order.chassis),
            permission=request.user.has_perm('orders.modify_chassis_number'))

        status['approval']['chassis_appointed']['override_permission'] = request.user.has_perm('orders.manual_override')

        if not order.chassis:
            return JsonResponse(status)

        try:
            build = order.build
        except Build.DoesNotExist:
            build = None

        drafter_users = orders.rules.get_drafter_users()

        status['approval']['drafter_appointed'] = audit_status(
            Audit.get_last_change(build, 'drafter') if build else None,
            condition=build.drafter if build else None,
            data=build.drafter_id if build else None,
            permission=request.user.has_perm('orders.modify_order_drafter'))
        status['approval']['drafter_appointed']['choices'] = [(u.id, u.get_full_name()) for u in drafter_users]

        if not build or not order.build.drafter:
            return JsonResponse(status)

        doc_status('customer_plans_produced', OrderDocument.DOCUMENT_CUSTOMER_PLAN, 'orders.update_order_customer_plan')

        doc_status('marked_as_approved', OrderDocument.DOCUMENT_CONTRACT, 'orders.review_customer_plan')

        customer_plan_status = order.get_customer_plan_status()
        if customer_plan_status == Order.STATUS_PENDING:
            status['approval']['customer_plan_reviewed'] = {
                'status': self.STATUS_PENDING,
                'submitted_on': order.customer_plan_changed_at,
                'submitted_by': str(order.customer_plan_changed_by),
                'permission': request.user.has_perm('orders.review_customer_plan', order),
            }
        elif customer_plan_status == Order.STATUS_APPROVED:
            status['approval']['customer_plan_reviewed'] = {
                'status': self.STATUS_COMPLETE,
                'submitted_on': order.customer_plan_approved_at,
                'submitted_by': str(order.customer_plan_approved_by),
                'permission': request.user.has_perm('orders.review_customer_plan', order),
            }
        elif customer_plan_status == Order.STATUS_REJECTED:
            status['approval']['customer_plan_reviewed'] = {
                'status': self.STATUS_REJECTED,
                'submitted_on': order.customer_plan_rejected_at,
                'submitted_by': str(order.customer_plan_rejected_by),
                'reject_reason': order.customer_plan_rejected_reason,
                'permission': request.user.has_perm('orders.review_customer_plan', order),
            }
        else:
            status['approval']['customer_plan_reviewed'] = None

        if status['approval']['customer_plan_reviewed']:
            status['approval']['customer_plan_reviewed'].update(
                {
                    'customer_plan_disclaimer_checked': order.customer_plan_disclaimer_checked,
                    'weight_estimate_disclaimer_checked': order.weight_estimate_disclaimer_checked,
                }
            )

        if customer_plan_status != Order.STATUS_APPROVED:
            return JsonResponse(status)

        doc_status('factory_plans_produced', OrderDocument.DOCUMENT_FACTORY_PLAN, 'orders.update_order_factory_plan')
        
        doc_status('chassis_plans_produced', OrderDocument.DOCUMENT_CHASSIS_PLAN, 'orders.update_order_chassis_plan')
        
        order_document_types = order.get_current_document_types()
        
        if not build.build_date or OrderDocument.DOCUMENT_CHASSIS_PLAN not in order_document_types or OrderDocument.DOCUMENT_FACTORY_PLAN not in order_document_types:
            return JsonResponse(status)

        # Do not progress to delivery section if there is no build date assigned

        

        status['delivery'] = {}

        status['delivery']['vin_number'] = audit_status(
            Audit.get_last_change(build, 'vin_number'),
            data=build.vin_number,
            permission=request.user.has_perm('orders.modify_order_vin_number'))

        if build.build_date > timezone.now().date() + timedelta(days=21):
            return JsonResponse(status)

        status['delivery']['qc_date_planned'] = audit_status(
            Audit.get_last_change(build, 'qc_date_planned'),
            data=build.qc_date_planned.strftime(settings.FORMAT_DATE) if build.qc_date_planned else build.qc_date_actual.strftime(settings.FORMAT_DATE) if build.qc_date_actual else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_planned'))


        status['delivery']['dispatch_date_planned'] = audit_status(
            Audit.get_last_change(order, 'dispatch_date_planned'),
            data=order.dispatch_date_planned.strftime(settings.FORMAT_DATE) if order.dispatch_date_planned else order.dispatch_date_actual.strftime(settings.FORMAT_DATE) if order.dispatch_date_actual else None,
            permission=request.user.has_perm('orders.modify_order_dispatch_date_planned'))
        
        status['delivery']['qc_date_actual'] = audit_status(
            Audit.get_last_change(build, 'qc_date_actual'),
            data=build.qc_date_actual.strftime(settings.FORMAT_DATE) if build.qc_date_actual else None,
            condition=build.qc_date_actual is not None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

          ################## ordertransport ######################
        
        

        try:
            ordertransport = OrderTransport.objects.get(order_id = order.id)

        except OrderTransport.DoesNotExist :
            obj = OrderTransport(order_id = order.id)
            obj.save()
            ordertransport = OrderTransport.objects.get(order_id = order.id)


        status['delivery']['actual_production_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'actual_production_comments'),
            data = ordertransport.actual_production_comments if ordertransport.actual_production_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))


        status['delivery']['actual_production_date'] = audit_status(
            Audit.get_last_change(ordertransport, 'actual_production_date'),
            data = ordertransport.actual_production_date.strftime(settings.FORMAT_DATE) if ordertransport.actual_production_date else None, 
            permission=request.user.has_perm('orders.modify_order_actual_production_date')) 
       

        status['delivery']['qc_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'qc_comments'),
            data = ordertransport.qc_comments if ordertransport.qc_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))
        
        status['delivery']['final_qc_date'] = audit_status(
            Audit.get_last_change(ordertransport, 'final_qc_date'),
            data = ordertransport.final_qc_date.strftime(settings.FORMAT_DATE) if ordertransport.final_qc_date else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['final_qc_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'final_qc_comments'),
            data = ordertransport.final_qc_comments if ordertransport.final_qc_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['chassis_section'] = audit_status(
            Audit.get_last_change(ordertransport, 'chassis_section'),
            data = ordertransport.chassis_section.strftime(settings.FORMAT_DATE) if ordertransport.chassis_section else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
        
        status['delivery']['collection_date'] = audit_status(
            Audit.get_last_change(ordertransport, 'collection_date'),
            data = ordertransport.collection_date.strftime(settings.FORMAT_DATE) if ordertransport.collection_date else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    

        status['delivery']['collection_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'collection_comments'),
            data = ordertransport.collection_comments if ordertransport.collection_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    


        status['delivery']['email_sent'] = audit_status(
            Audit.get_last_change(ordertransport, 'email_sent'),
            data = ordertransport.email_sent.strftime(settings.FORMAT_DATE) if ordertransport.email_sent else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
    
        status['delivery']['chassis_section_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'chassis_section_comments'),
            data = ordertransport.chassis_section_comments if ordertransport.chassis_section_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['building'] = audit_status(
            Audit.get_last_change(ordertransport, 'building'),
            data = ordertransport.building.strftime(settings.FORMAT_DATE) if ordertransport.building else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['building_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'building_comments'),
            data = ordertransport.building_comments if ordertransport.building_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['prewire_section'] = audit_status(
            Audit.get_last_change(ordertransport, 'prewire_section'),
            data = ordertransport.prewire_section.strftime(settings.FORMAT_DATE) if ordertransport.prewire_section else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['prewire_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'prewire_comments'),
            data = ordertransport.prewire_comments if ordertransport.prewire_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['aluminium'] = audit_status(
            Audit.get_last_change(ordertransport, 'aluminium'),
            data = ordertransport.aluminium.strftime(settings.FORMAT_DATE) if ordertransport.aluminium else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['aluminium_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'aluminium_comments'),
            data = ordertransport.aluminium_comments if ordertransport.aluminium_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['finishing'] = audit_status(
            Audit.get_last_change(ordertransport, 'finishing'),
            data = ordertransport.finishing.strftime(settings.FORMAT_DATE) if ordertransport.finishing else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['finishing_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'finishing_comments'),
            data = ordertransport.finishing_comments if ordertransport.finishing_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        ################
        status['delivery']['watertest_date'] = audit_status(
            Audit.get_last_change(ordertransport, 'watertest_date'),
            data = ordertransport.watertest_date.strftime(settings.FORMAT_DATE) if ordertransport.watertest_date else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['watertest_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'watertest_comments'),
            data = ordertransport.watertest_comments if ordertransport.watertest_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['weigh_bridge_date'] = audit_status(
            Audit.get_last_change(ordertransport, 'weigh_bridge_date'),
            data = ordertransport.weigh_bridge_date.strftime(settings.FORMAT_DATE) if ordertransport.weigh_bridge_date else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['weigh_bridge_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'weigh_bridge_comments'),
            data = ordertransport.weigh_bridge_comments if ordertransport.weigh_bridge_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))

        status['delivery']['detailing_date'] = audit_status(
            Audit.get_last_change(ordertransport, 'detailing_date'),
            data = ordertransport.detailing_date.strftime(settings.FORMAT_DATE) if ordertransport.detailing_date else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))    
    
        status['delivery']['detailing_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'detailing_comments'),
            data = ordertransport.detailing_comments if ordertransport.detailing_comments else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))
        ####################

        status['delivery']['dispatch_comments'] = audit_status(
            Audit.get_last_change(ordertransport, 'dispatch_comments'),
            data = ordertransport.dispatch_comments if  ordertransport.dispatch_comments  else None,
            permission=request.user.has_perm('orders.modify_order_qc_date_actual'))
        

        status['delivery']['dispatch_date_actual'] = audit_status(
            Audit.get_last_change(order, 'dispatch_date_actual'),
            data=order.dispatch_date_actual.strftime(settings.FORMAT_DATE) if order.dispatch_date_actual else None,
            permission=request.user.has_perm('orders.modify_order_dispatch_date_actual'))

        doc_status(
            'handover_to_driver_form',
            OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM,
            'orders.update_handover_to_driver_form',
            is_permission_order_based=False,
            extra_data={'salesforce_handover_recorded_at': order.salesforce_handover_recorded_at}
        )
        # if not ordertransport.watertest_date:
        #     return JsonResponse(status)


        status['delivery']['weights'] = audit_status(
            Audit.get_last_change(build, ('weight_tare', 'weight_atm', 'weight_tow_ball', 'weight_tyres', 'weight_chassis_gtm', 'weight_gas_comp', 'weight_payload')),
            data={
                'weight_tare': build.weight_tare,
                'weight_atm': build.weight_atm,
                'weight_tow_ball': build.weight_tow_ball,
                'weight_tyres': build.weight_tyres,
                'weight_chassis_gtm': build.weight_chassis_gtm,
                'weight_gas_comp': build.weight_gas_comp,
                'weight_payload': build.weight_payload,
            },
            condition=not any(weight is None for weight in (
                build.weight_tare,
                build.weight_atm,
                build.weight_tow_ball,
                build.weight_tyres,
                build.weight_chassis_gtm,
                build.weight_gas_comp,
            )),
            permission=request.user.has_perm('orders.modify_order_weights'))
        # TODO: Confirm that it should still block on missing driver handover form
        if not order.orderdocument_set.filter(type=OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM).exists() or not order.dispatch_date_actual:
            return JsonResponse(status)

        status['delivery']['received_date_dealership'] = audit_status(
            Audit.get_last_change(order, 'received_date_dealership'),
            data=order.received_date_dealership.strftime(settings.FORMAT_DATE) if order.received_date_dealership else None,
            permission=request.user.has_perm('orders.modify_order_received_date_dealership'))

        doc_status('handover_to_dealership_form', OrderDocument.DOCUMENT_HANDOVER_TO_DEALERSHIP_FORM, 'orders.update_handover_to_dealership_form', is_permission_order_based=False)
        # TODO: Confirm that it should still block on missing received_date_dealership
        if not order.orderdocument_set.filter(type=OrderDocument.DOCUMENT_HANDOVER_TO_DEALERSHIP_FORM).exists() or not order.received_date_dealership:
            return JsonResponse(status)

        if order.get_order_type() == 'Customer':
            status['delivery']['delivery_date_customer'] = audit_status(
                Audit.get_last_change(order, 'delivery_date_customer'),
                data={
                    'delivery_date_customer': order.delivery_date_customer.strftime(settings.FORMAT_DATE) if order.delivery_date_customer else None,
                    'salesforce_delivery_recorded_at': order.salesforce_delivery_recorded_at,
                },
                permission=request.user.has_perm('orders.modify_order_delivery_date_customer'))

        # TODO: Confirm that nothing blocks on missing weights or VIN

        return JsonResponse(status)



class StatusHistory(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting status history information.'

    def post(self, request):
        data = request.data
        order = Order.objects.get(id=data.get('order_id'))

        obj_list = [order]

        obj_list.extend(order.orderdocument_set.all())
        obj_list.extend(order.ordersku_set.all())
        obj_list.extend(order.ordernote_set.all())
        obj_list.extend(order.specialfeature_set.all())

         
        try:
            obj_list.append(order.aftermarketnote)  # aftermarketnote doesn't exist in order object yet
        except AttributeError:
            pass

        try:
            obj_list.append(order.orderconditions)  # orderconditions doesn't exist in order object yet
        except AttributeError:
            pass

        try:
            obj_list.append(order.build)
        except Build.DoesNotExist:
            pass

        try:
            obj_list.append(order.orderseries)
        except OrderSeries.DoesNotExist:
            pass

        if request.user.has_perm('order-status.view_production_dashboard_audit_history'):
            try:
                ordertransport = OrderTransport.objects.get(order_id = order.id)
                obj_list.append(ordertransport)    
            except OrderTransport.DoesNotExist:
                pass
        
        history = Audit.get_all_changes(obj_list)
        
        history_data = OrderHistorySerializer(history, many=True).data

        history_data = list([x for x in history_data if len(x['action'])])
        
        history_data.reverse()

        return JsonResponse({
            'history': history_data
        })
         

class StatusHistoryNote(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while getting status history notes.'

    def post(self, request):
        data = request.data
        if data.get('file'):
            data = json.loads(data['data'])
        order = Order.objects.get(id=data.get('order_id'))
        if not request.user.has_perm('orders.create_history_note', order):
            return HttpResponseForbidden()
        note = OrderNote()
        note.order = order
        note.note = data.get('note')
        note.file = request.FILES.get('file')
        note.save()
        return JsonResponse({})





class StatusUpdate(JSONExceptionAPIView):
    permission_required = "orders.view_order"

    default_error_message = 'An error occurred while updating the status.'

    def post(self, request):
        response = None
        data = request.data

        if data.get('file'):
            data = json.loads(data['data'])

        order = Order.objects.get(id=data.get('order_id'))
        try:
            build = order.build
        except Build.DoesNotExist:
            build = None

        if data.get('deposit') and request.user.has_perm('orders.modify_order_deposit'):
            order.deposit_paid_amount = data.get('deposit')

        chassis_number = data.get('chassis_number')
        if chassis_number:
            if chassis_number is True and request.user.has_perm('orders.modify_chassis_number'):
                order.allocate_chassis_number(request.user)

            elif request.user.has_perm('orders.manual_override'):
                # NOTE: Currently we are assuming everything is prefixed with "NA". if NAC ever changes this, there are a few places
                # that needs to be adjusted - here being one, model chassisnumber being another, and the
                # Order.objects.all().extra({'chassisnum':'CAST(SUBSTR(chassis,3) as UNSIGNED)'})
                # query a few lines below this comment need to be adjusted too so that SUBSTR is axing the correct amount of prefix off.
                if chassis_number[:2].lower() == 'na':
                    chassis_number = chassis_number[2:]

                try:
                    chassis_number = int(chassis_number)
                except ValueError:
                    return HttpResponseBadRequest('The chassis number must be a integer value')

                # NOTE: SEE PREVIOUS COMMENT - IMPORTANT
                if chassis_number >= Order.objects.all().extra({'chassisnum':'CAST(SUBSTR(chassis,3) as UNSIGNED)'}).latest('chassisnum').chassisnum:
                    return HttpResponseBadRequest('You cannot assign a chassis number higher than the current maximum value.')

                try:
                    order.set_chassis_number(chassis_number, request.user)
                except IntegrityError:
                    return HttpResponseBadRequest('This chassis number is already assigned to another order')

        if data.get('drafter') and request.user.has_perm('orders.modify_order_drafter'):
            if build is None:
                build = Build(
                    order=order,
                    coil_type=CoilType.objects.first()
                )
            build.drafter_id = data.get('drafter')
            build.save()

        def doc_upload(type):
            order_document = OrderDocument()
            order_document.order = order
            order_document.type = type
            order_document.file = request.FILES['file']
            order_document.save()

        def doc_add_separate(type):
            order_document = OrderDocument()
            order_document.order = order
            order_document.type = type
            order_document.is_separated = True
            order_document.save()

        def doc_delete(id):
            OrderDocument.objects.get(id=id).delete()

        if data.get('upload_for', '') == 'customer_plan' and request.user.has_perm('orders.update_order_customer_plan', order):
            doc_upload(OrderDocument.DOCUMENT_CUSTOMER_PLAN)
            order.customer_plan_changed_at = timezone.now()
            order.customer_plan_changed_by = request.user

            # Client requests auto-approval of customer plan at this step.
            order.customer_plan_disclaimer_checked = True
            order.weight_estimate_disclaimer_checked = True
            order.customer_plan_approved_at = timezone.now()
            order.customer_plan_approved_by = request.user

        elif data.get('upload_for', '') == 'factory_plan' and request.user.has_perm('orders.update_order_factory_plan', order):
            doc_upload(OrderDocument.DOCUMENT_FACTORY_PLAN)
        elif data.get('upload_for', '') == 'chassis_plan' and request.user.has_perm('orders.update_order_chassis_plan', order):
            doc_upload(OrderDocument.DOCUMENT_CHASSIS_PLAN)
        elif data.get('upload_for', '') == 'contract' and request.user.has_perm('orders.review_customer_plan', order):
            doc_upload(OrderDocument.DOCUMENT_CONTRACT)

        if data.get('add_separate_doc') == 'factory' and request.user.has_perm('orders.update_order_factory_plan', order):
            doc_add_separate(OrderDocument.DOCUMENT_FACTORY_PLAN)
        elif data.get('add_separate_doc') == 'chassis' and request.user.has_perm('orders.update_order_chassis_plan', order):
            doc_add_separate(OrderDocument.DOCUMENT_CHASSIS_PLAN)
        elif data.get('add_separate_doc') == 'handover_to_driver_form' and request.user.has_perm('orders.update_handover_to_driver_form'):
            doc_add_separate(OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM)
        elif data.get('add_separate_doc') == 'handover_to_dealership_form' and request.user.has_perm('orders.update_handover_to_dealership_form'):
            doc_add_separate(OrderDocument.DOCUMENT_HANDOVER_TO_DEALERSHIP_FORM)

        if data.get('delete_customer_plan') and request.user.has_perm('orders.update_order_customer_plan', order):
            doc_delete(data.get('delete_customer_plan'))
            order.customer_plan_changed_at = timezone.now()
            order.customer_plan_changed_by = request.user
        elif data.get('delete_factory_plan') and request.user.has_perm('orders.update_order_factory_plan', order):
            doc_delete(data.get('delete_factory_plan'))
        elif data.get('delete_chassis_plan') and request.user.has_perm('orders.update_order_chassis_plan', order):
            doc_delete(data.get('delete_chassis_plan'))
        elif data.get('delete_contract') and request.user.has_perm('orders.review_customer_plan', order):
            doc_delete(data.get('delete_contract'))
        elif data.get('delete_handover_to_driver_form') and request.user.has_perm('orders.update_handover_to_driver_form', order):
            doc_delete(data.get('delete_handover_to_driver_form'))
        elif data.get('delete_handover_to_dealership_form') and request.user.has_perm('orders.update_handover_to_dealership_form', order):
            doc_delete(data.get('delete_handover_to_dealership_form'))

        if data.get('review_customer_plan') and request.user.has_perm('orders.review_customer_plan', order):
            if data.get('review_customer_plan') == 'approve':

                if not data.get('customer_plan_disclaimer_checked') or not data.get('weight_estimate_disclaimer_checked'):
                    raise ValidationError('Please tick the boxes prior to approving the plans.')

                order.customer_plan_disclaimer_checked = True
                order.weight_estimate_disclaimer_checked = True
                order.customer_plan_approved_at = timezone.now()
                order.customer_plan_approved_by = request.user

            if data.get('review_customer_plan') == 'reject':
                order.customer_plan_disclaimer_checked = False
                order.weight_estimate_disclaimer_checked = False
                order.customer_plan_rejected_at = timezone.now()
                order.customer_plan_rejected_by = request.user
                order.customer_plan_rejected_reason = data.get('reject_reason')
                order.orderdocument_set.filter(type=OrderDocument.DOCUMENT_CUSTOMER_PLAN).delete()

                error_response = send_email_from_template(
                    order,
                    order.build.drafter,
                    EmailTemplate.EMAIL_TEMPLATE_ROLE_CUSTOMER_PLANS_REJECTED,
                    request,
                    'The customer plans have been correctly marked as rejected.',
                    reject_reason=order.customer_plan_rejected_reason,
                )

                if error_response:
                    response = error_response

        # Delivery
        if data.get('qc_date_planned') and request.user.has_perm('orders.modify_order_qc_date_planned'):
            build.qc_date_planned = parse_date(data.get('qc_date_planned'))
            # order.dispatch_date_planned = build.qc_date_planned + timedelta(days=2)
            # if order.dispatch_date_planned.weekday() > 4:  # Saturday, Sunday
            #     order.dispatch_date_planned = order.dispatch_date_planned + timedelta(days=7 - order.dispatch_date_planned.weekday())

        

        if data.get('vin_number') and request.user.has_perm('orders.modify_order_vin_number'):
            if re.match(r'^.{11}\d{6}$', data.get('vin_number')) is None:
                raise ValidationError('VIN Number must be in the form AAAAAAAAAAANNNNNN')
            build.vin_number = data.get('vin_number')

        if data.get('weights') and request.user.has_perm('orders.modify_order_weights'):
            weights = data.get('weights').get('data')

            def validated_weight(value):
                if value is None:
                    return None
                try:
                    value = int(value)
                    if value < 0:
                        raise ValidationError('Weight value must be positive')
                    return value
                except TypeError:
                    raise ValidationError('Weight value must be integer')

            build.weight_tare = validated_weight(weights.get('weight_tare'))
            build.weight_atm = validated_weight(weights.get('weight_atm'))
            build.weight_tow_ball = validated_weight(weights.get('weight_tow_ball'))
            build.weight_tyres = weights.get('weight_tyres')
            build.weight_chassis_gtm = validated_weight(weights.get('weight_chassis_gtm'))
            build.weight_payload = validated_weight(weights.get('weight_payload'))

            if weights.get('weight_gas_comp') and not re.match(r'^\d{8}$', str(weights.get('weight_gas_comp'))):
                raise ValidationError('Gas Comp must be 8 digits')
            build.weight_gas_comp = weights.get('weight_gas_comp')

        if data.get('dispatch_date_planned') and request.user.has_perm('orders.modify_order_dispatch_date_planned'):
            order.dispatch_date_planned = parse_date(data.get('dispatch_date_planned'))


    ######################## Order Transport Audit Update ##########################
        

        def enter_to_audit(obj, field_name, new_value):

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')

            aud = Audit(object_id = obj.pk, type = 2, content_type = ContentType.objects.get_for_model(obj), saved_on = datetime.now(), content_repr = obj, user_ip = ip, saved_by = request.user)
            aud.save()

            name_in_auditfield = AuditField.objects.filter(name = field_name, audit__object_id = obj.pk, audit__content_type = ContentType.objects.get_for_model(obj)).order_by('-audit__saved_on').first()

            if name_in_auditfield is not None:

                old_value = name_in_auditfield.changed_to
                
                audit = AuditField(audit_id = aud.id, name = field_name ,changed_from = old_value, changed_to = new_value)
                audit.save()

            else:

                audit = AuditField(audit_id = aud.id, name = field_name, changed_to = new_value)
                audit.save()

            return None

    #################################################################

    
    ################## order transport ################
        try:
            ordertrans = OrderTransport.objects.get(order_id = order.id)

        except OrderTransport.DoesNotExist :
            obj = OrderTransport(order_id = order.id)
            obj.save()
            ordertrans = OrderTransport.objects.get(order_id = order.id)

        if data.get('actual_production_date'):

            actual_production_date1 = parse_date(data.get('actual_production_date'))

            record_lap = OrderTransport.objects.filter(order_id=order.id).exists()

            if record_lap is True:
                obj = OrderTransport.objects.filter(order_id=order.id).update(actual_production_date=actual_production_date1)
                    
            else:            
                obj = OrderTransport(order_id = order.id, actual_production_date=actual_production_date1)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'actual_production_date', actual_production_date1)

        if data.get('actual_production_comments'):
            
            prod_comments = data.get('actual_production_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
        
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(actual_production_comments = str(prod_comments))
                
            else:
                obj  = OrderTransport(order_id= order.id,actual_production_comments = str(prod_comments))
                obj.save()

            new_value = str(prod_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'actual_production_comments', new_value)

        if data.get('chassis_section'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.actual_production_date:
                return HttpResponseBadRequest('Awaiting Production')

            chassis_section = parse_date(data.get('chassis_section'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(chassis_section =  chassis_section)
            else:
                obj  = OrderTransport(order_id= order.id,chassis_section =  chassis_section)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'chassis_section', chassis_section)

        if data.get('collection_date'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.final_qc_date:
                return HttpResponseBadRequest('Awaiting Final QC')

            collection_date = parse_date(data.get('collection_date'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(collection_date =  collection_date)
            else:
                obj  = OrderTransport(order_id= order.id,collection_date=  collection_date)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'collection_date', collection_date)

        if data.get('collection_comments'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')


            collection_comments = data.get('collection_comments')

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(collection_comments =  collection_comments)
            else:
                obj  = OrderTransport(order_id= order.id,collection_comments =  collection_comments)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'collection_comments', collection_comments)


        if data.get('email_sent'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Email Sent')

            if not ordertrans.actual_production_date:
                return HttpResponseBadRequest('Awaiting Collection Date')

            email_sent = parse_date(data.get('email_sent'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(email_sent=  email_sent)
            else:
                obj  = OrderTransport(order_id= order.id,email_sent =  email_sent)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'email_sent', email_sent)

        if data.get('chassis_section_comments'):
            chassis_section_comments = data.get('chassis_section_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(chassis_section_comments = str(chassis_section_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,chassis_section_comments = str(chassis_section_comments))
                obj.save()

            new_value = str(chassis_section_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'chassis_section_comments', new_value)

        if data.get('building'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.chassis_section:
                return HttpResponseBadRequest('Awaiting Chassis')

            building = parse_date(data.get('building'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(building =  building)
            else:
                obj  = OrderTransport(order_id= order.id,building =  building)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'building', building)

        if data.get('building_comments'):
            building_comments = data.get('building_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(building_comments = str(building_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,building_comments = str(building_comments))
                obj.save()

            new_value = str(building_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'building_comments', new_value)

        if data.get('prewire_section'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.building:
                return HttpResponseBadRequest('Awaiting Building')

            prewire_section = parse_date(data.get('prewire_section'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(prewire_section =  prewire_section)
            else:
                obj  = OrderTransport(order_id= order.id,prewire_section =  prewire_section)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'prewire_section', prewire_section)

        if data.get('prewire_comments'):
            prewire_comments = data.get('prewire_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(prewire_comments = str(prewire_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,prewire_comments = str(prewire_comments))
                obj.save()

            new_value = str(prewire_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'prewire_comments', new_value)     
        
        if data.get('aluminium'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.prewire_section:
                return HttpResponseBadRequest('Awaiting Prewire Section')

            aluminium = parse_date(data.get('aluminium'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(aluminium =  aluminium)
            else:
                obj  = OrderTransport(order_id= order.id,aluminium =  aluminium)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'aluminium', aluminium)

        if data.get('aluminium_comments'):
            aluminium_comments = data.get('aluminium_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(aluminium_comments = str(aluminium_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,aluminium_comments = str(aluminium_comments))
                obj.save()

            new_value = str(aluminium_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'aluminium_comments', new_value)

        if data.get('finishing'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.aluminium:
                return HttpResponseBadRequest('Awaiting Aluminium')

            finishing = parse_date(data.get('finishing'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(finishing =  finishing)
            else:
                obj  = OrderTransport(order_id= order.id,finishing =  finishing)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'finishing', finishing)

        if data.get('finishing_comments'):
            finishing_comments = data.get('finishing_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(finishing_comments = str(finishing_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,finishing_comments = str(finishing_comments))
                obj.save()

            new_value = str(finishing_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'finishing_comments', new_value)

        if data.get('watertest_date'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.finishing:
                return HttpResponseBadRequest('Awaiting Finishing')

            watertest_date = parse_date(data.get('watertest_date'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(watertest_date =  watertest_date)
            else:
                obj  = OrderTransport(order_id= order.id,watertest_date =  watertest_date)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'watertest_date', watertest_date)

        if data.get('watertest_comments'):
            watertest_comments = data.get('watertest_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(watertest_comments = str(watertest_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,watertest_comments = str(watertest_comments))
                obj.save()

            new_value = str(watertest_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'watertest_comments', new_value)

        if data.get('weigh_bridge_date'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.watertest_date:
                return HttpResponseBadRequest('Awaiting Watertest')

            weigh_bridge_date = parse_date(data.get('weigh_bridge_date'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(weigh_bridge_date =  weigh_bridge_date)
            else:
                obj  = OrderTransport(order_id= order.id,weigh_bridge_date =  weigh_bridge_date)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'weigh_bridge_date', weigh_bridge_date)

        if data.get('weigh_bridge_comments'):
            weigh_bridge_comments = data.get('weigh_bridge_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(weigh_bridge_comments = str(weigh_bridge_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,weigh_bridge_comments = str(weigh_bridge_comments))
                obj.save()

            new_value = str(weigh_bridge_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'weigh_bridge_comments', new_value)

        if data.get('detailing_date'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.weigh_bridge_date:
                return HttpResponseBadRequest('Awaiting Weigh bridge')

            detailing_date = parse_date(data.get('detailing_date'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(detailing_date =  detailing_date)
            else:
                obj  = OrderTransport(order_id= order.id,detailing_date =  detailing_date)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'detailing_date', detailing_date)

        if data.get('detailing_comments'):
            detailing_comments = data.get('detailing_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(detailing_comments = str(detailing_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,detailing_comments = str(detailing_comments))
                obj.save()

            new_value = str(detailing_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'detailing_comments', new_value)

        if data.get('qc_date_actual') and request.user.has_perm('orders.modify_order_qc_date_actual'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not ordertrans.detailing_date:
                return HttpResponseBadRequest('Awaiting Detailing')

            build.qc_date_actual = parse_date(data.get('qc_date_actual'))

        if data.get('qc_comments'):
            qc_comments =data.get('qc_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(qc_comments = str(qc_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,qc_comments = str(qc_comments))
                obj.save()

            new_value = str(qc_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'qc_comments', new_value)

        if data.get('final_qc_date'):
            if order.dispatch_date_actual:
                return HttpResponseBadRequest('Dispatched')

            if not build.qc_date_actual:
                return HttpResponseBadRequest('Awaiting QC')

            final_qc_date = parse_date(data.get('final_qc_date'))

            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(final_qc_date =  final_qc_date)
            else:
                obj  = OrderTransport(order_id= order.id,final_qc_date =  final_qc_date)
                obj.save()

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'final_qc_date', final_qc_date)

        if data.get('final_qc_comments'):
            final_qc_comments = data.get('final_qc_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(final_qc_comments = str(final_qc_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,final_qc_comments = str(final_qc_comments))
                obj.save()

            new_value = str(final_qc_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'final_qc_comments', new_value)
            
        if data.get('dispatch_date_actual') and request.user.has_perm('orders.modify_order_dispatch_date_actual'):
            if ordertrans.hold_caravans:
                return HttpResponseBadRequest('Order is On Hold Status')

            if not ordertrans.final_qc_date:
                return HttpResponseBadRequest('Awaiting Final QC')

            record_lap = OrderTransport.objects.get(order_id= order.id).exists()
            if not record_lap.hold_caravans:
                order.dispatch_date_actual = parse_date(data.get('dispatch_date_actual'))
                # to update avg. in series
                order_item = Order.objects.get(id=order.id)
                if order_item.is_order_converted == 0 and not order_item.customer:
                    build_item = Build.objects.get(order_id=order_item.id)
                    order_ball_weight = build_item.weight_tow_ball
                    order_tare_weight = build_item.weight_tare

                    get_series = OrderSeries.objects.get(order_id=order_item.id)
                    series_id = get_series.series_id

                    series_item = Series.objects.get(id=series_id)
                    series_ball_weight = series_item.avg_ball_weight
                    series_tare_weight = series_item.avg_tare_weight

                    if series_ball_weight:
                        if order_ball_weight:
                            avg = (float(series_ball_weight) + float(order_ball_weight))/2
                            item = Series.objects.filter(id=series_id).update(avg_ball_weight=round(avg))
                    else:   
                        if order_ball_weight:
                            item = Series.objects.filter(id=series_id).update(avg_ball_weight=round(order_ball_weight))

                    if series_tare_weight:
                        if order_tare_weight:
                            avg = (float(series_tare_weight) + order_tare_weight)/2
                            item = Series.objects.filter(id=series_id).update(avg_tare_weight=round(avg))
                    else:
                        if order_tare_weight:
                            item = Series.objects.filter(id=series_id).update(avg_tare_weight=round(order_tare_weight))
            else:
                return HttpResponseBadRequest('This Order is On Hold Status')
            dispatch_date_actual = parse_date(data.get('dispatch_date_actual'))
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(dispatch_date_actual =  dispatch_date_actual)
            else:
                obj  = OrderTransport(order_id= order.id,final_qc_date =  final_qc_date)
                obj.save()

                ordertransport = OrderTransport.objects.get(order_id = order.id)
                enter_to_audit(ordertransport, 'dispatch_date_actual', dispatch_date_actual)

        if data.get('dispatch_comments'):
            dispatch_comments = data.get('dispatch_comments')
            record_lap = OrderTransport.objects.filter(order_id= order.id).exists()
        
            if record_lap is True:
                obj  = OrderTransport.objects.filter(order_id=order.id).update(dispatch_comments = str(dispatch_comments))
            
            else:
                obj  = OrderTransport(order_id= order.id,dispatch_comments = str(dispatch_comments))
                obj.save()

            new_value = str(dispatch_comments)
            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'dispatch_comments', new_value)

        ################################

        if data.get('upload_for', '') == 'handover_to_driver_form' and request.user.has_perm('orders.update_handover_to_driver_form'):
            doc_upload(OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM)

        if data.get('received_date_dealership') and request.user.has_perm('orders.modify_order_received_date_dealership'):
            order.received_date_dealership = parse_date(data.get('received_date_dealership'))

        if data.get('upload_for', '') == 'handover_to_dealership_form' and request.user.has_perm('orders.update_handover_to_dealership_form'):
            doc_upload(OrderDocument.DOCUMENT_HANDOVER_TO_DEALERSHIP_FORM)

        if data.get('delivery_date_customer') and request.user.has_perm('orders.modify_order_delivery_date_customer'):
            order.delivery_date_customer = parse_date(data.get('delivery_date_customer'))


        if build:
            build.save()
        order.save()

        order.sync_salesforce(request.build_absolute_uri('/'))

        return response if response else JsonResponse({})



####### Delete Date of Production ###############
class DeleteDateField(JSONExceptionAPIView):
   
    permission_required = "order-status.can_delete_date_in_production_field"

    default_error_message = 'Unable to Delete.'

    def post(self, request):

        response = None

        data = request.data

        order = Order.objects.get(id=data.get('order_id'))

        if data.get('del_qc_date_actual'):
            Build.objects.filter(order_id = order.id).update(qc_date_actual = None)
           
         ######################## Order Transport Audit Update ##########################

        def enter_to_audit(obj, field_name, new_value):

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')

            aud = Audit(object_id = obj.pk, type = 2, content_type = ContentType.objects.get_for_model(obj), saved_on = datetime.now(), content_repr = obj, user_ip = ip, saved_by = request.user)
            aud.save()

            name_in_auditfield = AuditField.objects.filter(name = field_name, audit__object_id = obj.pk, audit__content_type = ContentType.objects.get_for_model(obj)).order_by('-audit__saved_on').first()

            if name_in_auditfield is not None:

                old_value = name_in_auditfield.changed_to
                
                audit = AuditField(audit_id = aud.id, name = field_name ,changed_from = old_value, changed_to = new_value)
                audit.save()

            else:

                audit = AuditField(audit_id = aud.id, name = field_name, changed_to = new_value)
                audit.save()

            return None

        ##########################################################

    
        ################ order transport ################
       

        if data.get('del_dispatch_date_actual'):
            dispatch_date_actual = None

            Order.objects.filter(id = order.id).update(dispatch_date_actual = dispatch_date_actual)
            enter_to_audit(order, 'dispatch_date_actual', dispatch_date_actual)

        if data.get('del_actual_production_date'):

            actual_production_date1 = None

            OrderTransport.objects.filter(order_id=order.id).update(actual_production_date=actual_production_date1)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'actual_production_date', actual_production_date1)

        if data.get('del_final_qc_date'):

            final_qc_date = None
            OrderTransport.objects.filter(order_id=order.id).update(final_qc_date=final_qc_date)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'final_qc_date', final_qc_date)

        if data.get('del_chassis_section'):

            chassis_section = None 

            OrderTransport.objects.filter(order_id= order.id).update(chassis_section=chassis_section)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'chassis_section', chassis_section)

        if data.get('del_collection_date'):

            collection_date = None 

            OrderTransport.objects.filter(order_id= order.id).update(collection_date=collection_date)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'collection_date', collection_date)
    


        if data.get('del_building'):

            building = None

            OrderTransport.objects.filter(order_id= order.id).update(building=building)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'building', building)
        
        if data.get('del_prewire_section'):

            prewire_section = None

            OrderTransport.objects.filter(order_id= order.id).update(prewire_section=prewire_section)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'prewire_section', prewire_section)
        
        if data.get('del_aluminium'):

            aluminium = None

            OrderTransport.objects.filter(order_id= order.id).update(aluminium=aluminium)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'aluminium', aluminium)

        if data.get('del_finishing'):

            finishing = None

            OrderTransport.objects.filter(order_id= order.id).update(finishing=finishing)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'finishing', finishing)

        ##################
        if data.get('del_watertest_date'):

            watertest_date = None

            OrderTransport.objects.filter(order_id= order.id).update(watertest_date=watertest_date)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'watertest_date', watertest_date)

        if data.get('del_weigh_bridge_date'):

            weigh_bridge_date = None

            OrderTransport.objects.filter(order_id= order.id).update(weigh_bridge_date=weigh_bridge_date)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'weigh_bridge_date', weigh_bridge_date)

        if data.get('del_detailing_date'):

            detailing_date = None

            OrderTransport.objects.filter(order_id= order.id).update(detailing_date=detailing_date)

            ordertransport = OrderTransport.objects.get(order_id = order.id)
            enter_to_audit(ordertransport, 'detailing_date', detailing_date)
        ###############

        return response if response else JsonResponse({})