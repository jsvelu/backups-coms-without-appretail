import csv

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import dateparse

from customers.models import AcquisitionSource
from customers.models import Customer
from customers.models import CustomerStatus
from customers.models import SourceOfAwareness
from newage.models import Address
from newage.models import Postcode
from newage.models import Suburb
from orders.models import Order


class CustomerError(Exception):
    def __init__(self):
        super(CustomerError, self).__init__('Customer Error')


class PostcodeError(Exception):
    def __init__(self, postcode):
        super(PostcodeError, self).__init__('Postcode Error', postcode)
        self.postcode = postcode


class DateError(Exception):
    def __init__(self, date_type, date_value):
        super(DateError, self).__init__('Date Error', date_type, date_value)
        self.date_type = date_type
        self.date_value = date_value


class Command(BaseCommand):
    help = 'Updates orders with the details in the CSV based on the chassis number'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', help='The CSV file containing the data')

    def handle(self, *args, **options):
        csv_filename = options['csv_file']
        messages = []

        with open(csv_filename) as csv_file:
            reader = csv.reader(csv_file)
            next(reader)   # Skip the header row
            for row in reader:
                chassis = row[0]
                try:
                    order = Order.objects.get(chassis=chassis)

                    try:
                        van_received_date = dateparse.parse_date(row[8])
                        if van_received_date is None:
                            raise DateError("Van Received Date", row[8])
                    except ValueError as e:
                        raise DateError("Van Received Date", row[8])

                    try:
                        delivery_date = dateparse.parse_date(row[9])
                        if delivery_date is None:
                            raise DateError("Delivery Date", row[9])
                    except ValueError as e:
                        raise DateError("Delivery Date", row[9])

                    with transaction.atomic():
                        if order.customer is None:
                            order.customer = Customer()

                        # Add in customer contact details
                        order.customer.first_name = row[1]
                        order.customer.last_name = row[2]
                        order.customer.email = row[3]
                        order.customer.phone1 = row[4]

                        # Add the customer address
                        if order.customer.physical_address is None:
                            order.customer.physical_address = Address(name='{} {}'.format(order.customer.first_name, order.customer.last_name))

                        address_name = order.customer.physical_address.name
                        street = row[5]
                        suburb_name = row[6]
                        postcode_number = row[7]

                        postcode = Postcode.objects.filter(number=postcode_number).first()

                        if postcode is None:
                            raise PostcodeError(postcode=postcode_number)

                        suburb = Suburb.objects.filter(post_code=postcode).filter(name=suburb_name).first()
                        if suburb is None:
                            suburb = Suburb.objects.create(
                                name=suburb_name,
                                post_code=postcode,
                            )

                        address = Address.objects.filter(name=address_name, address=street, suburb=suburb).first()
                        if address is None:
                            address = Address.objects.create(
                                name=address_name,
                                address=street,
                                suburb=suburb,
                            )

                        order.customer.physical_address = address
                        order.customer.physical_address.save()

                        # Add in other required customer fields
                        order.customer.lead_type = Customer.LEAD_TYPE_CUSTOMER
                        try:
                            status = CustomerStatus.objects.get(name__iexact='quote')
                        except CustomerStatus.DoesNotExist:
                            status = CustomerStatus()
                            status.name = 'Quote'
                            status.id = 1
                            status.save()
                        order.customer.customer_status = status

                        order.customer.source_of_awareness = SourceOfAwareness.objects.get(name='Caravan Dealership')
                        order.customer.acquisition_source = AcquisitionSource.objects.get(name='Dealership walk-in')
                        order.customer.tow_vehicle = 'Vehicle not specified'
                        order.customer.save()

                        order.delivery_date_customer = delivery_date
                        order.received_date_dealership = van_received_date
                        order.save()

                        print(('Saved {}'.format(order)))

                except CustomerError as e:
                    messages.append('Chassis {}: No existing customer'.format(chassis))
                except PostcodeError as e:
                    messages.append('Chassis {}: Unable to find postcode {}'.format(chassis, e.postcode))
                except DateError as e:
                    messages.append('Chassis {}: Invalid {} - {}'.format(chassis, e.date_type, e.date_value))
                except Order.DoesNotExist:
                    messages.append('Chassis {} not found in database'.format(chassis))
                except Exception as e:
                    messages.append('Chassis {}: Unknown error {}'.format(chassis, e))

        for message in messages:
            print(message)
