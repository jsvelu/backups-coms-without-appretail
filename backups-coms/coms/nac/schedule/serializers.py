
from rest_framework import serializers

from schedule.models import MonthPlanning


class MonthPlanningSerializer(serializers.ModelSerializer):
    capacity = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()

    def _get_generic_status(self, planning):
        if planning.production_start_date is None or planning.next().production_start_date is None:
            return 'Undefined'
        elif planning.production_start_date > planning.next().production_start_date:
            return 'Misconfigured'
        return ''

    def get_capacity(self, planning):
        return self._get_generic_status(planning) or planning.get_capacity(planning.production_unit)

    def get_total_orders(self, planning):
        return self._get_generic_status(planning) or planning.get_total_order_count()

    class Meta(object):
        model = MonthPlanning
        fields = (
            'production_month',
            'production_start_date',
            'capacity',
            'total_orders',
            'sign_off_reminder',
            'sign_off_reminder_sent',
            'draft_completion',
            'closed',
            'production_unit',
        )
