import logging

from django.conf import settings
from django.utils import timezone
from spyne.application import Application
from spyne.decorator import srpc
from spyne.model.complex import Array
from spyne.model.complex import ComplexModel
from spyne.model.primitive.number import Integer
from spyne.model.primitive.string import Unicode
from spyne.protocol.soap.soap11 import Soap11
from spyne.service import ServiceBase

from caravans.models import Series
from customers.models import AcquisitionSource
from customers.models import Customer
from customers.models import CustomerStatus
from customers.models import SourceOfAwareness
from dealerships.models import Dealership
from dealerships.models import DealershipUser
from newage.models import Address

TARGET_NAMESPACE = 'newage'

logger = logging.getLogger('egm')


class CustomerInfo(ComplexModel):
    CustomerId = Integer
    Extdburn = Integer
    Firstname = Unicode
    Surname = Unicode
    Email = Unicode
    Phone = Unicode
    Address1 = Unicode
    Address2 = Unicode
    Suburb = Unicode
    Postcode = Integer
    State = Unicode
    SalesmanEmail = Unicode
    Dealercode = Integer
    SourceOfEnquiry = Unicode
    MethodOfContact = Unicode


class ResultData(ComplexModel):
    Datetime = Unicode.customize(nullable=False, min_occurs=1)
    Status = Integer.customize(nullable=False, min_occurs=1)
    StatusText = Unicode
    CustomerID = Integer
    Extdburn = Integer.customize(nullable=False, min_occurs=1)
    CustomerData = CustomerInfo


class ModelData(ComplexModel):
    ModelId = Integer
    ModelName = Unicode
    SeriesId = Integer
    SeriesCode = Unicode
    SeriesName = Unicode


class ModelResultData(ComplexModel):
    Datetime = Unicode.customize(nullable=False, min_occurs=1)
    Status = Integer.customize(nullable=False, min_occurs=1)
    StatusText = Unicode
    ModelList = Array(ModelData)


def _generate_result(status, status_text, CustomerData):
    logger.debug("CustomerUpdate from eGM: {}, {} ({})".format(status, status_text, CustomerData))

    return ResultData(
        Datetime=str(timezone.now()),
        Status=status,
        StatusText=status_text,
        CustomerID=CustomerData.CustomerId,
        Extdburn=CustomerData.Extdburn or 0,
    )


def _generate_result_with_customer_data(status, CustomerData):
    result = _generate_result(status, '', CustomerData)
    result.CustomerData = CustomerData
    return result


class CustomerUpdateService(ServiceBase):
    @srpc(Unicode.customize(nullable=False, min_occurs=1), CustomerInfo.customize(nullable=False, min_occurs=1), _returns=ResultData)
    def UpdateCustomer(Token, CustomerData):

        if Token != settings.EGM_IDENTIFICATION_TOKEN:
            return _generate_result(405, 'Invalid token', CustomerData)

        try:
            if CustomerData.Extdburn:
                return CustomerUpdateService._update_customer(CustomerData)
            else:
                return CustomerUpdateService._create_customer(CustomerData)
        except Exception as e:
            logger.error(str(e))
            raise

    @staticmethod
    def _create_customer(CustomerData):
        def check_fields(*args):
            for field in args:
                if not hasattr(CustomerData, field) or not getattr(CustomerData, field):
                    return _generate_result(400, '{} field is required for user creation.'.format(field), CustomerData)

        customer = Customer()
        check_fields('CustomerId', 'Firstname', 'Surname')
        customer.egm_customer_id = CustomerData.CustomerId
        customer.first_name = CustomerData.Firstname
        customer.last_name = CustomerData.Surname

        if not CustomerData.Email and not CustomerData.Phone:
            return _generate_result(400, 'Email or Phone field is required for user creation.', CustomerData)
        if CustomerData.Email:
            customer.email = CustomerData.Email
        if CustomerData.Phone:
            customer.phone1 = CustomerData.Phone

        customer.physical_address = Address.create_or_find_matching(
            customer.get_full_name(),
            CustomerData.Address1,
            CustomerData.Suburb,
            CustomerData.Postcode,
            CustomerData.State,
            CustomerData.Address2
        )

        if CustomerData.SalesmanEmail:
            try:
                dealer_sales_rep = DealershipUser.objects.get(email=CustomerData.SalesmanEmail)
            except DealershipUser.DoesNotExist:
                return _generate_result(400, 'Unknown user with email {}'.format(CustomerData.SalesmanEmail), CustomerData)
            customer.appointed_rep = dealer_sales_rep

        check_fields('Dealercode')
        try:
            dealership = Dealership.objects.get(id=CustomerData.Dealercode)
        except Dealership.DoesNotExist:
            return _generate_result(400, 'Unknown dealership with code {}'.format(CustomerData.Dealercode), CustomerData)
        customer.appointed_dealer = dealership

        try:
            acquisition_source = next(source[0] for source in AcquisitionSource.EGM_VALUE_CHOICES if source[1] == CustomerData.MethodOfContact)
            customer.acquisition_source = AcquisitionSource.objects.filter(egm_value=acquisition_source).first()
        except StopIteration:
            pass

        try:
            source_of_awareness = SourceOfAwareness.objects.get(name=CustomerData.SourceOfEnquiry)
            customer.source_of_awareness = source_of_awareness
        except SourceOfAwareness.DoesNotExist:
            # Tries to match by string, ignore if doesn't work
            pass

        customer.is_up_to_date_with_egm = True
        customer.customer_status = CustomerStatus.objects.get(name__iexact='quote')
        customer.lead_type = Customer.LEAD_TYPE_EGM
        customer.save(do_not_clean=True)
        CustomerData.Extdburn = customer.id

        return _generate_result(200, 'Customer created', CustomerData)

    @staticmethod
    def _update_customer(CustomerData):

        try:
            customer = Customer.objects.get(id=CustomerData.Extdburn)
        except Customer.DoesNotExist:
            return _generate_result(400, 'Customer does not exist', CustomerData)

        if CustomerData.CustomerId:
            customer.egm_customer_id = CustomerData.CustomerId

        if CustomerData.Firstname:
            customer.first_name = CustomerData.Firstname

        if CustomerData.Surname:
            customer.last_name = CustomerData.Surname

        if CustomerData.Email:
            customer.email = CustomerData.Email

        if CustomerData.Phone:
            customer.phone1 = CustomerData.Phone

        if CustomerData.Address1:
            customer.physical_address.address = CustomerData.Address1

        if CustomerData.Address2:
            customer.physical_address.address2 = CustomerData.Address2

        if CustomerData.Address1 or CustomerData.Address2 or CustomerData.Suburb or CustomerData.Postcode or CustomerData.State:

            address1 = CustomerData.Address1 or customer.physical_address.address
            address2 = CustomerData.Address2 or customer.physical_address.address2
            suburb = CustomerData.Suburb or customer.physical_address.suburb.name
            postcode = CustomerData.Postcode or customer.physical_address.suburb.post_code.number
            state = CustomerData.State or (customer.physical_address.suburb.post_code.state.code if customer.physical_address.suburb.post_code.state_id else None)

            customer.physical_address = Address.create_or_find_matching(
                customer.get_full_name(),
                address1,
                suburb,
                postcode,
                state,
                address2
            )

        if CustomerData.SalesmanEmail:
            try:
                dealer_sales_rep = DealershipUser.objects.get(email=CustomerData.SalesmanEmail)
            except DealershipUser.DoesNotExist:
                return _generate_result(400, 'Unknown user with email {}'.format(CustomerData.SalesmanEmail), CustomerData)
            customer.appointed_rep = dealer_sales_rep

        if CustomerData.Dealercode:
            try:
                dealership = Dealership.objects.get(id=CustomerData.Dealercode)
            except DealershipUser.DoesNotExist:
                return _generate_result(400, 'Unknown dealership with code {}'.format(CustomerData.Dealercode), CustomerData)
            customer.appointed_dealer = dealership

        try:
            acquisition_source = next(source[0] for source in AcquisitionSource.EGM_VALUE_CHOICES if source[1] == CustomerData.MethodOfContact)
            customer.acquisition_source = AcquisitionSource.objects.filter(egm_value=acquisition_source).first()
        except StopIteration:
            pass

        try:
            source_of_awareness = SourceOfAwareness.objects.get(name=CustomerData.SourceOfEnquiry)
            customer.source_of_awareness = source_of_awareness
        except SourceOfAwareness.DoesNotExist:
            # Tries to match by string, ignore if doesn't work
            pass

        customer.is_up_to_date_with_egm = True
        customer.customer_status = CustomerStatus.objects.get(name__iexact='quote')
        customer.save(do_not_clean=True)

        return _generate_result(200, 'Customer updated', CustomerData)


class ModelService(ServiceBase):
    @srpc(Unicode.customize(nullable=False, min_occurs=1), _returns=ModelResultData)
    def GetModels(Token):

        if Token != settings.EGM_IDENTIFICATION_TOKEN:
            return ModelResultData(
                Datetime=str(timezone.now()),
                Status=405,
                StatusText='Invalid token',
            )

        result = [
            ModelData(
                ModelId=series.model_id,
                ModelName=series.model.name,
                SeriesId=series.id,
                SeriesCode=series.code,
                SeriesName=series.name,
            )
            for series in Series.objects.all().select_related('model')
        ]

        return ModelResultData(
            Datetime=str(timezone.now()),
            Status=200,
            StatusText='Ok',
            ModelList=result,
        )


EgmWebServices = Application([CustomerUpdateService, ModelService],
    tns=TARGET_NAMESPACE,
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)
