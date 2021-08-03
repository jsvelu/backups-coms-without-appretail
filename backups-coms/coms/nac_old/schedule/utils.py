from datetime import timedelta

from django.core.exceptions import ImproperlyConfigured
from django.db.models.query_utils import Q

from orders.models import Order
from production.models import Build
from production.models import BuildOrder
from schedule.models import Capacity
from schedule.models import MonthPlanning


def isoweek_start(d):
    """
    get the iso weekly calendar start for a given date
    :param d: date
    :return: date
    """
    iso_weekday = d.isocalendar()[2]
    return d - timedelta(days=iso_weekday - 1)


def isoweek_starts(date_start, date_end):
    """
    Returns a list of iso week starts for the dates between [date_start, date_end]
    :param date_start: date
    :param date_end: date
    :return: list(date)
    """
    last_week = isoweek_start(date_end)
    cur_week = isoweek_start(date_start)

    week_starts = []
    while cur_week <= last_week:
        week_starts.append(cur_week)
        cur_week += timedelta(days=7)
    return week_starts


def get_ordinal(number):
    if 4 <= number <= 20 or 24 <= number <= 30:
        return "th"
    else:
        return ["st", "nd", "rd"][number % 10 - 1]


def assign_build_dates_for_month(month, production_unit):
    """
    Assigns the build dates to the earliest available capacity slot for all the builds affected to the given month.
    Builds are assigned in order according to their respective build_order.

    Args:
        month: (date) the month in which all builds need to be assigned an order.

    Returns: None
    """

    # Remove the build dates for all build for the given month

    planned_month, _created = MonthPlanning.objects.get_or_create(production_month=month, production_unit = production_unit)
    Build.objects.filter(
        # Q(build_date__range=(planned_month.production_start_date, planned_month.next().production_start_date)) | # Those whose build_date is within the current planning month
        Q(build_order__production_month=planned_month.production_month) # Those who are scheduled for the current planning month (they can be assigned to another planning month, for example to the previous one if there were available slots)
    ).filter(build_order__production_unit= production_unit).update(build_date=None)

    for build_order in BuildOrder.objects.filter(production_month=month, production_unit = production_unit, build__order__order_cancelled__isnull=True).order_by('order_number'):
        if not hasattr(build_order, 'build'):
            continue
        build = build_order.build
        build.build_date = get_earliest_available_slot(month, production_unit)
        build.save()



def get_earliest_available_slot(month, production_unit):
    """
    Gets the earliest date with an available capacity slot in the previous month if available, otherwise in the current month

    Args:
        month: The month for which to check the availability

    Returns: The earliest date with an available capacity slot, or None if no date is available
    """

    month = month.replace(day=1) # Ensure the month date refers to the first of the month

    current_planned_month = MonthPlanning.objects.get(production_month=month, production_unit = production_unit)

    result_date = current_planned_month.production_start_date

    while result_date < current_planned_month.next().production_start_date:
        if has_available_build_slots(result_date, production_unit):
            return result_date

        result_date += timedelta(days=1)

    return None

# def get_earliest_available_slot(month, production_unit, check_previous_month=True):
#     """
#     Gets the earliest date with an available capacity slot in the previous month if available, otherwise in the current month

#     Args:
#         month: The month for which to check the availability
#         check_previous_month: If True, will first check availability in the previous month

#     Returns: The earliest date with an available capacity slot, or None if no date is available
#     """

#     month = month.replace(day=1) # Ensure the month date refers to the first of the month

#     if check_previous_month:
#         previous_month = month - timedelta(days=1)
#         previous_month_slot = get_earliest_available_slot(previous_month, production_unit, check_previous_month=False)

#         if previous_month_slot:
#             return previous_month_slot

#     current_planned_month = MonthPlanning.objects.get(production_month=month, production_unit = production_unit)

#     result_date = current_planned_month.production_start_date

#     while result_date < current_planned_month.next().production_start_date:
#         if has_available_build_slots(result_date, production_unit):
#             return result_date

#         result_date += timedelta(days=1)

#     return None


def has_available_build_slots(date_check, production_unit):
    """
    Returns True if there are available build slot in the given date.
    """
    capacity = Capacity.objects.get_restore_or_create(day=date_check, production_unit=production_unit, defaults={'capacity': 0}).capacity
    order_count = Order.objects.filter(
        build__build_date=date_check,
        build__build_order__production_unit = production_unit,
        order_submitted__isnull=False,
        order_cancelled__isnull=True,
    ).count()
    return capacity > order_count
