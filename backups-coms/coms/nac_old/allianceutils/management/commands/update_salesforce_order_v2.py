import json
import logging
from threading import Thread
from time import sleep

from django.core.management.base import BaseCommand

from orders.models import Order
from orders.models import OrderDocument
from salesforce.api import SalesforceApi

logger = logging.getLogger('egm_script')

tc=0
max_tc=1


def sync(o, trigger):
    global tc
    try:
        result = o.send_salesforce(trigger)
        if 'StatusCode' in result and result['StatusCode'] == 'QRSag-200':
            print(o.id,'succeeded.')
            tc -= 1
            return
        _print(o.id, result, level=logging.ERROR)
    except Exception as e:
        _print(o.id, e, level=logging.ERROR)
    tc-=1


def _print(oid, msg, level=None):
    msg=str(oid)+' - '+str(msg)
    open('/tmp/eg3_singlethread','a').write(msg+'\n')
    print(msg)

class Command(BaseCommand):
    help = 'Send existing orders to salesforce. You can send one order with [--order=id], default to send all orders from 1900.'

    def _print(self, message, level=logging.INFO):
        try:
            self.stdout.write(message)
        except:
            print(message)
        logger.log(level, message)
        open('/tmp/eg','a').write(str(message)+'\n')

    def add_arguments(self, parser):
        parser.add_argument('--order', action='store', dest='order',
            help='Order id to sync with salesforce')

    def handle(self, *args, **options):
        global tc
        o = options['order']
        if not o:
            # TODO - identify and correctly assign starting id. pre-1900 orders looks to contain lots of test and/or missing fields.
            for o in Order.objects.all(): #.exclude(build__vin_number=None):
                #if o.id < 4945: continue
                if not o.orderdocument_set.filter(type=OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM).exists(): continue
                #if o.get_order_stage() != o.STAGE_ORDER_FINALIZED: continue
                # Some orders still get a delivery date even if they're stock order - in these cases, trigger should still be handover.
                if o.delivery_date_customer and not o.is_stock():
                    trigger = SalesforceApi.TRIGGER_TYPE_DELIVERY
                else:
                    trigger = SalesforceApi.TRIGGER_TYPE_HANDOVER
                tc += 1
                while tc > max_tc: sleep(1)
                print(('SENDING ORDER %s TO SALESFORCE...' % o.id))
                t = Thread(target=sync, args=(o, trigger,))
                t.start()

        else:
            order = Order.objects.filter(orderdocument__type=OrderDocument.DOCUMENT_HANDOVER_TO_DRIVER_FORM).exclude(build__vin_number=None).filter(id=o).first()
            if not order:
                self._print('Order %s not found in NAC. Does this order contains a handover form (minimal)?\n' % o, level=logging.ERROR)
                return
            self._print('SENDING ORDER %s TO SALESFORCE...' % order.id)
            if order.delivery_date_customer and not o.is_stock():
                trigger = SalesforceApi.TRIGGER_TYPE_DELIVERY
            else:
                trigger = SalesforceApi.TRIGGER_TYPE_HANDOVER
            result = order.send_salesforce(trigger)
            self._print(result)
