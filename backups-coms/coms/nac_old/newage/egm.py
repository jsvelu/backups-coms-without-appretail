# This contains helper functions to update e-GoodManners system with various information

from datetime import datetime
import logging
from socket import timeout

from django.conf import settings
from suds import WebFault
from suds.client import Client
import xmltodict

from customers.models import AcquisitionSource
from orders.models import Order

logger = logging.getLogger('egm')

KEY_STATUS = 'status'
KEY_STATUS_TEXT = 'statusText'
KEY_CUSTOMER_ID = 'CustomerID'
KEY_ERROR_INFO = 'errorinfo'
KEY_ERROR_CODE = 'errorcode'
KEY_ERROR_DESCRIPTION = 'errordescription'

EGM_STATUS_ALREADY_SOLD = 'S1'

STATUS_OK = '200'


# Structure of returned data:
#
# <?xml version="1.0" encoding="utf-8"?>
# <resultset>
#   <errorinfo />
#   <CustomerID>0</CustomerID>
#   <status>500</status>
#   <statusText>Error</statusText>
# </resultset>


def is_customer_dealership_implemented_in_egm(customer):

    # Check that customer is to be updated according to the cutover date for the dealership
    if not customer.appointed_dealer.egm_implementation_date:
        return False

    egm_implementation_datetime = datetime.combine(customer.appointed_dealer.egm_implementation_date, datetime.min.time()).replace(tzinfo=customer.creation_time.tzinfo)
    if customer.creation_time < egm_implementation_datetime or not customer.order_set.filter(created_on__gt=egm_implementation_datetime).exists():
        return False

    return True


def update_customer_on_egm(customer, series_code):
    """
    Updates or create the customer on e-GoodManners systems
    Returns: A tuple (is_successful, data, error_message)
    """

    # Check that customer is to be updated according to the cutover date for the dealership
    if not is_customer_dealership_implemented_in_egm(customer):
        return False, None, 'Dealership is not yet implemented in eGM'

    dealer_rep_email = customer.appointed_rep.email
    if hasattr(settings, 'EGM_TEST_DEALERREP_EMAIL'):
        dealer_rep_email = settings.EGM_TEST_DEALERREP_EMAIL

    dealer_code = customer.appointed_dealer_id
    if hasattr(settings, 'EGM_TEST_DEALER_CODE'):
        dealer_code = settings.EGM_TEST_DEALER_CODE

    params = {
        'UserName': settings.EGM_API_USERNAME,
        'Password': settings.EGM_API_PASSWORD,
        'DealerCode': dealer_code,
        'CustomerID': customer.egm_customer_id or 0,
        'Firstname': customer.first_name,
        'Surname': customer.last_name,
        'Address1': customer.physical_address.address,
        'Address2': customer.physical_address.address2,
        'Suburb': customer.physical_address.suburb.name,
        'State': customer.physical_address.suburb.post_code.state.name,
        'Phone': customer.phone1,
        'Email': customer.email,
        'SalesmanEmail': dealer_rep_email,
        'Notes': customer.source_of_awareness.name,
        'MethodOfContact': next(source[1] for source in AcquisitionSource.EGM_VALUE_CHOICES if source[0] == customer.acquisition_source.egm_value),
        'Extdburn': customer.id,
        'Manufacturer': settings.EGM_MANUFACTURE_NAME,
        'SelectedModel': series_code if series_code else 'All Models',
    }

    is_successful, result_set, error  = _update_egm('UpdateCustomer', params)
    if is_successful:
        customer.is_up_to_date_with_egm = True
        customer.egm_customer_id = result_set.get(KEY_CUSTOMER_ID)
    else:
        customer.is_up_to_date_with_egm = False

    customer.save()

    return is_successful, result_set, error


def is_order_dealership_implemented_in_egm(order):
    # Check that order is to be updated according to the cutover date for the dealership
    if not order.dealership.egm_implementation_date:
        return False

    egm_implementation_datetime = datetime.combine(order.dealership.egm_implementation_date, datetime.min.time()).replace(tzinfo=order.created_on.tzinfo)
    if order.created_on < egm_implementation_datetime:
        return False

    return True


def update_order_on_egm(order):
    """
    Updates the order state on e-GoodManners systems
    Returns: A tuple (is_successful, data, error_message)
    When this function is called by the management command (which generates a report based on return value),
      any error message starting with ! will be ignored.
    """

    # Check that order is to be updated according to the cutover date for the dealership
    if not is_order_dealership_implemented_in_egm(order):
        return False, None, 'Dealership is not yet implemented in eGM'

    if not order.customer:
        return False, None, '!Stock orders are not to be updated in eGM'

    if order.customer.egm_customer_id in [None, 0]:
        return False, None, '!Orders with invalid egm customer id are not to be updated in eGM'

    if not hasattr(order, 'orderseries'):
        return False, None, '!Orders without model selection are not to be updated in eGM'

    dealer_code = order.dealership_id
    if hasattr(settings, 'EGM_TEST_DEALER_CODE'):
        dealer_code = settings.EGM_TEST_DEALER_CODE

    series_code = '{order.orderseries.series.model.name} {order.orderseries.series.code}'.format(order=order) if order.orderseries.series else None

    params = {
        'username': settings.EGM_API_USERNAME,
        'password': settings.EGM_API_PASSWORD,
        'dealercode': dealer_code,
        'customerID': order.customer.egm_customer_id or 0,
        'actiontype': settings.EGM_DEFAULT_ACTION_TYPE,
        'sale': str(not order.is_quote()).lower(),
        'delivery': 'false', # There is no 'delivered' state yet
        'cancelled': str(order.get_order_stage() == Order.STAGE_CANCELLED).lower(),
        'quoted': str(order.is_quote()).lower(),
        'quotedetails': order.id,
        'model': series_code,
        'orderid': order.id,
    }

    is_successful, result_set, error = _update_egm('UpdateDiary', params)
    if is_successful:
        order.is_up_to_date_with_egm = True
    else:
        order.is_up_to_date_with_egm = False

    order.save(ignore_cancellation_check=True)

    return is_successful, result_set, error


def _update_egm(method, params):
    """
    Calls the given eGM method with the given params.
    Returns: A tuple (is_successful, data, error_message)
    """

    try:
        client = Client(settings.EGM_API_URL)
        result = getattr(client.service, method)(**params)

        result_set = xmltodict.parse(result)['resultset']

        if result_set.get(KEY_STATUS) == STATUS_OK or result_set.get(KEY_STATUS) == EGM_STATUS_ALREADY_SOLD:
            logger.info('Update successful for method {}. Params: {}'.format(method, params))
            return True, result_set, ''
        else:
            msg = 'Error when updating e-GoodManners system. Params: {}, eGM error: {}'.format(params, result_set.get(KEY_ERROR_INFO).get(KEY_ERROR_DESCRIPTION))
            logger.error(msg)
            return False, None, msg

    except (WebFault, timeout) as e:
        msg = 'Params: {}, Error: {}'.format(params, str(e))
        logger.error(msg)
        return False, None, msg
