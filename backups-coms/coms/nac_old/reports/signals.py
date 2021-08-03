from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'reports',
        (
            ('view_sales_breakdown_own', 'Can see the sales break down report for self or own dealership'),
            ('view_sales_breakdown_all', 'Can see the sales break down report for everyone'),
            ('view_runsheet_report', 'Can export runsheet report'),
            ('view_invoice_report', 'Can export invoice report'),
            ('export_colorsheet', 'Can export Orders requiring selections'),
            ('view_series_pricelist_all', 'Can view the Series price list'),
            ('upload_series_pricelist', 'Can upload prices of the series'),
            ('upload_vin_numbers', 'Can upload Vin Numbers in bulk'),
        ),
        verbosity=kwargs['verbosity'],
    )
