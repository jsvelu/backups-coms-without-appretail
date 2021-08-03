
from django import forms
from django.contrib import admin
from django.contrib.admin.filters import DateFieldListFilter

from .models import Order
from .models import OrderRulePlan
from .models import OrderShowSpecial
from .models import OrderShowSpecialLineItem
from .models import OrderSKU
from .models import Show
from .models import ShowSpecial
from .models import SpecialFeature


class SpecialFeatureInline(admin.TabularInline):
    model = SpecialFeature
    extra = 0
    fields = (
        'customer_description',
    )


class OrderRulePlanInline(admin.StackedInline):
    model = OrderRulePlan
    extra = 0
    fields = (
        'sku',
        'file',
        'notes',
    )


class OrderShowSpecialInline(admin.TabularInline):
    model = OrderShowSpecial
    extra = 0
    readonly_fields = (
        'name',
        'description',
        'value',
    )

    def name(self, obj):
        return obj.special.name

    def description(self, obj):
        return obj.special.description


class OrderSKUAdmin(admin.ModelAdmin):
    list_display = (
        'customer',
        'chassis',
        '__str__',
        'retail_price',
        'wholesale_price',
        'cost_price',
    )

    def customer(self, obj):
        if obj.order.customer:
            return "%s %s" % (obj.order.customer.first_name, obj.order.customer.last_name)
        else:
            return obj.order.dealership.name

    def chassis(self, obj):
        return obj.order.chassis

    search_fields = ['sku__name', 'sku__sku_category__name', 'order__customer__first_name',
                     'order__customer__last_name', 'order__chassis', 'order__dealership__name']


class ShowAdminForm(forms.ModelForm):
    def clean(self):
        cleaned_data = super(ShowAdminForm, self).clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")

        if start_date > end_date:
            raise forms.ValidationError(
                "The Show start date must be before the end date."
            )


class ShowAdmin(admin.ModelAdmin):
    form = ShowAdminForm

    list_display = (
        'name',
        'start_date',
        'end_date',
        'stand_manager',
        'stand_manager_2',
        'stand_manager_3',
    )


class ShowSpecialAdminForm(forms.ModelForm):
    def clean(self):
        cleaned_data = super(ShowSpecialAdminForm, self).clean()
        available_from = cleaned_data.get("available_from")
        available_to = cleaned_data.get("available_to")

        if available_from > available_to:
            raise forms.ValidationError(
                "The Show Special start date must be before the end date."
            )


class ShowSpecialAdmin(admin.ModelAdmin):
    form = ShowSpecialAdminForm

    def get_changelist_form(self, request, **kwargs):
        return ShowSpecialAdminForm

    list_display = (
        'name',
        'available_from',
        'available_to',
    )

    list_editable = (
        'available_from',
        'available_to',
    )

    filter_horizontal = (
        'dealerships',
        'rules',
    )


class OrderShowSpecialLineItemInline(admin.StackedInline):
    model = OrderShowSpecialLineItem
    extra = 0
    fields = (
        'name',
        'description',
        'price_adjustment',
    )


class OrderShowSpecialAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'special_name',
        'value',
    )

    inlines = (
        OrderShowSpecialLineItemInline,
    )

    def special_name(self, obj):
        return obj.special.name


class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'chassis',
        'orderseries',
        'customer',
        'order_date'
    )
    inlines = (
        SpecialFeatureInline,
        OrderShowSpecialInline,
        OrderRulePlanInline,
    )

    search_fields = ['id', 'chassis', 'orderseries__series__code', 'orderseries__series__name', 'orderseries__series__model__name', 'customer__first_name',
                     'customer__last_name']
    list_filter = (
        ('order_date', DateFieldListFilter),
    )


# Register your models here.
admin.site.register(SpecialFeature)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderShowSpecial, OrderShowSpecialAdmin)
admin.site.register(OrderSKU, OrderSKUAdmin)
admin.site.register(Show, ShowAdmin)
admin.site.register(ShowSpecial, ShowSpecialAdmin)
