import time

from django.conf import settings
import requests


class SalesforceAPIError(Exception):
    pass


class SalesforceAPIConnectionError(SalesforceAPIError):
    pass


class SalesforceAPIResponseError(SalesforceAPIError):
    def __init__(self, error_block):
        super(SalesforceAPIResponseError, self).__init__('Salesforce Response Error', error_block)
        self.error_block = error_block


class SalesforceApi:
    API_METHOD_POST = 'POST'
    API_METHOD_GET = 'GET'
    API_METHOD_PUT = 'PUT'

    ORDER_TYPE_CUSTOMER = 'CUSTOMER'
    ORDER_TYPE_STOCK = 'STOCK'

    TRIGGER_TYPE_HANDOVER = 'HANDOVER'
    TRIGGER_TYPE_DELIVERY = 'DELIVERY'

    API_SUCCESS_CODE = 'QRSag-200'
    API_SUCCESS_FIELD = 'StatusCode'

    # These are required by the API but may not exist in the order
    EMAIL_PLACEHOLDER = 'OrderWithoutEmail@newagecaravans.com.au'
    POSTCODE_PLACEHOLDER = '9999'

    def __init__(self):
        self.SALESFORCE_API_BASE_URL = getattr(settings, 'SALESFORCE_API_BASE_URL', '')
        self.SALESFORCE_API_AUTH = getattr(settings, 'SALESFORCE_API_AUTH', '')

    def call_api(self, method, endpoint, params=None):
        from orders.models import SalesforceError
        if settings.BODY_ENV_CLASS == 'env-ci' or settings.LOCAL_TEST_RUN:
            return {self.API_SUCCESS_FIELD: self.API_SUCCESS_CODE}

        auth_params = {
            'authKey': self.SALESFORCE_API_AUTH,
        }
        api_url = '{}{}'.format(self.SALESFORCE_API_BASE_URL, endpoint)

        request_begins = time.time()
        try:
            if method == self.API_METHOD_POST:
                response = requests.post(api_url, json=params, params=auth_params, timeout=settings.SALESFORCE_REQUEST_TIMEOUT)
            elif method == self.API_METHOD_PUT:
                response = requests.put(api_url, json=params, params=auth_params, timeout=settings.SALESFORCE_REQUEST_TIMEOUT)
            else:
                final_params = {}
                final_params.update(params)
                final_params.update(auth_params)
                response = requests.get(api_url, params=final_params, timeout=settings.SALESFORCE_REQUEST_TIMEOUT)
        except requests.exceptions.Timeout as e:
            request_ends = time.time()
            if 'OrderNumber' in params:
                SalesforceError.objects.create(order_id=params['OrderNumber'], payload=str(params), response_code='Request Timeout', response=str(e), response_delay=request_ends-request_begins)
            raise SalesforceAPIConnectionError(e)
        except requests.RequestException as e:
            request_ends = time.time()
            if 'OrderNumber' in params:
                SalesforceError.objects.create(order_id=params['OrderNumber'], payload=str(params), response_code='Connection Error', response=str(e), response_delay=request_ends-request_begins)
            raise SalesforceAPIConnectionError(e)


        request_ends = time.time()

        try:
            json_response = response.json()
        except ValueError:
            json_response = {
                'StatusCode': None,
                'Message': 'Invalid JSON response - {}'.format(response.text),
            }

        # Unless response contains this exact field and code, it's an error regardless of the status code (yes, 200 can still be an error)
        if self.API_SUCCESS_FIELD in json_response and json_response[self.API_SUCCESS_FIELD] == self.API_SUCCESS_CODE:
            return json_response

        # API error responses can have a http code of 200 or 405 with payload being one of the following: (this list might be incomplete)
        # Note that the fields and values may vary and are not case sensitive
        # {u'ErrorCode': u'QrsAG-403', u'ErrorTrace': u'Issue in reach the Target System'}
        # {u'Message': u'Data Point Not Available. Contact QRSag Support.', u'StatusCode': u'QRSaG-404'})
        # {u'Message': u'Required Fields are missing in Customer Data.', u'StatusCode': u'QRSag-502'})
        # {u'Message': u'Required Fields are missing in Caravan Data.', u'StatusCode': u'QRSag-503'}
        # {u'message': u'Invalid data for Caravan/Customer', u'StatusCode': u'QRSag-504'})
        if 'OrderNumber' in params:
            SalesforceError.objects.create(order_id=params['OrderNumber'], payload=str(params), response_code=str(response.status_code), response=str(json_response), response_delay=request_ends-request_begins)

        raise SalesforceAPIResponseError(json_response)

    def api_post(self, endpoint, params):
        return self.call_api(self.API_METHOD_POST, endpoint, params)

    def api_put(self, endpoint, params):
        return self.call_api(self.API_METHOD_PUT, endpoint, params)

    def api_get(self, endpoint, params=None):
        return self.call_api(self.API_METHOD_GET, endpoint, params)

    def predict_customer(self, order_no, order_type, trigger, dealership_name, chassis, vin_no, customer_data, caravan_data):
        """
        Sends the appropriate
        :param order_no: Order ID
        :param order_type: Order type - 'CUSTOMER' or 'STOCK'
        :param trigger: Trigger type - 'HANDOVER' or 'DELIVERY'
        :param dealership_name: Name of the dealership
        :param chassis: The chassis number
        :param vin_no: The VIN number
        :param customer_data: Dictionary of customer data, required if CUSTOMER order type
            Required fields: customer_id, last_name, email, postcode
            Optional fields: first_name, email_opt_in_flag, phone_number1, phone_number2, partner_name, registered_owner,
                street_address, city, state, postcode, tow_vehicle
        :param caravan_data: Dictionary of caravan data
            Fields: model, series, trade_in_comment, after_market_note, tyres, tare, atm, tow_ball, wob,
                gtm, chassis_gtm, gas_comp, payload, customer_delivery_date
        :return:
        """
        email = customer_data.get('email', '')
        if not email or email.find('@') == -1: # consists of invalid email & those w/ no email
            email = self.EMAIL_PLACEHOLDER

        data = {
            'OrderNumber': order_no,
            'OrderType': order_type,
            'Trigger': trigger,
            'DealershipName': dealership_name,
            'Chassis': chassis,
            'VinNumber': vin_no,
            'FirstName': customer_data.get('first_name', ''),
            'LastName': customer_data.get('last_name', ''),
            'CustomerId': customer_data.get('customer_id', ''),
            'Email': email,
            'EmailOptInFlag': customer_data.get('email_opt_in_flag', ''),
            'PhoneNumber1': customer_data.get('phone_number1', ''),
            'PhoneNumber2': customer_data.get('phone_number2', ''),
            'PartnerName': customer_data.get('partner_name', ''),
            'RegisterOwner': customer_data.get('registered_owner', ''),
            'StreetAddress': customer_data.get('street_address', ''),
            'City': customer_data.get('city', ''),
            'State': customer_data.get('state', ''),
            'Postcode': customer_data.get('postcode', self.POSTCODE_PLACEHOLDER),
            'TowVehicle': customer_data.get('tow_vehicle', ''),
            'Model': caravan_data.get('model', ''),
            'Series': caravan_data.get('series', ''),
            'TradeinComment': caravan_data.get('trade_in_comment', ''),
            'AfterMarketNote': caravan_data.get('after_market_note', ''),
            'Tyres': caravan_data.get('tyres', ''),
            'Tare': caravan_data.get('tare', ''),
            'ATM': caravan_data.get('atm', ''),
            'TowBall': caravan_data.get('tow_ball', ''),
            'WOB': caravan_data.get('wob', ''),
            'GTM': caravan_data.get('gtm', ''),
            'ChassisGTM': caravan_data.get('chassis_gtm', ''),
            'GASComp': caravan_data.get('gas_comp', ''),
            'Payload': caravan_data.get('payload', ''),
            'CustomerDeliveryDate': caravan_data.get('customer_delivery_date', ''),
        }

        # Scrub the data to ensure everything is correctly encoded
        for k in sorted(data):
            if type(data[k]) != str:
                try:
                    if str(data[k]) == 'None':   # sometimes None, sometimes "None", either case we want to send empty string
                        data[k] = ''
                    else:
                        data[k] = str(data[k])
                except UnicodeEncodeError:
                    import unicodedata
                    data[k] = unicodedata.normalize('NFKD', data[k]).encode('ascii', 'ignore')

        response = self.api_post('/predictCustomer', data)
        return response
