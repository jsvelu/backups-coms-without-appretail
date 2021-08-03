import calendar
import codecs
from datetime import datetime
import random
import string
import subprocess
import tempfile
import threading
import time
import os
import io
from random import random
from django.core.files.storage import default_storage

from django.conf import settings
from django.http.response import HttpResponse
from django.http import FileResponse
from django.urls import include, path
from django.conf import settings
from django.template.loader import get_template
from wsgiref.util import FileWrapper

from django.utils import timezone
import django_tables2 as tables
from filebrowser.sites import site
import unicodecsv as csv

from newage.context import newage_print_context
from django.core.mail import send_mail
from django.core.mail import EmailMessage

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
        print ('Entered Render Printable')
        wkhtmltopdf_defaults = {
            "orientation": "portrait",
            "dpi": "300",
            "margin-right": "0",
            "margin-top": "0",
            "margin-bottom": "0",
            "margin-left": "0",
        }

        template = get_template(template_name)
        print ('inside render_printable')
        print ('template ',template)
        wkhtmltopdf_options = wkhtmltopdf_defaults.copy()
        if pdf_options:
            wkhtmltopdf_options.update(pdf_options)

        template_context = newage_print_context()
        template_context.update({
            'file_path_mode': 'URL' if is_html else 'DATA',  # needed because wkhtmltopdf needs local paths to images
            'is_html': is_html,
        })
        
        template_context.update(context_data)
        
        print('Test data ' , context_data)
        
        is_html = False

        if is_html:
            print('is html test')
            # pdfkit.from_file(template.render(template_context), 'micro.pdf')

            return HttpResponse(template.render(template_context), content_type="text/html")

        print('Before Reading Writing ')
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
            except Exception as e:
                print('Error This ',e)
                raise
            # Re-open the file, as it won't be the same handle as outf.  (We
            # use NamedTemporaryFile with outf just to get a new, unique name.)

            
            with open(outf.name, 'rb') as resultf:
                pdf = resultf.read()
            
            test1 = open('testme.pdf','wb')      
            with open(outf.name,'rb') as resultf:
                test1.write(pdf)
            
            # with open(outf.name, 'r') as resultf:
            #     response = HttpResponse(resultf.read(),content_type='application/pdf')
            #     response['Content-Disposition'] = 'filename=some_file.pdf'
            # return response
            # resultf.closed

                # pdf['Content-Disposition'] = 'attachment; filename="pdf1"'
        # print(pdf)        
            
            # resultf.save(MEDIA_URL + '12.pdf')

        print ('completed reading') 
        # print('filenames')
        print(outf.name, ' : ', resultf , ' : ' , test1 , " : " , test1.name)

        # with fs.open(outf.name) as pdf:
        #     response = HttpResponse(pdf, content_type='application/pdf')
        #     response['Content-Disposition'] = 'inline; filename="testme.pdf"'

        #     subject = 'Welcome to Project Management Portal.'
        #     message = 'Thank you for being part of us. \n We are glad to have you. \n Regards \n Team Project Management'
        #     # message.attach = 'filename="mypdf.pdf", content_disposition="inline", data=open("mypdf.pdf", "rb")'
        #     from_email = settings.EMAIL_HOST_USER
        #     to_list = [request.user.email, settings.EMAIL_HOST_USER]
        #     # send_mail(subject, message, message.attach, from_email, to_list)

        #     message = EmailMessage(subject, message, from_email, to_list)
        #     # pdf = open('media/mypdf.pdf', 'rb')
        #     message.attach_file('media/mypdf.pdf')
        #     message.send()

        #     return response
        # time.sleep(5)
        # file=io.open(pdf, "rb", buffering = 0)
        # f1=io.BytesIO(pdf)

        f1 = memoryview(pdf)
        # print (f1)
        # file_name = default_storage.save('test1.pdf', pdf)

        # buffer = io.StringIO()
        # doc = SimpleDocTemplate(buffer, pagesize=letter)
        # Document = []

        # CRUFT PDF Data
        # doc.build(Document)
        # pdf = buffer.getvalue()
        # buffer.close()

        print('MEDIA : ' , settings.MEDIA_ROOT, 'SITE',   settings.SITE_NAME, ' PROJECT dir', settings.PROJECT_DIR , ' site dir ',site.directory  )
        try:

            msg = EmailMessage("My Test ", "Invoice ", 'New Age Caravans<Annesley.Greig@newagecaravans.com.au>',to=["gvelu4@gmail.com"])

            # working
            msg.attach('12.pdf', pdf ,'application/pdf')

            msg.content_subtype = "html"
            
        except Exception as e:
            print ('Error Sending Attachments ', e)
            raise
        finally:
                # return FileResponse(f1, as_attachment=True, filename='hello.pdf')


            msg.send()
        
        # return FileResponse(pdf, as_attachment=True, filename='hello.pdf')
        # response = HttpResponse(pdf,content_type='application/pdf')
        # response['Content-Disposition'] = 'attachment; filename="somefilename.pdf"'
        # response.write (somefilename.pdf)
        # working
        # pdf.seek(0)
        buffer = io.BytesIO(pdf)
        # return HttpResponse(FileWrapper(pdf), content_type='application/pdf')
        # return HttpResponse(pdf, content_type='application/octet-stream')
        return buffer.getvalue()

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
