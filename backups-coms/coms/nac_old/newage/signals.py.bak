from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'newage',
        (),
        verbosity=kwargs['verbosity'],
    )
    register_custom_permissions(
        'delivery',
        (
            ('is_transport_team', 'Is member of the Transport Team'),
            ('is_vin_weight_team', 'Is member of the VIN & Weight Team'),
            ('can_access_vin_sheet', 'Can access VIN Data Sheet'),
        ),
        verbosity=kwargs['verbosity'],
    )
