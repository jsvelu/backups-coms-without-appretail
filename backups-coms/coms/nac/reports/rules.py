

import rules

from dealerships.models import Dealership
from dealerships.models import DealershipUser
from caravans.models import Model
from caravans.models import Series


@rules.predicates.predicate
def can_upload_vin_numbers(user, obj):
    if user.has_perm('reports.upload_vin_numbers'):
        return True

@rules.predicates.predicate
def can_upload_series_pricelist(user, obj):
    if user.has_perm('reports.upload_series_pricelist'):
        return True


@rules.predicates.predicate
def view_sales_breakdown(user, obj):
    if user.has_perm('reports.view_sales_breakdown_own') or user.has_perm('reports.view_sales_breakdown_all'):
        return True

@rules.predicates.predicate
def can_view_report_page(user, obj):
    if user.has_perm('reports.view_runsheet_report') or user.has_perm('reports.view_invoice_report') or user.has_perm('reports.export_colorsheet') or view_sales_breakdown(user, obj):
        return True


@rules.predicates.predicate
def can_export_runsheet_report(user, obj):
    if user.has_perm('reports.view_runsheet_report'):
        return True



rules.add_perm('reports.view_sales_breakdown', view_sales_breakdown)
rules.add_perm('reports.view_reports_page', can_view_report_page)
rules.add_perm('reports.export_runsheet', can_export_runsheet_report)

def get_user_reports_dealerships(user, check_id=None):
    """
    returns a queryset of dealerships if check_ids is False,
    otherwise returns a boolean based on whether user have access to the dealership specified by check_id
    """

    if user.has_perm('reports.view_sales_breakdown_all'):
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
def get_model_series_id(user, model_id=None):

    if user.has_perm('reports.view_sales_breakdown_all'):

        if not model_id:
                return Model.objects.all()
        return True
    else:
        try:
            if not model_id:
                model_ids = user.model_iduser.models.values_list('id')
                return Model.objects.filter(id__in=model_ids)
            else:
                valid_ids = user.model_iduser.get_model_ids()
                return int(model_id) in valid_ids
        except Model_idUser.DoesNotExist:
            if not model_id:
                return []
            return False
