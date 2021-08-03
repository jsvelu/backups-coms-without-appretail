import calendar
import codecs
from datetime import datetime
import random
import string
import subprocess
import tempfile
import threading
import time

from django.conf import settings
from django.http.response import HttpResponse
from django.template.loader import get_template
from django.utils import timezone
import django_tables2 as tables
import unicodecsv as csv

from newage.context import newage_print_context


#zawar 2015-12-16: this doesn't generate unique strings, although chances of collision are extremely rare
#consider using a uuid (the uuid4 variant): https://docs.python.org/2/library/uuid.html
def generate_random_str(str_len=32):
    thread_id = threading.current_thread().ident
    current_time = time.time()
    random.seed("{}_{}".format(thread_id, current_time))
    return ''.join([random.choice(string.ascii_letters + string.digits) for n in range(str_len)])


def subtract_one_month(in_date):
    new_month = 0
    new_year = in_date.year

    if in_date.month > 1:
        new_month = in_date.month - 1
    else:
        new_month = 12
        new_year = in_date.year - 1

    dt1 = datetime(year=new_year, month=new_month, day=in_date.day).date()
    return dt1


def add_one_month(in_date):
    new_month = 0
    new_year = in_date.year

    if in_date.month < 12:
        new_month = in_date.month + 1
    else:
        new_month = 1
        new_year = in_date.year + 1

    dt1 = datetime(year=new_year, month=new_month, day=in_date.day).date()
    return dt1


def next_month_first(in_date):
    new_month = 0
    new_year = in_date.year

    if in_date.month < 12:
        new_month = in_date.month + 1
    else:
        new_month = 1
        new_year = in_date.year + 1

    dt1 = datetime(year=new_year, month=new_month, day=1).date()
    return dt1


def month_end_date(in_date):
    last_day = calendar.monthrange(in_date.year, in_date.month)[1]
    dt1 = datetime(year=in_date.year, month=in_date.month, day=last_day).date()
    return dt1


class NewageTable(tables.Table):
   class Meta:
       #  use a regular dash instead of emdash for better CSV compatibility
       default = '-'


class PrintableMixin(object):
    # This is only needed in production for the WebKit rendering, Macs run fine without it
    has_xvfb = subprocess.call(["which", "xvfb-run"]) == 0

    def render_printable(self, is_html, template_name, context_data, pdf_options=None, header_template=None):
        """
        Renders the requested template for printing
        :param is_html: Whether to display as HTML or render as PDF
        :param template_name: The template file to be rendered
        :param context_data: The context dictionary to be passed to the template file
        :param pdf_options: Options to be passed to wkhtmltopdf as command-line args, overriding the defaults. Note that option name is without the double dash
        :param header_template: An optional header template file (uses the same context)
        :return:
        """
        wkhtmltopdf_defaults = {
            "orientation": "portrait",
            "dpi": "300",
            "margin-right": "0",
            "margin-top": "0",
            "margin-bottom": "0",
            "margin-left": "0",
        }

        template = get_template(template_name)

        wkhtmltopdf_options = wkhtmltopdf_defaults.copy()
        if pdf_options:
            wkhtmltopdf_options.update(pdf_options)

        template_context = newage_print_context()
        template_context.update({
            'file_path_mode': 'URL' if is_html else 'DATA',  # needed because wkhtmltopdf needs local paths to images
            'is_html': is_html,
        })
        template_context.update(context_data)

        if is_html:
            return HttpResponse(template.render(template_context), content_type="text/html")

        with tempfile.NamedTemporaryFile(suffix='.html') as inf, tempfile.NamedTemporaryFile(suffix='.pdf') as outf, tempfile.NamedTemporaryFile(suffix='.html') as header:
            inf.write(template.render(template_context).encode('utf-8'))
            inf.flush()

            if header_template:
                header.write(get_template(header_template).render(template_context).encode('utf-8'))
                header.flush()

            argv = [
                "wkhtmltopdf",
                "--quiet",
            ]
            for key, value in list(wkhtmltopdf_options.items()):
                argv.append("--{}".format(key))
                argv.append(value)
            if header_template:
                argv.append("--header-html")
                argv.append(header.name)
            argv.append(inf.name)
            argv.append(outf.name)
            if self.has_xvfb:
                argv = ["xvfb-run", "-a", "--server-args=-screen 0, 1024x768x24"] + argv
            try:
                # subprocess.check_call(argv)
                subprocess.call(argv)
            except OSError as ose:
                return HttpResponse("Unable to print PDF: {}".format(ose.message), content_type="text/html")

            # Re-open the file, as it won't be the same handle as outf.  (We
            # use NamedTemporaryFile with outf just to get a new, unique name.)
            with open(outf.name, 'rb') as resultf:
                pdf = resultf.read()

            response = HttpResponse(pdf, content_type='application/pdf')
            # # content = "attachment;" 
            # response['Content-Disposition'] = content
        return response
        # return HttpResponse(pdf, content_type='application/pdf',response['Content-Disposition'] = 'attachment')


    def render_image(self, is_html, template_name, context_data, image_options=None, header_template=None):
        """
        Renders the requested template for printing
        :param is_html: Whether to display as HTML or render as PDF
        :param template_name: The template file to be rendered
        :param context_data: The context dictionary to be passed to the template file
        :param image_options: Options to be passed to wkhtmltoimage as command-line args, overriding the defaults. Note that option name is without the double dash
        :param header_template: An optional header template file (uses the same context)
        :return:
        """
        wkhtmltoimage_defaults = {
            "format": "jpeg",
        }

        template = get_template(template_name)

        wkhtmltoimage_options = wkhtmltoimage_defaults.copy()
        if image_options:
            wkhtmltoimage_options.update(image_options)

        template_context = newage_print_context()
        template_context.update({
            'file_path_mode': 'URL' if is_html else 'LOCAL',
            'is_html': is_html,
        })
        template_context.update(context_data)

        if is_html:
            return HttpResponse(template.render(template_context), content_type="text/html")

        with tempfile.NamedTemporaryFile(suffix='.html') as inf, tempfile.NamedTemporaryFile(suffix='.jpg') as outf, tempfile.NamedTemporaryFile(suffix='.html') as header:
            inf.write(template.render(template_context).encode('utf-8'))
            inf.flush()

            if header_template:
                header.write(get_template(header_template).render(template_context).encode('utf-8'))
                header.flush()

            argv = [
                "wkhtmltoimage",
                "--quiet",
            ]
            for key, value in list(wkhtmltoimage_options.items()):
                argv.append("--{}".format(key))
                argv.append(value)
            if header_template:
                argv.append("--header-html")
                argv.append(header.name)
            argv.append(inf.name)
            argv.append(outf.name)

            if self.has_xvfb:
                argv = ["xvfb-run", "-a", "--server-args=-screen 0, 1024x768x24"] + argv

            try:
                subprocess.call(argv)
            except OSError as ose:
                return HttpResponse("Unable to print Image: {}".format(ose.message), content_type="text/html")

            # Re-open the file, as it won't be the same handle as outf.  (We
            # use NamedTemporaryFile with outf just to get a new, unique name.)
            with open(outf.name, 'rb') as resultf:
                pdf = resultf.read()

        return HttpResponse(pdf, content_type='image/jpeg')


class ExportCSVMixin(object):

    def get_file_name(self):
        raise NotImplementedError('get_file_name() must be implemented')

    def get_rows(self, table=None):
        raise NotImplementedError('get_rows() must be implemented')

    def get_headers(self, table=None):
        raise NotImplementedError('get_headers() must be implemented')

    def convert_date_time_to_local(self, date_time):
        try:
            # if this is a datetime then use the correct timezone
            date_time = timezone.localtime(date_time)
        except AttributeError:
            pass
        else:
            date_time = date_time.strftime(settings.FORMAT_DATE_ISO)

        return date_time

    def get_complete_file_name(self):
        return "{0} - {1}".format(self.get_file_name(), timezone.now().strftime(settings.FORMAT_DATETIME_ONEWORD))

    def get_raw_data(self, table=None):
        headers = self.get_headers(table)
        rows = self.get_rows(table)
        response = [headers, rows]
        #response = HttpResponse(json.dumps([headers, rows]), content_type="application/json")
        return response

    def write_csv(self, table=None):
        headers = self.get_headers(table)
        rows = self.get_rows(table)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="{}.csv"'.format(self.get_complete_file_name())
        response.write(codecs.BOM_UTF8)

        writer = csv.writer(response, encoding='utf-8')
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
        return response
