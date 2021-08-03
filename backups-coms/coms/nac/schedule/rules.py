

import allianceutils
import rules


@rules.predicates.predicate
def change_schedule(user):
    return user.has_permission('schedule.change_schedule')


rules.add_perm('schedule.edit_comments_schedule_dashboard', allianceutils.rules.has_any_perms(('schedule.change_schedule_dashboard', 'schedule.edit_only_comments_schedule_dashboard')))
