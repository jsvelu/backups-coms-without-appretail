

import rules

from dealerships.models import Dealership
from dealerships.models import DealershipUser


@rules.predicates.predicate
def view_sales_breakdown(user, obj):
    if user.has_perm('mps.view_sales_breakdown_own') or user.has_perm('mps.view_sales_breakdown_all'):
        return True


@rules.predicates.predicate
def can_view_mps_page(user, obj):
    if user.has_perm('mps.view_schedule_report'):
        return True

@rules.predicates.predicate
def can_view_report_page(user, obj):
    if user.has_perm('mps.view_runsheet_report') or user.has_perm('mps.view_schedule_report') or user.has_perm('mps.export_colorsheet') or view_sales_breakdown(user, obj):
        return True

@rules.predicates.predicate
def can_view_sales_report_page(user, obj):
    if user.has_perm('mps.view_mps_page'):#or user.has_perm('mps.view_mps_stock_report'): 
        return True

@rules.predicates.predicate
def can_view_stock_report_page(user, obj):
    if user.has_perm('mps.view_mps_page'):
        return True

@rules.predicates.predicate
def can_export_stock_report_page(user, obj):
    if user.has_perm('mps.view_mps_stock_report'): 
        return True

@rules.predicates.predicate
def can_export_sales_report_page(user, obj):
    if user.has_perm('mps.view_mps_sales_report'):
        return True

@rules.predicates.predicate
def can_extract_sales_report_page(user, obj):
    if user.has_perm('mps.view_mps_sales_report'):
        return True

@rules.predicates.predicate
def can_export_runsheet_report(user, obj):
    if user.has_perm('mps.view_runsheet_report'):
        return True

def can_extract_stock_report_page(user, obj):
    if user.has_perm('mps.view_mps_sales_report'):
        return True

@rules.predicates.predicate
def can_export_month_sales_report(user, obj):
    if user.has_perm('mps.view_mps_sales_report'):
        return True

rules.add_perm('mps.view_sales_breakdown', view_sales_breakdown)
rules.add_perm('mps.view_mps_page', can_view_mps_page)
rules.add_perm('mps.view_mps_sales_report', can_view_sales_report_page)
rules.add_perm('mps.view_mps_stock_report', can_view_stock_report_page)
rules.add_perm('mps.export_mps_sales_report', can_export_sales_report_page)
rules.add_perm('mps.export_mps_stock_report', can_export_stock_report_page)
#rules.add_perm('mps.export_runsheet', can_export_runsheet_report)

rules.add_perm('mps.extract_mps_sales_report', can_extract_sales_report_page)
rules.add_perm('mps.extract_mps_stock_report', can_extract_stock_report_page)
rules.add_perm('mps.export_mps_month_sales_report', can_export_month_sales_report)

def get_user_mps_dealerships(user, check_id=None):
    """
    returns a queryset of dealerships if check_ids is False,
    otherwise returns a boolean based on whether user have access to the dealership specified by check_id
    """

    if user.has_perm('mps.view_sales_breakdown_all'):
        if not check_id:
            return Dealership.objects.all()
        return True
    else:
        try:
            if not check_id:
                dealership_ids = user.dealershipuser.dealerships.values_list('id')
                return Dealership.objects.filter(id__in=dealership_ids)
            else:
                valid_ids = user.dealershipuser.get_dealership_ids()
                return int(check_id) in valid_ids
        except DealershipUser.DoesNotExist:
            if not check_id:
                return []
            return False
