import logging

from django.core.management.base import BaseCommand

from newage.egm import is_order_dealership_implemented_in_egm
from newage.egm import update_order_on_egm
from orders.models import Order

logger = logging.getLogger('egm_script')


class Command(BaseCommand):
    help = 'Goes through all orders marked as not synchronised with e-GoodManners systems and tries to update them.'

    def add_arguments(self, parser):

        parser.add_argument('--dry-run',
            action='store_true',
            dest='dry_run',
            help='Displays the list of orders to be updated but do not call the egm webservice.')

    def handle(self, *args, **options):
        verbosity = options.get('verbosity', 0)
        dry_run = options.get('dry_run')

        orders = [o for o in Order.objects.filter(is_up_to_date_with_egm=False) if is_order_dealership_implemented_in_egm(o)]

        self._print('\n\n\n===========================  STARTING UPDATE EGM ORDER SCRIPT  ===========================\n')

        if verbosity >= 1:
            self._print('Updating {} orders...'.format(len(orders)))

        def format_error(order, err):
            s = '"Order not updated", {orderid}, {chassisid}, {customerid}, {customername}, {dealershipid}, {dealershipname}, {series}, "{errorabstract}", "{errorfull}"'
            err = str(err)
            try:
                return s.format(
                    orderid = order.id,
                    chassisid = order.chassis or 'None',
                    customerid = order.customer_id or '',
                    customername = order.customer.get_full_name() if order.customer else '(Stock)',
                    dealershipid = order.dealership_id,
                    dealershipname = order.dealership,
                    series = order.orderseries.series,
                    errorabstract = err[err.find('eGM error:'):] if err.find('eGM error:') != -1 else '-',
                    errorfull = err,
                )
            except: # we want to preserve the error even if the format above fails for whatever reason
                return '"Order not updated","Error parsing failed",,,,,,,"%s"' % err

        for order in orders:
            if verbosity >= 2:
                self._print('Updating order: {}'.format(order))

            if dry_run:
                if verbosity >= 2:
                    self._print('Dry-run mode, order not updated.')
            else:
                is_successful, _result_set, error = update_order_on_egm(order)

                if is_successful:
                    if verbosity >= 2:
                        self._print('Order updated successfully')
                else:
                    # error messages begin with ! are internal and client requested them to be removed.
                    if not error.startswith('!') or verbosity >= 2:
                        self._print(format_error(order, error), logging.ERROR)

        self._print('Orders not yet updated: {}'.format(len([o for o in orders if not o.is_up_to_date_with_egm])))

    def _print(self, message, level=logging.INFO):
        self.stdout.write(message)
        logger.log(level, message)
