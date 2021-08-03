from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'mps',
        (
            ('view_sales_breakdown_own', 'Can see the sales break down report for self or own dealership'),
            ('view_sales_breakdown_all', 'Can see the sales break down report for everyone'),
            ('view_mps_page', 'Can see the MPS page'),
            ('view_mps_sales_report', 'Can see the Retail and Stock Sales report '),
            ('view_mps_stock_report', 'Can see the Current and Future Stock report '),
            ('export_mps_sales_report', 'Can export the Retail Sales and Stock Sales report '),
            ('export_mps_stock_report', 'Can export the Current and Future Stock report '),
            #('view_runsheet_report', 'Can export runsheet report'),
            #('export_colorsheet', 'Can export Orders requiring selections'),
            ('view_schedule_report', 'Can export mps report'),
            ('extract_mps_sales_report', 'Can extract the Retail Sales and Stock Sales report'),
            ('extract_mps_stock_report', 'Can extract the Current and Future Stock report '),
            ('export_mps_month_sales_report', 'Can export Monthly Retail and Stock Sales Report'),
        ),
        verbosity=kwargs['verbosity'],
    )
