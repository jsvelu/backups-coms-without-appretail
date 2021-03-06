

import allianceutils.models
import allianceutils.rules
from authtools.models import User
from django.contrib.auth.models import Group
import rules

from dealerships.models import DealershipUser


@rules.predicates.predicate
def can_create_history_note(user, order):
    return True


def get_drafter_users():
    return User.objects.filter(groups__in=Group.objects.filter(name='Drafter'))



# Per-model permissions start here

@rules.predicates.predicate
def is_order_rep(user, order):
    """
    True if user can request that an order be placed
    """
    return order.customer_manager_id == user.id


@rules.predicates.predicate
def belongs_to_same_dealership(user, order):
    """
    True if user can request that an order be placed
    """
    try:
        return order.dealership in user.dealershipuser.dealerships.all()
    except DealershipUser.DoesNotExist:
        return False


@rules.predicates.predicate
def is_order_principal(user, order):
    """
    True if user is a principal of the dealership that an order is placed by
    """
    is_principal = rules.test_rule('dealership.is_principal', user, order.dealership)
    return is_principal


@rules.predicates.predicate
def is_order_stand_manager(user, order):
    """
    True if user is stand manager for the show the order has been placed on
    """

    return order.show and user in [order.show.stand_manager, order.show.stand_manager_2, order.show.stand_manager_3]


@rules.predicates.predicate
def can_modify_requested_order(user, order):
    if user.has_perm('orders.modify_order_all'):
        return True
    if user.has_perm('orders.approve_order_all'):
        return True
    if rules.test_rule('dealership.is_principal', user, order.dealership):
        return True
    if is_order_stand_manager(user, order):
        return True
    # else:
    return belongs_to_same_dealership(user, order)


@rules.predicates.predicate
def can_view_order(user, order):
    if user.has_perm('orders.view_order_all'):
        return True

    if order is None:
        return user.has_perm('orders.modify_order')

    elif rules.test_rule('dealership.is_principal', user, order.dealership):
        return True

    elif is_order_stand_manager(user, order):
        return True

    else:
        return belongs_to_same_dealership(user, order)


@rules.predicates.predicate
def is_order_drafter(user, order):
    """
    True if user can manage/retrieve an order
    """
    # this really should be a build predicate, not an order predicate
    return hasattr(order, 'build') and order.build.drafter_id == user.id


@rules.predicates.predicate
def can_delete_order_rule_plan(user, rule_plan):
    if rule_plan.order.customer_manager.user_ptr == user:
        return True


@rules.predicates.predicate
def can_update_customer_plan(user, order):
    if user.has_perm('orders.modify_orderdocument_customer_plan_all'):
        return True

    return user.has_perm('orders.modify_orderdocument_customer_plan_own') and order.build.drafter_id == user.id


@rules.predicates.predicate
def can_update_factory_plan(user, order):
    if user.has_perm('orders.modify_orderdocument_factory_plan_all'):
        return True

    return user.has_perm('orders.modify_orderdocument_factory_plan_own') and order.build.drafter_id == user.id


@rules.predicates.predicate
def can_update_chassis_plan(user, order):
    if user.has_perm('orders.modify_orderdocument_chassis_plan_all'):
        return True

    return user.has_perm('orders.modify_orderdocument_chassis_plan_own') and order.build.drafter_id == user.id

# @rules.predicates.predicate
# def can_update_senior_designer_verfied_date(user, order):
#     if user.has_perm('orders.modify_senior_designer_verfied_date'):
#         return True

#     return user.has_perm('orders.modify_senior_designer_verfied_date') and order.ordertransport.order_id == user.id


# @rules.predicates.predicate
# def can_update_purchase_order_raised_date(user, order):
#     if user.has_perm('orders.modify_purchase_order_raised_date'):
#         return True

#     return user.has_perm('orders.modify_purchase_order_raised_date') and order.ordertransport.order_id == user.id


@rules.predicates.predicate
def can_review_customer_plan(user, order):
    if user.has_perm('orders.review_customer_plan_all'):
        return True

    return (
        user.has_perm('orders.review_customer_plan_own') and
        rules.test_rule('dealership.is_principal', user, order.dealership) or
        is_order_stand_manager(user, order) or
        belongs_to_same_dealership(user, order)
    )


rules.add_perm('orders.view_order', can_view_order)
rules.add_perm('orders.create_order', allianceutils.rules.has_any_perms(('orders.create_order_all', 'orders.create_order_own')))
rules.add_perm('orders.modify_order', allianceutils.rules.has_any_perms(('orders.modify_order_all', 'orders.modify_order_dealership')))
rules.add_perm('orders.modify_order_requested', can_modify_requested_order)
rules.add_perm('orders.approve_order', allianceutils.rules.has_perm('orders.approve_order_all') | is_order_principal | is_order_stand_manager)
rules.add_perm('orders.finalize_order', allianceutils.rules.has_perm('orders.finalize_order_all'))
rules.add_perm('orders.lock_order', is_order_principal)
rules.add_perm('orders.view_order_trade_price', allianceutils.rules.has_perm('orders.view_order_trade_price_all') | is_order_principal | is_order_stand_manager)
rules.add_perm('orders.modify_order_other_prices', allianceutils.rules.has_perm('orders.modify_order_other_prices_all') | is_order_principal | is_order_stand_manager)
rules.add_perm('orders.modify_order_price_comment', is_order_principal | is_order_stand_manager)
rules.add_perm('orders.modify_retail_prices_finalized', is_order_principal | is_order_stand_manager)
rules.add_perm('orders.modify_order_sales_rep', is_order_principal | is_order_stand_manager)

# rules.add_perm('orders.senior_designer_verfied_date', can_update_senior_designer_verfied_date)
# rules.add_perm('orders.purchase_order_raised_date', can_update_purchase_order_raised_date)


rules.add_perm('orders.view_or_create_or_modify_order', allianceutils.rules.has_any_perms(('orders.create_order_all',
       'orders.create_order_own', 'orders.modify_order_all', 'orders.modify_order_dealership', 'orders.view_order_own',
       'orders.view_order_all')))
rules.add_perm('orders.create_history_note', can_create_history_note)
rules.add_perm('orders.delete_order_rule_plan', can_delete_order_rule_plan)
rules.add_perm('orders.update_order_customer_plan', can_update_customer_plan)
rules.add_perm('orders.update_order_factory_plan', can_update_factory_plan)
rules.add_perm('orders.update_order_chassis_plan', can_update_chassis_plan)
rules.add_perm('orders.review_customer_plan', can_review_customer_plan)
rules.add_perm('orders.print_invoice', allianceutils.rules.has_any_perms(('orders.print_invoice_all', 'orders.print_invoice_own')))
