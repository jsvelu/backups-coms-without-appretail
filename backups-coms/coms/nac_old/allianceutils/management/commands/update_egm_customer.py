import logging

from django.core.management.base import BaseCommand

from customers.models import Customer
from newage.egm import is_customer_dealership_implemented_in_egm
from newage.egm import update_customer_on_egm

logger = logging.getLogger('egm_script')


class Command(BaseCommand):
    help = 'Goes through all customers marked as not synchronised with e-GoodManners systems and tries to update them.'

    def add_arguments(self, parser):

        parser.add_argument('--dry-run',
            action='store_true',
            dest='dry_run',
            help='Displays the list of customers to be updated but do not call the egm webservice.')

    def handle(self, *args, **options):
        verbosity = options.get('verbosity', 0)
        dry_run = options.get('dry_run')

        customers = [c for c in Customer.objects.filter(is_up_to_date_with_egm=False) if is_customer_dealership_implemented_in_egm(c)]

        self._print('\n\n\n===========================  STARTING UPDATE EGM CUSTOMER SCRIPT  ===========================\n')

        if verbosity >= 1:
            self._print('Updating {} customers...'.format(len(customers)))


        def format_error(customer, order, err):
            s = '"Customer not updated", {customerid}, {customername}, {dealershipid}, {dealershipname}, "{salesrep}", {series}, "{errorabstract}", "{errorfull}"'
            err = str(err)
            try:
                return s.format(
                    customerid = customer.id or '',
                    customername = customer.get_full_name(),
                    dealershipid = order.dealership_id,
                    dealershipname = order.dealership,
                    salesrep = order.dealer_sales_rep.email if order.dealer_sales_rep else '',
                    series = order.orderseries.series,
                    errorabstract = err[err.find('eGM error:'):] if err.find('eGM error:') != -1 else '-',
                    errorfull = err,
                )
            except: # we want to preserve the error even if the format above fails for whatever reason
                return '"Customer not updated","Error parsing failed",,,,,,,"%s"' % err

        for customer in customers:
            if verbosity >= 2:
                customer_str = '{} (id={})'.format(customer.get_full_name(), customer.id)
                if verbosity >= 3:
                    customer_str = '{} (id={})'.format(str(customer), customer.id)
                self._print('Updating customer: ' + customer_str)

            if dry_run:
                if verbosity >= 2:
                    self._print('Dry-run mode, customer not updated.')
            else:
                order = customer.order_set.first()
                series_code = '{order.orderseries.series.model.name} {order.orderseries.series.code}'.format(order=order) if order and order.orderseries else None
                is_successful, _result_set, error = update_customer_on_egm(customer, series_code)

                if is_successful:
                    if verbosity >= 2:
                        self._print('Customer updated successfully')
                else:
                    self._print(format_error(customer, order, error), logging.ERROR)

        self._print('Customers not yet updated: {}'.format(len([c for c in customers if not c.is_up_to_date_with_egm])))

    def _print(self, message, level=logging.INFO):
        self.stdout.write(message)
        logger.log(level, message)
