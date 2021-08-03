from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'schedule',
        (
            # ('view_schedule', 'Can view schedule information'),
            # ('change_schedule', 'Can change schedule information'),
            ('view_schedule_planner', 'Can view schedule planner information'),
            ('change_schedule_planner', 'Can manage schedule planner'),
            ('view_schedule_dashboard', 'Can view schedule dashboard information'),
            ('view_transport_dashboard', 'Can view Production dashboard information'),
            ('update_transport_dashboard', 'Can edit/update Production dashboard information'),
            ('edit_only_comments_schedule_dashboard', 'Can edit comments on the schedule dashboard'),
            ('change_schedule_dashboard', 'Can manage the schedule dashboard'),
            ('can_hold_caravans', 'Can Hold the caravans'),
            ('view_schedule_capacity', 'Can view schedule production capacity information'),
            ('change_schedule_capacity', 'Can manage production capacity'),
            ('export_schedule', 'Can export schedule'),
            ('view_dealer_schedule_dashboard', 'Can view the dealer schedule dashboard'),
        ),
        verbosity=kwargs['verbosity'],
    )
