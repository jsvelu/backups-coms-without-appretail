
from django.forms.fields import IntegerField
from django.forms.fields import MultiValueField
from django.forms.widgets import MultiWidget
from django.forms.widgets import TextInput
from django.template.loader import get_template


class DoubleValueDimensionWidget(MultiWidget):
    """
    A Widget that displays a dimension in imperial
    """

    placeholder_one = ''
    after_value_one = ''

    placeholder_two = ''
    after_value_two = ''

    def __init__(self, attrs=None):
        _widgets = (
            TextInput(attrs=attrs),
            TextInput(attrs=attrs),
        )

        super(DoubleValueDimensionWidget, self).__init__(_widgets, attrs)

    def decompress(self, value):
        """
        Returns a list of decompressed values for the given compressed value.
        The given value can be assumed to be valid, but not necessarily
        non-empty.

        This widget is meant to be used with a list a values as input and output, so no transformation is required.
        """

        return value

    def render(self, name, value, attrs=None, renderer=None):
        return get_template('caravans/widgets/double_dimension.html').render(
            {
                'name': name,
                'value_one': value[0],
                'placeholder_one': self.placeholder_one,
                'after_value_one': self.after_value_one,
                'value_two': value[1],
                'placeholder_two': self.placeholder_two,
                'after_value_two': self.after_value_two,
            }
        )

    def value_from_datadict(self, data, files, name):
        """
        Data is the POST data dictionary coming from the request on save.
        The value returned will be passed back to field.compress() after validation
        """
        result = [data.get(name + '_one'), data.get(name + '_two')]
        return result


class DoubleValueDimensionField(MultiValueField):
    """
    The field to use with an ImperialDimensionWidget
    """
    widget = DoubleValueDimensionWidget

    def __init__(self, label, value_one, value_two, *args, **kwargs):
        initial_values = [value_one, value_two]

        fields = (
            IntegerField(),
            IntegerField(),
        )

        super(DoubleValueDimensionField, self).__init__(fields, required=False, label=label, initial=initial_values, *args, **kwargs)

    def compress(self, data_list):
        """
        Returns a single value for the given list of values. The values can be
        assumed to be valid.

        For example, if this MultiValueField was instantiated with
        fields=(DateField(), TimeField()), this might return a datetime
        object created by combining the date and time in data_list.


        This widget it meant to be used with a list a values as input and output, so no transformation is required.
        """
        if len(data_list) != 2:
            data_list = [None, None]
        return data_list


class ImperialDimensionWidget(DoubleValueDimensionWidget):

    placeholder_one = 'Feet'
    after_value_one = 'ft'

    placeholder_two = 'Inches'
    after_value_two = 'in'


class ImperialDimensionField(DoubleValueDimensionField):
    widget = ImperialDimensionWidget


class MinMaxWeightWidget(DoubleValueDimensionWidget):

    placeholder_one = 'Min'
    after_value_one = '&mdash;'

    placeholder_two = 'Max'
    after_value_two = 'kg'


class MinMaxWeightField(DoubleValueDimensionField):
    widget = MinMaxWeightWidget
