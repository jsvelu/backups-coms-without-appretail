from allianceutils.permissions import register_custom_permissions
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def post_migrate(sender, **kwargs):
    register_custom_permissions(
        'orders',
        (),
        verbosity=kwargs['verbosity'],
    )

    register_custom_permissions(
        'order-status',
        (
            ('view_status_customer_details_captured', 'Can view the status row Customer Details Captured'),
            ('view_status_caravan_details_saved', 'Can view the status row Caravan Details Saved'),
            ('view_status_caravan_order_requested', 'Can view the status row Order Placement Requested'),
            ('view_status_caravan_ordered', 'Can view the status row Order Placed'),
            ('view_status_deposit_paid', 'Can view the status row Deposit Paid'),
            ('view_status_special_features_reviewed', 'Can view the status row Special features reviewed'),
            ('view_status_caravan_finalization_requested', 'Can view the status row Caravan Finalisation Requested'),
            ('view_status_caravan_finalized', 'Can view the status row Order Finalised'),
            ('view_status_chassis_number_appointed', 'Can view the status row Chassis Number Appointed'),
            ('view_status_drafter_appointed', 'Can view the status row Drafter Appointed'),
            ('view_status_customer_plans_specs_produced', 'Can view the status row Customer Plans & Specs Produced'),
            ('view_status_customer_plan_approval', 'Can view the status row Customer plan approval'),
            ('view_status_factory_plans_produced', 'Can view the status row Factory Plans Produced'),
            ('view_status_chassis_plans_produced', 'Can view the status row Chassis Plans Produced'),
            ('view_status_senior_designer_verfied_date', 'Can view Senior Designer Verified Date'),
            ('view_status_purchase_order_raised_date', 'Can view Purchase Order Raised Date'),
            ('view_status_bill_of_materials_exported', 'Can view the status row Bill of Materials Exported'),
            ('view_status_caravan_started_production', 'Can view the status row Caravan Started Production'),
            ('view_status_caravan_build_finished', 'Can view the status row Caravan Build Finished'),

            ('view_status_qc_date_planned', 'Can view the status row Planned QC Date'),
            ('view_status_qc_date_actual', 'Can view the status row Actual QC Date'),
            ('view_status_vin_number', 'Can view the status row VIN Number'),
            ('view_status_weights', 'Can view the status row Weights'),
            ('view_status_dispatch_date_planned', 'Can view the status row Planned Dispatch Date'),
            ('view_status_dispatch_date_actual', 'Can view the status row Actual Dispatch Date'),
            ('view_status_collection_date', 'Can view the status row Collection Date'),
            ('view_status_handover_to_driver_form', 'Can view the status row Upload Driver Handover Form'),
            ('view_status_received_date_dealership', 'Can view the status row Van Received at Dealership'),
            ('view_status_handover_to_dealership_form', 'Can view the status row Upload Driver Handover To Dealership Form'),
            ('view_status_delivery_date_customer', 'Can view the status row Customer Delivery Date'),
            ('can_edit_display_totals_after_dispatch', 'Can edit display totals after dispatch'),
            ('view_production_dashboard_audit_history', 'Can view Production Dashboard Audit History'),
            ('can_delete_date_in_production_field', 'Can delete the date in Production Field'),
            ('can_update_senior_designer_verfied_date', 'Can Update Senior Designer Verified Date Field'),
            ('can_update_purchase_order_raised_date', 'Can Update Purchase Order Raised Date'),
            ('can_delete_certificates', 'Can Delete Certificate'),
        ),
        verbosity=kwargs['verbosity'],
    )
