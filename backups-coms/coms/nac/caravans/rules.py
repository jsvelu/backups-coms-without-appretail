from __future__ import absolute_import

import rules

from caravans.models import Series
from dealerships.models import Dealership


@rules.predicates.predicate
def can_browse_models(user):
    """
    True if user can browse any models
    """
    if user.has_perm('caravans.browse_all_models'):
        return True

    dealerships = Dealership.objects.filter(dealershipuser=user)
    return Series.objects.filter(dealerships__in=dealerships).exists()


@rules.predicates.predicate
def can_browse_series(user, series):
    """
    True if user can browse a specific series
    """
    if user.has_perm('caravans.browse_all_models'):
        return True

    dealerships = Dealership.objects.filter(dealershipuser=user)
    return Series.objects.filter(id=series.id, dealerships__in=dealerships).exists()


rules.add_perm('caravans.can_browse_models', can_browse_models)
rules.add_perm('caravans.can_browse_series', can_browse_series)
