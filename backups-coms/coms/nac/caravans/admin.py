
from django import forms
from django.conf import settings
from django.contrib import admin
from django.contrib.admin import widgets
from django.db.models.query_utils import Q
from django.forms.fields import Field
from django.forms.widgets import CheckboxInput

# Register your models here.
from .models import Model
from .models import Rule
from .models import Series
from .models import SeriesPhoto
from .models import SeriesSKU
from .models import SKU
from .models import SKUCategory
from .widgets import ImperialDimensionField
from .widgets import MinMaxWeightField


class SkuChoiceFieldLabelMixin(object):

     def label_from_instance(self, sku):
        result = sku.name

        if sku.code:
            result += ' | ' + sku.code

        if sku.retail_price is not None:
            result += ' (${})'.format(sku.retail_price)

        return result


class SkuMultipleChoiceField(SkuChoiceFieldLabelMixin, forms.ModelMultipleChoiceField):
    pass


class SkuChoiceField(SkuChoiceFieldLabelMixin, forms.ModelChoiceField):
    pass


class RuleAdminForm(forms.ModelForm):
    sku = SkuChoiceField(queryset=SKU.objects.all(), required=False)
    associated_skus = SkuMultipleChoiceField(
        queryset=SKU.objects.all(),
        required=False,
        widget=widgets.FilteredSelectMultiple('Associated Skus', False)
    )


class RuleAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'type',
        'text',
    )

    filter_horizontal = (
        'series',
        'associated_skus',
    )

    form = RuleAdminForm


class ModelAdmin(admin.ModelAdmin):
    list_display = (
        'logo_tag',
        'name',
    )

    def save_model(self, request, obj, form, change):
        # This model has a unique field, but also inherit from PermanentModel.
        # This means that if an object is deleted, it will still exist in the database, and adding new model with the same value for the unique field will fail.
        try:
            Model.deleted_objects.get(name=obj.name).delete(force=True)
        except Model.DoesNotExist:
            pass
        super(ModelAdmin, self).save_model(request, obj, form, change)


# class SeriesAdminForm(forms.ModelForm):

#     # Create these as simple fields, they will be initialised in __init__ to allow passing instance values
#     # The name needs to be in the form <'imperial_' + original_field> where original_field is the name of the fields without the suffix '_feet' and '_inches'
#     imperial_length_incl_aframe = Field(label='Length (incl A-Frame)')
#     imperial_length_incl_bumper = Field(label='Length (incl Bumper)')
#     imperial_height_max_incl_ac = Field(label='Max Height (incl A/C)')
#     imperial_width_incl_awning = Field(label='Width (incl Awning)')

#     # The name needs to be in the form <'minmax_' + original_field> where original_field is the name of the fields without the suffix '_min' and '_max'
#     minmax_avg_tare_weight = Field(label='Avg Tare Weight')
#     minmax_avg_ball_weight = Field(label='Avg Ball Weight')

#     def __init__(self, *args, **kwargs):
#         """
#         Automatically generates an ImperialDimensionField instance for each fields whose name starts with 'imperial_'
#         Automatically generates an MinMaxWeightField instance for each fields whose name starts with 'minmax_'
#         """
#         super(SeriesAdminForm, self).__init__(*args, **kwargs)

#         for field_name in self.fields:
#             if field_name.startswith('imperial_'):
#                 name = field_name[len('imperial_'):]
#                 feet_name = name + '_feet'
#                 inches_name = name + '_inches'
#                 label = self.fields[field_name].label
#                 self.fields[field_name] = ImperialDimensionField(label, getattr(self.instance, feet_name), getattr(self.instance, inches_name))

#             if field_name.startswith('minmax_'):
#                 name = field_name[len('minmax_'):]
#                 min_name = name + '_min'
#                 max_name = name + '_max'
#                 label = self.fields[field_name].label
#                 self.fields[field_name] = MinMaxWeightField(label, getattr(self.instance, min_name), getattr(self.instance, max_name))

#     def save(self, commit=True):
#         """
#         Automatically saves every fields whose name starts with 'imperial_' into the model fields named
#         <original_field + '_feet'>  and <original_field + '_inches'>
#         where original_field is the name of the field without the 'imperial_' prefix
#         """
#         instance = super(SeriesAdminForm, self).save(commit=commit)

#         for field in self.fields:
#             if field.startswith('imperial_'):
#                 name = field[len('imperial_'):]
#                 feet_name = name + '_feet'
#                 inches_name = name + '_inches'

#                 feet_value, inches_value = self.cleaned_data.pop(field)
#                 setattr(instance, feet_name, feet_value)
#                 setattr(instance, inches_name, inches_value)

#             if field.startswith('minmax_'):
#                 name = field[len('minmax_'):]
#                 min_name = name + '_min'
#                 max_name = name + '_max'

#                 min_value, max_value = self.cleaned_data.pop(field)
#                 setattr(instance, min_name, min_value)
#                 setattr(instance, max_name, max_value)

#         instance.save()

#         return instance

class SeriesAdminForm(forms.ModelForm):
    class Meta:
        model = Series
        fields = (
        'model',
        'code',
        'series_type',
        'production_unit',
        'name',
        'cost_price',
        'wholesale_price',
        'retail_price',
        'length_incl_aframe_mm',
        'length_incl_bumper_mm',
        'height_max_incl_ac_mm',
        'width_incl_awning_mm',
        'avg_tare_weight',
        'avg_ball_weight',
        # 'imperial_length_incl_aframe',
        # 'imperial_length_incl_bumper',
        # 'imperial_height_max_incl_ac',
        # 'imperial_width_incl_awning',
        # 'minmax_avg_tare',
        # 'minmax_avg_ball',
        'dealerships',
        )
        widgets = {
             'length_incl_aframe_mm': forms.NumberInput(attrs={'style': 'width: 100px'}),
             'length_incl_bumper_mm': forms.NumberInput(attrs={'style': 'width: 100px'}),
             'height_max_incl_ac_mm': forms.NumberInput(attrs={'style': 'width: 100px'}),
             'width_incl_awning_mm': forms.NumberInput(attrs={'style': 'width: 100px'}),
             'avg_tare_weight': forms.NumberInput(attrs={'style': 'width: 100px'}),
             'avg_ball_weight': forms.NumberInput(attrs={'style': 'width: 100px'}),
            }

class SeriesAdmin(admin.ModelAdmin):
    form = SeriesAdminForm

    list_display = (
        'code',
        'model',
        'name',
        'production_unit',
        'series_type',
    )

    list_filter = (
        'production_unit',
        'series_type',
    )
    ordering = ('model','name',)

    # fields = (
    #     'model',
    #     'code',
    #     'production_unit',
    #     'name',
    #     'cost_price',
    #     'wholesale_price',
    #     'retail_price',
    #     'length_incl_aframe_mm',
    #     'length_incl_bumper_mm',
    #     'height_max_incl_ac_mm',
    #     'width_incl_awning_mm',
    #     'avg_tare_weight',
    #     'avg_ball_weight',
    #     # 'imperial_length_incl_aframe',
    #     # 'imperial_length_incl_bumper',
    #     # 'imperial_height_max_incl_ac',
    #     # 'imperial_width_incl_awning',
    #     # 'minmax_avg_tare',
    #     # 'minmax_avg_ball',
    #     'dealerships',
    # )

    filter_horizontal = ('dealerships',)



class OrderedSeriesPhotoFilter(admin.SimpleListFilter):
    title = 'series'

    # Parameter for the filter that will be used in the URL query.
    parameter_name = 'series_id'

    def lookups(self, request, model_admin):

        data = set(
            (series_photo.series_id, str(series_photo.series))
            for series_photo in model_admin.get_queryset(request)
        )

        return sorted(data, key=lambda x: x[1])

    def queryset(self, request, queryset):
        series_id = request.GET.get(self.parameter_name)
        if series_id:
            return queryset.filter(series_id=series_id)
        return queryset


class PhotoSelectorWidget(CheckboxInput):
    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        # Django checks for the parameter _save to actually update the models.
        # This parameter is usually passed through the Save button.
        # Since we have disabled the Save button here, we need to manually add the element before submitting the form.
        attrs.update({'onChange': '$(this.form).append($("<input>").attr("type", "hidden").attr("name", "_save").val(true));this.form.submit()'})

        return super(PhotoSelectorWidget, self).render(name, value, attrs, renderer=renderer)


class SeriesPhotoChangelistForm(forms.ModelForm):
    is_main_photo = forms.BooleanField(widget=PhotoSelectorWidget, required=False)
    is_floor_plan = forms.BooleanField(widget=PhotoSelectorWidget, required=False)


class SeriesPhotoAdmin(admin.ModelAdmin):
    list_display = (
        'image_tag',
        'series',
        'is_main_photo',
        'is_floor_plan',
    )

    list_filter = (
        OrderedSeriesPhotoFilter,
    )

    list_editable = ('is_main_photo', 'is_floor_plan',)

    def get_changelist_form(self, request, **kwargs):
        return SeriesPhotoChangelistForm

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['hide_save'] = True
        return super(SeriesPhotoAdmin, self).changelist_view(request, extra_context=extra_context)

    def save_model(self, request, obj, form, change):
        if obj.is_main_photo:
            photos = SeriesPhoto.objects.filter(series=obj.series).exclude(id=obj.id)
            for photo in photos:
                photo.is_main_photo = False
                photo.save()
        if obj.is_floor_plan:
            photos = SeriesPhoto.objects.filter(series=obj.series).exclude(id=obj.id)
            for photo in photos:
                photo.is_floor_plan = False
                photo.save()
        obj.save()

    search_fields = ['series__name', 'series__model__name']


class SKUAdmin(admin.ModelAdmin):
    list_display = (
        'image_tag',
        'code',
        'name',
    )
    search_fields = ['name', 'code']

    # Redefining ordering of categories
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "sku_category":
            kwargs['queryset'] = SKUCategory.objects_for_choices(leaf_nodes_only=True)

        return super(SKUAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)


class IncludeNotUsedListFilter(admin.SimpleListFilter):
    title = 'availability'

    # Parameter for the filter that will be used in the URL query.
    parameter_name = 'available'

    def lookups(self, request, model_admin):
        return (
            ('true', 'Only Available'),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.exclude(availability_type=SeriesSKU.AVAILABILITY_NOT_USED)
        return queryset


class SeriesSKUAdmin(admin.ModelAdmin):
    list_filter = (
        IncludeNotUsedListFilter,
        ('sku', admin.RelatedOnlyFieldListFilter),
    )

    list_display = (
        'series',
        'sku_code',
        'sku_name',
        'availability_type',
    )

    def sku_code(self, obj):
        return obj.sku.code
    sku_code.short_description = 'SKU Code'
    sku_code.admin_order_field = 'sku__code'

    def sku_name(self, obj):
        return obj.sku.name
    sku_name.short_description = 'SKU Name'
    sku_name.admin_order_field = 'sku__name'

    search_fields = ['series__name', 'sku__name', 'series__model__name']

    def get_search_results(self, request, queryset, search_term):
        """
        Returns results where each word of the search_term is contained in only one of the search_fields
        """
        if not search_term:
            return queryset, False

        query = Q()

        for search_field in self.get_search_fields(request):

            inner_query = Q()
            for word in search_term.split():
                querystring = '{}__icontains'.format(search_field)
                inner_query = inner_query & Q(**{querystring: word})

            query = query | inner_query

        return queryset.filter(query), False


class SKUCategoryListFilter(admin.filters.RelatedFieldListFilter):
    def field_choices(self, field, request, model_admin):
        return [(category.id, category) for category in SKUCategory.objects_for_choices()]


class SKUCategoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'parent',
        'name',
        'print_order',
        'screen_order',
    )

    list_editable = (
        'name',
        'print_order',
        'screen_order',
    )

    list_filter = (
        'name',
        ('parent', SKUCategoryListFilter),
    )

    search_fields = (
        'name',
    )

    list_select_related = ['__'.join(['parent'] * (settings.MAX_CATEGORY_DEPTH))]

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "parent":
            kwargs['queryset'] = SKUCategory.objects_for_choices(leaf_nodes_only=False)

        return super(SKUCategoryAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)


# admin.site.register(UOM)
admin.site.register(Model, ModelAdmin)
admin.site.register(Series, SeriesAdmin)
admin.site.register(SeriesPhoto, SeriesPhotoAdmin)
admin.site.register(SKUCategory, SKUCategoryAdmin)
admin.site.register(SKU, SKUAdmin)
# admin.site.register(LabourType)
# admin.site.register(SKULabour)
# admin.site.register(RawMaterial)
admin.site.register(Rule, RuleAdmin)
admin.site.register(SeriesSKU, SeriesSKUAdmin)
# admin.site.register(Supplier)

readonly_fields = (
    'image_tag',
)
