from rest_framework import serializers

from customers.models import Customer
from newage.serializers import AddressSerializer


class CustomerSerializer(serializers.ModelSerializer):
    physical_address = AddressSerializer()
    delivery_address = AddressSerializer()
    postal_address = AddressSerializer()
    title = serializers.SerializerMethodField()

    def get_title(self, customer):
        return str(customer)

    class Meta:
        model = Customer
        fields = (
            'id',
            'title',
            'first_name',
            'last_name',
            'email',
            'phone1',
            'phone2',
            'phone_delivery',
            'phone_invoice',
            'partner_name',
            'physical_address',
            'delivery_address',
            'postal_address',
            'tow_vehicle',
            'mailing_list',
            'acquisition_source',
            'source_of_awareness',
        )
