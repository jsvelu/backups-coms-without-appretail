import json

from allianceutils.views.views import JSONExceptionAPIView
from django.core import serializers
from django.http import JsonResponse
from django.http import HttpResponse
from django.http.response import HttpResponseBadRequest
from django.http.response import HttpResponseForbidden
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from caravans.models import SKU
from dealerships.models import DealershipUser
from emails.models import EmailTemplate
from newage.egm import update_order_on_egm
from orders.models import FinalizationError
from orders.models import Order
from orders.models import OrderRulePlan
from schedule.models import OrderTransport
from orders.views.api.utils import dropdown_item
from orders.views.api.utils import has_month_empty_production_slots
from orders.views.api.utils import order_data
from orders.views.api.utils import send_email_from_template
from orders.views.api.utils import send_email_on_order_finalization
from production.models import Build,BuildOrder
from production.models import CoilType
from schedule.views.api import ScheduleDashboardAPIView
from schedule.views import api2


class RetrieveOrder(JSONExceptionAPIView):
    permission_required = "orders.view_order"

    default_error_message = 'An error occurred while retrieving the order.'

    def post(self, request):
        try:
            order = Order.objects.get(id=request.data.get('order_id'))
        except Order.DoesNotExist:
            return HttpResponseBadRequest('Order does not exist')
            
        return JsonResponse(order_data(order, request))


class RequestOrder(JSONExceptionAPIView):
    """
    Called by the sales rep to request an order be approved
    """
    permission_required = "orders.request_order_approval"

    default_error_message = 'An error occurred while requesting approval for the order.'

    def post(self, request):
        order_id = request.data.get('order').get('id')
        order = Order.objects.get(id=order_id)
        if order.get_order_stage() >= Order.STAGE_ORDER_REQUESTED:
            return HttpResponseBadRequest('This order has already been placed.')
        if not order.delivery_date:
            return HttpResponseBadRequest('The order needs to have a valid delivery month selected.')
        if not request.user.has_perm('orders.manual_override') and not has_month_empty_production_slots(order.delivery_date, order.orderseries.production_unit):
            return HttpResponseBadRequest('The selected delivery month is at full capacity. Please select a different delivery month.')
        order.order_rejected = None
        order.order_requested = timezone.now()
        order.save()

        return JsonResponse(order_data(order, request))


class RejectOrder(JSONExceptionAPIView):
    """
    Called by the dealer principal to reject a request for an order be approved
    """
    permission_required = "orders.request_order_approval"

    default_error_message = 'An error occurred while rejecting approval for the order.'

    def post(self, request):
        order_id = request.data.get('order').get('id')
        order = Order.objects.get(id=order_id)
        if order.order_rejected:
            return HttpResponseBadRequest('This order has already been rejected.')
        if order.order_submitted:
            return HttpResponseBadRequest('This order has already been placed.')
        order.order_rejected = timezone.now()
        order.save()

        return JsonResponse(order_data(order, request))


class PlaceOrder(JSONExceptionAPIView):
    """
    Called by the dealer principal to approve a requested order
    """
    permission_classes = (IsAuthenticated, )

    default_error_message = 'An error occurred while approving the order.'

    def post(self, request):
        order_id = request.data.get('order').get('id')
        order = Order.objects.get(id=order_id)
        
        print('Order Place Entered ', order.id)

        if not request.user.has_perm('orders.approve_order', order):
            return HttpResponseForbidden()
        if not order.order_requested:
            return HttpResponseBadRequest('This order has not yet been submitted')
        if order.order_submitted:
            return HttpResponseBadRequest('This order has already been placed')
        if not order.delivery_date:
            return HttpResponseBadRequest('The order needs to have a valid delivery month selected.')
        if not request.user.has_perm('orders.manual_override') and not has_month_empty_production_slots(order.delivery_date, order.orderseries.production_unit):
            return HttpResponseBadRequest('The selected delivery month is at full capacity. Please select a different delivery month.')
        if order.has_missing_selections:
            return HttpResponseBadRequest('This order cannot be placed while it has incomplete feature selections')
        if order.has_unmet_subject_to():
            return HttpResponseBadRequest('The order cannot be placed while it has Subject To conditions still not met.')

        order.order_submitted = timezone.now()
        # print(order.id )

        production_month = order.delivery_date.replace(day=1)
        production_unit=order.orderseries.production_unit
        my_list = list(BuildOrder.objects.filter(production_unit=production_unit).order_by('id').values_list('id', flat=True))

        print('Last id for Build: ' ,my_list[-1])

        last_order_id=my_list[-1]
        # Got the last id from build_order table and incremented by 1  
        current_order_id=int(last_order_id ) + 1
        # print('Next Order Number ', current_order_id)        

        # build_orders = BuildOrder()
        # build_orders.production_unit=production_unit
        # build_orders.production_month=production_month
        # build_orders.id= current_order_id
        # build_ordersget_or_create_next
        

        if not hasattr(order, 'build'):
            build_orders = BuildOrder.objects.filter(production_unit=production_unit,production_month=production_month).order_by('-order_number')

            print ( ' Has No Attr build : Next : ' , build_orders.last () )
            # last_order_no=BuildOrder.get_previous(build_orders)
            last_order_no=int(build_orders[0].order_number) + 1
            # print ('last Order Number in BUILD ORder   my method ' , last_order_no)

            # build=Build.get_or_create_from_order(order)
            
            test_build_order = BuildOrder(production_unit=production_unit,production_month=production_month,order_number=last_order_no,id=current_order_id)   
            test_build_order.save()
            
            # print (test_build_order)
            build=Build(order = order)
            build.build_order = test_build_order
            build.coil_type = CoilType.objects.first()
            # print (build) 
            build.save()
            print ('Saved build :', build) 
            # order.save()
            
        else :
            # this is to trigger a (re)create of build_order as pre-existing one might have been removed on finalize cancellation.
            # print(' Existing Build Save ! ')
            print(order.build.build_order_id)

             # Check if the order has no build order id
            # Then get that instance and allocate a build_order_id 
            if order.build.build_order_id is None:
                # check whether build_order for the production month has order_numbers as null 
                # Also whether the id obtained is not in build table as well
                # Then get such an id and assign to this order
                # order.build=None
        
                # Old  Code
                # Copied from Models 
                # if build_orders.last():
                #  self.build_order, _created = BuildOrder.objects.get_or_create(production_month=production_month, production_unit=production_unit, order_number=1)
             

                order.build=None

                build_orders = BuildOrder.objects.filter(production_unit=production_unit,production_month=production_month).order_by('-order_number')

                # print ( 'Next ' , build_orders.last () )
                # last_order_no=BuildOrder.get_previous(build_orders)
                last_order_no=int(build_orders[0].order_number) + 1
                # print ('last Order Number in BUILD ORder   my method ' , last_order_no)

                # build=Build.get_or_create_from_order(order)
                
                test_build_order = BuildOrder(production_unit=production_unit,production_month=production_month,order_number=last_order_no,id=current_order_id)   
                test_build_order.save()
                
                # print (test_build_order)
                build=Build(order = order)
                build.build_order = test_build_order
                build.coil_type = CoilType.objects.first()
                # print (build) 
                build.save()
                # print (build) 
                # order.build.save()
            # order.save()
        
            '''
            # Old Working Code         
            # if not hasattr(order, 'build'):
                
            #     build = Build(
            #         order=order,
            #         coil_type=CoilType.objects.first()
            #     )
            #     build.save()    
            #     print ('inside build',build) 
            # else:
            #     # this is to trigger a (re)create of build_order as pre-existing one might have been removed on finalize cancellation.
            #     order.build.save()
            
            # order.save()
             '''
        
        try:
            ordertrans = OrderTransport.objects.get(order_id = order.id)
        except OrderTransport.DoesNotExist :
            obj = OrderTransport(order_id = order.id)
            obj.save()

        # print('Order Success in Build ',order)
        order.save()
        if order.customer:
            update_order_on_egm(order)
        '''
        # Commented out for the time being - client no longer want order to be finalized - but they may change their mind again later.
        """
        if order.get_special_features_status() == Order.STATUS_NONE:
            # Auto finalize if no special features added
            try:
                order.finalize_order(request.user, True)
            except FinalizationError as e:
                return HttpResponseBadRequest(str(e))
        """
        '''
        error_response = send_email_from_template(
            order,
            order.customer_manager,
            EmailTemplate.EMAIL_TEMPLATE_ROLE_ORDER_SUBMITTED,
            request,
            'The order has been correctly submitted.',
        )
        
        data = order_data(order, request)
        
        if error_response:
            data['last_server_error_message'] = error_response.data['message']
            # print(error_response.data['message'])

        return JsonResponse(data)


class CancelOrder(JSONExceptionAPIView):
    """
    Called by the dealer principal to approve a requested order
    """
    permission_classes = (IsAuthenticated, )

    def post(self, request):
        order_id = request.data.get('order').get('id')
        order = Order.objects.get(id=order_id)
        if not request.user.has_perm('orders.cancel_order'):
            return HttpResponseForbidden()
        if order.order_cancelled:
            return HttpResponseBadRequest('This order has already been cancelled')
        if not order.order_submitted:
            return HttpResponseBadRequest('This order has not yet been placed')

        order.cancel_order(request.data.get('cancel_reason'))

        if order.customer:
            update_order_on_egm(order)

        return JsonResponse(order_data(order, request))


class FinalizeOrder(JSONExceptionAPIView):
    """
    Called by the dealer principal to finalise a requested order
    """
    permission_classes = (IsAuthenticated, )

    def post(self, request):
        order_id = request.data.get('order').get('id')

        order = Order.objects.get(id=order_id)

        # this is to trigger a (re)create of build_order as pre-existing one might have been removed on finalize cancellation.
        if hasattr(order,'build'):
            order.build.save()
            # print('Build Date ' , order.build.build_date)

        try:
            ordertrans = OrderTransport.objects.get(order_id = order.id)
        except OrderTransport.DoesNotExist :
            obj = OrderTransport(order_id = order.id)
            obj.save()

        if not request.user.has_perm('orders.finalize_order', order) and not request.user.has_perm('orders.lock_order', order):
            return HttpResponseForbidden()

        try:
            order.finalize_order(request.user, False)
        except FinalizationError as e:
            return HttpResponseBadRequest(str(e))

        send_email_on_order_finalization(order, request)

        return JsonResponse(order_data(order, request))


class MassFinalizeOrders(JSONExceptionAPIView):
    """
    Called by dealer principal or anyone with permission order.finalize_order to finalize a number of selected orders
    """
    permission_classes = (IsAuthenticated, )

    def post(self, request):
        # this action is not wrapped in a single transaction as that emails will need to be send for them.
        for order_id in request.data.get('order_list'):
            try:
                order = Order.objects.get(id=order_id)

            except Order.DoesNotExist:
                continue

            if not request.user.has_perm('orders.finalize_order', order):
                continue

            try:
                order.finalize_order(request.user, False)
            except FinalizationError as e:
                # ignore orders cannot be finalized yet or already finalized
                continue

            send_email_on_order_finalization(order, request)

        production_unit = order.orderseries.production_unit

        if production_unit == 2:
            return api2.ScheduleDashboardAPIView.get(api2.ScheduleDashboardAPIView(), request, request.data.get('view_month'))
        else:
            return ScheduleDashboardAPIView.get(ScheduleDashboardAPIView(), request, request.data.get('view_month'))

class CancelFinalize(JSONExceptionAPIView):
    """
    Called to cancel the finalisation of a finalised order
    """
    permission_classes = (IsAuthenticated, )

    def post(self, request):
        order = Order.objects.get(id=request.data.get('order_id'))
        reason = request.data.get('reason')

        if not request.user.has_perm('orders.cancel_finalization'):
            return HttpResponseForbidden()
        if not order.order_finalized_at:
            return HttpResponseBadRequest('This order has not yet been finalised')
        if not reason:
            return HttpResponseBadRequest('A reason needs to be provided for cancelling the finalisation')

        order.cancel_finalization(request.user, reason)

        return JsonResponse(order_data(order, request))


class RulePlanUpload(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while uploading plan.'

    def post(self, request):
        data = json.loads(request.data['data'])
        rule_plan = OrderRulePlan()
        rule_plan.order = Order.objects.get(id=data.get('order_id'))
        rule_plan.sku = SKU.objects.get(id=data.get('sku_id'))
        rule_plan.file = request.FILES['file']
        rule_plan.notes = data.get('notes')
        rule_plan.save()
        return JsonResponse({
            'rule_plan_id': rule_plan.id,
        })


class RulePlanRemove(JSONExceptionAPIView):
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while removing plan.'

    def post(self, request):
        rule_plan = OrderRulePlan.objects.filter(id=request.data['rule_plan_id']).first()
        if rule_plan is None:
            return HttpResponseBadRequest()

        if request.user.has_perm('order.delete_order_rule_plan', rule_plan):
            rule_plan.delete()
            return JsonResponse({})
        else:
            return HttpResponseForbidden()


class CustomerManager(JSONExceptionAPIView):
    """
    Called to update the Customer Manager for the order
    """
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while setting the customer manager .'

    def post(self, request):
        if (request.data.get('order_id') is None):
            return Response(
                {
                    'customer_manager_list': None
                }
                )

        order_id = request.data.get('order_id')
        order = Order.objects.get(id=order_id)

        customer_manager_id = request.data.get('customer_manager_id')

        if customer_manager_id is None:
            # Return list of potential customer managers
            return Response(
                {
                    'customer_manager_list': [dropdown_item(user) for user in order.dealership.dealershipuser_set.all()]
                }
            )

        # else
        # Update given order with provided customer manager, return new customer manager name

        try:
            customer_manager = DealershipUser.objects.get(id=customer_manager_id)
        except DealershipUser.DoesNotExist:
            return HttpResponseBadRequest()

        order.customer_manager = customer_manager
        order.save()

        return Response(
            {
                'name': order.customer_manager.name
            }
        )


class SalesRep(JSONExceptionAPIView):
    """
    Called to update the Sales Rep for the order
    """
    permission_classes = (IsAuthenticated, )

    default_error_message = 'An error occurred while setting the sales rep.'

    def post(self, request):
        order_id = request.data.get('order_id')
        order = Order.objects.get(id=order_id)

        if not request.user.has_perm('orders.modify_order_sales_rep', order):
            return HttpResponseForbidden()

        sales_rep_id = request.data.get('sales_rep_id')

        if sales_rep_id is None:
            # Return list of potential sales reps
            return JsonResponse(
                {
                    'sales_rep_list': [dropdown_item(user) for user in order.dealership.dealershipuser_set.all()]
                }
            )

        # else
        # Update given order with provided sales_rep, return new sales rep name

        try:
            sales_rep = DealershipUser.objects.get(id=sales_rep_id)
        except DealershipUser.DoesNotExist:
            return HttpResponseBadRequest()

        order.dealer_sales_rep = sales_rep
        order.save()

        return JsonResponse(
            {
                'name': order.dealer_sales_rep.name
            }
        )


class OrderReassign(JSONExceptionAPIView):
    """
    POST processes the reassignment.
    """
    permission_required = "orders.view_or_create_or_modify_order"

    default_error_message = 'An error occurred while reassigning orders.'

    def post(self, request, show_id, dealership_id, manager_id=None):

        orders = Order.objects.filter(show_id=show_id, dealership_id=dealership_id)

        if not manager_id:
            # Return the number of records to be updated
            return JsonResponse({'count': orders.count()})
        # else:

        try:
            manager = DealershipUser.objects.get(id=manager_id)
        except DealershipUser.DoesNotExist:
            return HttpResponseBadRequest("This manager doesn't exist.")

        # Using qs.filter().update(...) doesn't trigger pre/post save signals and won't create an Audit instance
        # https://code.djangoproject.com/ticket/12184
        for order in orders:
            order.customer_manager = manager
            order.save()

        return JsonResponse(
            {
                'message': '{} has been assigned to {} orders.'.format(manager.name, orders.count())
            }
        )
