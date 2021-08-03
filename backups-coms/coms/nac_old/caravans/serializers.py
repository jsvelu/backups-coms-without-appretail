from rest_framework import serializers

from caravans.models import Model
from caravans.models import Rule
from caravans.models import Series
from caravans.models import SeriesPhoto
from caravans.models import SKU
from caravans.models import SKUCategory


class SKUSerializer(serializers.ModelSerializer):

    def __init__(self, *args, **kwargs):
        self.availability_type = None
        if 'availability_type' in kwargs:
            self.availability_type = kwargs.pop('availability_type')

        super(SKUSerializer, self).__init__(*args, **kwargs)

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'name': instance.name,
            'public_description': instance.public_description or instance.description,
            'code': instance.code,
            'sku_category': instance.sku_category_id,
            'description': instance.description,
            'cost_price': str(instance.cost_price) if instance.cost_price else 0,
            'retail_price': str(instance.retail_price) if instance.retail_price else 0,
            'wholesale_price': str(instance.wholesale_price) if instance.wholesale_price else 0,
            'quantity': instance.quantity,
            'photo': instance.photo.url if instance.photo else None,
            'availability_type': self.availability_type,
        }

    class Meta:
        model = SKU
        fields = (
            'id',
            'name',
            'public_description',
            'code',
            'sku_category',
            'description',
            'cost_price',
            'retail_price',
            'wholesale_price',
            'quantity',
        )


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SKUCategory
        fields = (
            'id',
            'parent',
            'name',
            'screen_order',
            'print_order',
        )


class RuleSerializer(serializers.ModelSerializer):
    item = SKUSerializer(source='sku')
    items = SKUSerializer(source='associated_skus', many=True)

    class Meta:
        model = Rule
        fields = (
            'id',
            'title',
            'text',
            'type',
            'type_code',
            'item',
            'items',
            'price_adjustment',
        )


class SeriesPhotoSerializer(serializers.ModelSerializer):
    url = serializers.CharField(source='photo.url')

    class Meta:
        model = SeriesPhoto
        fields = (
            'id',
            'url',
            'is_main_photo',
        )


class SeriesSerializer(serializers.ModelSerializer):
    photos = SeriesPhotoSerializer(source='seriesphoto_set', many=True)
    description = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        self.order = None
        if 'order' in kwargs:
            self.order = kwargs.pop('order')

        super(SeriesSerializer, self).__init__(*args, **kwargs)

    def get_description(self, instance):
        if self.order:
            return self.order.get_series_description()

        return '{} ({})'.format(instance.name, instance.code)

    class Meta:
        model = Series
        fields = (
            'id',
            'name',
            'code',
            'description',
            'photos',
            'cost_price',
            'wholesale_price',
            'retail_price',
            'length_mm',
            # 'length_feet',
            # 'length_inches',
            # 'length_incl_aframe_feet',
            # 'length_incl_aframe_inches',
            # 'length_incl_bumper_feet',
            # 'length_incl_bumper_inches',
            # 'height_max_incl_ac_feet',
            # 'height_max_incl_ac_inches',
            # 'length_incl_aframe_mm',
            'length_incl_bumper_mm',
            'height_max_incl_ac_mm',
            'width_incl_awning_mm',
            # 'width_feet',
            # 'width_inches',
            'width_mm',
            # 'width_incl_awning_feet',
            # 'width_incl_awning_inches',
            'width_incl_awning_mm',
            'avg_tare_weight',
            'avg_ball_weight',
            # 'avg_tare_weight_min',
            # 'avg_tare_weight_max',
            # 'avg_ball_weight_min',
            # 'avg_ball_weight_max',
            'dealerships',
        )


class ModelSerializer(serializers.ModelSerializer):
    series = serializers.SerializerMethodField()

    def get_series(self, obj):
        return SeriesSerializer(obj.series_set.all().order_by('code'), many=True).data

    class Meta:
        model = Model
        fields = (
            'id',
            'name',
            'series',
        )
