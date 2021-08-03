from __future__ import absolute_import

import rules

import schedule.rules  # this creates a circular app dependency -- but hooks are magic we want to avoid.


@rules.predicates.predicate
def change_build_date_priority(user, obj):
    return user.has_perm('production.change_build')

@rules.predicates.predicate
def change_build_priority(user, obj):
    return user.has_perm('production.change_build')

rules.add_perm('production.change_build_date_priority', change_build_date_priority | schedule.rules.change_schedule)
rules.add_perm('production.change_build_priority', change_build_priority | schedule.rules.change_schedule)
