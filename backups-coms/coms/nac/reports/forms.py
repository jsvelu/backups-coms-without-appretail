import time

from django.utils import timezone
import floppyforms as forms

from newage import utils


class ReportViewerForm(forms.Form):
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        today = timezone.now().date()

        start_date = kwargs.pop('start_date', None)
        if start_date is None:
            start_date = utils.subtract_one_month(today) #month ago

        end_date = kwargs.pop('end_date', None)
        if end_date is None:
            end_date = today

        report_names = []
        if self.user.has_perm('reports.view_sales_breakdown'):
            report_names.append({'code': 'sales_break_up', 'name': "Sales Breakup Report"})

        report_names.append({'code': 'warranty_response_time', 'name': "Warranty Approved to Closed Time"})
        report_names.append({'code': 'lead_count_breakup', 'name': "Lead Breakdown"})

        report_type = kwargs.pop('report_type', None)
        if report_type is None:
            report_type = report_names[0]['code']

        super(ReportViewerForm, self).__init__(*args, **kwargs)
        self.fields['start_date'] = forms.DateField(label='Start Date', required=True, initial=start_date)
        self.fields['end_date'] = forms.DateField(label='End Date', required=True, initial=end_date)
        self.fields['report_type'] = forms.ChoiceField(label='Report Type', required=True, choices=[(rt['code'], rt['name']) for rt in report_names])
        self.fields['report_type'].initial = [report_type]
