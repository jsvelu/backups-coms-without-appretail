from django import forms
from django_select2.forms import Select2MultipleWidget


class CrmFilterWidget(Select2MultipleWidget):

    def render(self, name, value, attrs=None):
        self.attrs.setdefault('data-placeholder', 'Please select')
        self.attrs.setdefault('data-allow-clear', False)
        self.attrs.setdefault('data-width', 'element')

        html = super(Select2MultipleWidget, self).render(name, value, attrs)

        widget_html = """
        <div class="select2-widget">
            <div class="select2-select-btn-grp">
                <button type="button" class="select2-select-btn select2-select-btn-all" data-select-name="{0}">Select All</button>
                <button type="button" class="select2-select-btn select2-select-btn-none" data-select-name="{0}">Select None</button>
            </div>
            {1}
        </div>
        """.format(name, html)

        return widget_html
