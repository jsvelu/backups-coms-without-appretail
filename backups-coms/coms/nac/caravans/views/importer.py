import os
from os import mkdir
from os import path

from django.conf import settings
from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.views.generic import TemplateView
import xlrd

from caravans.forms import DocumentForm
from caravans.models import SKU
from caravans.models import SKUCategory
from caravans.models import Supplier

SHEET_MAPPING = {
    'order_source': 0,
    'code': 1,
    'description': 2,
    'public_description': 3,
    'category': 4,
    'department': 5,
    'visible': 6,
    'unit': 7,
    'qty': 8,
    'cost_price_inc': 9,
    'wholesale_cost_inc': 10,
    'retail_cost_inc': 11,
    #'unit_cost_exc': 12,
    #'unit_cost_inc': 13,
    #'wholesale_cost_exc': 14,
    #'trade_cost_exc': 16,
    #'retail_cost_exc': 18,
}


def update_sku(current_sku, sku):
    current_sku.name = sku.get('description')
    current_sku.description = sku.get('description')
    current_sku.public_description = sku.get('public_description')
    current_sku.is_visible = sku.get('visible')
    current_sku.unit = sku.get('unit')
    current_sku.quantity = sku.get('qty') or 1
    current_sku.retail_price = sku.get('retail_cost_inc') or 0
    current_sku.wholesale_price = sku.get('wholesale_cost_inc') or 0
    current_sku.cost_price = sku.get('cost_price_inc') or 0
    current_sku.save()
    return current_sku


def create_sku(sku):
    top_category = SKUCategory.top()
    category = SKUCategory.objects.filter(parent=top_category, name=sku['category']).first()
    if category is None:
        category = SKUCategory()
        category.parent = top_category
        category.screen_order = 0
        category.print_order = 0
        category.name = sku['category']
        category.save()

    department = SKUCategory.objects.filter(parent__name=sku['category'], name=sku['department']).first()
    if department is None:
        department = SKUCategory()
        department.screen_order = 0
        department.print_order = 0
        department.parent = category
        department.name = sku['department']
        department.save()

    supplier_name = sku.get('order_source')
    supplier, created = Supplier.objects.get_or_create(
        name__iexact=supplier_name,
        defaults={'name': supplier_name})

    new_sku = SKU()
    new_sku.sku_category = department
    new_sku.code = sku.get('code')
    new_sku.supplier = supplier
    new_sku.name = sku.get('description')
    new_sku.description = sku.get('description')
    new_sku.public_description = sku.get('public_description', sku.get('description'))
    new_sku.is_visible = sku.get('visible')
    new_sku.unit = sku.get('unit')
    new_sku.quantity = sku.get('qty') or 1
    new_sku.retail_price = sku.get('retail_cost_inc') or 0
    new_sku.wholesale_price = sku.get('wholesale_cost_inc') or 0
    new_sku.cost_price = sku.get('cost_price_inc') or 0
    new_sku.save()
    return new_sku


def read_sku_file(filename, **kwargs):

    def lookup(values, key):
        return values[SHEET_MAPPING[key]]

    updates = kwargs.get('updates', {})
    sheet_index = 0

    skus = []
    read_log = []
    workbook = xlrd.open_workbook(filename)
    sheet = workbook.sheet_by_index(sheet_index)
    for row in range(1, sheet.nrows):
        values = sheet.row_values(row)
        sku = {key: lookup(values, key) for key in SHEET_MAPPING.keys()}
        sku['row'] = row

        def price(p):
            if isinstance(p, float):
                return p
            if isinstance(p, str):
                p = p.replace('$', '')
                if len(p.strip()) == 0:
                    return 0
                else:
                    return float(p)
            try:
                return float(p)
            except:
                return 0

        try:
            qty = float(sku['qty'])
        except ValueError:
            qty = 1

        if sku.get('qty'):
            sku['qty'] = qty
        if sku.get('visible'):
            sku['visible'] = sku['visible'].lower() == 'y' or sku['visible'].lower() == 'yes'
        if len(sku['order_source'].strip()) == 0:
            sku['order_source'] = 'Unknown'

        for field in (
            'unit_cost_exc',
            'unit_cost_inc',
            'wholesale_cost_exc',
            'wholesale_cost_inc',
            'cost_price_exc',
            'cost_price_inc',
            'trade_cost_inc',
            'retail_cost_exc',
            'retail_cost_inc',
        ):
            if sku.get(field):
                sku[field] = price(sku[field])

        # Look for a current/existing SKU with this code

        current = SKU.objects.filter(
            sku_category__name=sku['department'],
            sku_category__parent__name=sku['category'],
            code=sku['code'],
            description=sku['description'],
            quantity=qty)

        if len(current) == 0:
            if '%s,%s' % (row, sku['code']) in updates:
                new_sku = create_sku(sku)
                sku['current'] = new_sku
                sku['status'] = 'new'
                read_log.append({
                    'line': row,
                    'message': "Created SKU: %s" % new_sku,
                })
        elif len(current) == 1:
            current_sku = current.first()
            sku['current'] = current_sku
            if '%s,%s' % (row, sku['code']) in updates:
                updated_sku = update_sku(current_sku, sku)
                sku['status'] = 'updated'
                read_log.append({
                    'line': row,
                    'message': "Updated SKU: %s" % updated_sku,
                })
        elif len(current) > 1:
            read_log.append({
                'line': row,
                'message': "Found %s SKU's with code: %s" % (len(current), sku['code']),
            })
        skus.append(sku)

    return (skus, read_log)


class SKUImportView(TemplateView):
    IMPORT_PATH = path.join(settings.MEDIA_ROOT, 'sku_import')
    template_name = 'caravans/sku_import.html'

    def file_full_path(self, filename):
        return '%s/%s' % (self.IMPORT_PATH, filename)

    def post(self, request, **kwargs):

        if request.POST.get('action', '') == 'Upload':
            form = DocumentForm(request.POST, request.FILES)
            if form.is_valid():
                filename = "%s_%s" % (request.FILES['docfile'], timezone.now().strftime(settings.FORMAT_DATETIME_ONEWORD))
                if not path.exists(self.IMPORT_PATH):
                    mkdir(self.IMPORT_PATH)
                with open(self.file_full_path(filename), 'wb+') as destination:
                    for chunk in request.FILES['docfile'].chunks():
                        destination.write(chunk)
                    return HttpResponseRedirect(reverse('caravans:sku_import', kwargs={'file':filename}))

        elif request.POST.get('action', '') == 'Update':
            sku_imports = set()
            for key, val in request.POST.items():
                if key.startswith('update-'):
                    sku_imports.add(key.split('update-')[1])
            result = read_sku_file(self.file_full_path(self.kwargs.get('file')), updates=sku_imports)
            context = super(SKUImportView, self).get_context_data(**self.kwargs)
            form = DocumentForm()
            context['upload_form'] = form
            context['skus'] = result[0]
            context['import_log'] = result[1]
            context['filename'] = self.kwargs.get('file')
            return self.render_to_response(context)

        elif request.POST.get('action', '') == 'update_images':
            image_files = request.FILES.getlist('image_directory')

            images_updated_count = 0
            total_sku_count = len(SKU.objects.all())
            skus_with_images_and_matches_count = 0
            images_without_matches_count = 0

            for image_file in image_files:
                code_part = os.path.splitext(image_file.name)[0]
                matching_skus = SKU.objects.filter(code=code_part)

                if len(matching_skus) == 0:
                    images_without_matches_count += 1
                else:
                    for matching_sku in matching_skus:
                        if matching_sku.photo.name == '':
                            matching_sku.photo.save(image_file.name, image_file)
                            images_updated_count += 1
                        else:
                            skus_with_images_and_matches_count += 1

            skus_still_without_images_count = len(SKU.objects.filter(photo__exact=''))
            skus_with_images_and_no_matches_count = total_sku_count - skus_still_without_images_count -\
                                                    images_updated_count - skus_with_images_and_matches_count


            messages.add_message(request, messages.INFO, str(len(image_files)) + " images found and processed")
            messages.add_message(request, messages.INFO, str(total_sku_count) + " SKUs available in the system")
            messages.add_message(request, messages.INFO, str(images_updated_count) +
                                 " SKUs were updated with new images based on SKU code match")
            messages.add_message(request, messages.INFO, str(skus_still_without_images_count) +
                                 " SKUs still don't have any images")

            messages.add_message(request, messages.INFO, str(skus_with_images_and_no_matches_count) +
                                 " SKUs already had images and no matches were found")

            messages.add_message(request, messages.INFO, str(skus_with_images_and_matches_count) +
                                 " SKUs already had images and matches were found (no updates applied)")
            messages.add_message(request, messages.INFO, str(images_without_matches_count) +
                                 " images had no matching SKUs")

        return HttpResponseRedirect(reverse('caravans:sku_import', kwargs={'file':''}))

    def get_context_data(self, **kwargs):
        context = super(SKUImportView, self).get_context_data(**kwargs)
        form = DocumentForm()
        context['upload_form'] = form
        if kwargs.get('file'):
            import_result = read_sku_file(self.file_full_path(kwargs['file']))
            context['skus'] = import_result[0]
            context['import_log'] = import_result[1]
            context['filename'] = kwargs.get('file')
        return context
