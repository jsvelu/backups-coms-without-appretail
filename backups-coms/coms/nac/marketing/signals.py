from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'marketing',
        (
            ('view_marketing_materials', 'Can view the marketing materials'),
        ),
        verbosity=kwargs['verbosity'],
    )
