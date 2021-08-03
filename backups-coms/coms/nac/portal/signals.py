from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'portal',
        (
            ('make_images_visible', 'Make images from the Build Image Collection visible'),
        ),
        verbosity=kwargs['verbosity'],
    )
