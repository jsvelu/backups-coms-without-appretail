from rest_framework import serializers

from newage.models import Address
from newage.models import Postcode
from newage.models import State
from newage.models import Suburb


class StateSerializer(serializers.ModelSerializer):

    class Meta:
        model = State
        fields = (
            'id',
            'name',
            'code',
        )
        read_only_fields = (
            'name',
            'code',
        )


class PostcodeSerializer(serializers.ModelSerializer):
    state = StateSerializer()

    class Meta:
        model = Postcode
        fields = (
            'id',
            'state',
            'number',
        )
        read_only_fields = (
            'state',
            'number',
        )


class SuburbSerializer(serializers.ModelSerializer):
    post_code = PostcodeSerializer()
    title = serializers.SerializerMethodField()

    def get_title(self, customer):
        return str(customer)

    class Meta:
        model = Suburb
        fields = (
            'id',
            'title',
            'name',
            'post_code',
        )
        read_only_fields = (
            'name',
            'post_code',
        )


class AddressSerializer(serializers.ModelSerializer):
    suburb = SuburbSerializer()

    class Meta:
        model = Address
        fields = (
            'id',
            'name',
            'address',
            'address2',
            'suburb',
        )
        read_only_fields = (
            'name',
            'address',
            'address2',
            'suburb',
        )
