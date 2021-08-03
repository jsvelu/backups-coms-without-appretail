from django.views.generic.base import View

from caravans.models import SKU
from newage.utils import ExportCSVMixin


class SKUExportView(ExportCSVMixin, View):

    def get_file_name(self):
        return 'SKU_Export'

    def get_headers(self, table=None):
        headers = [
            'Name',
            'Description',
            'Department',
            'Retail Price',
            'Wholesale Price',
            'Cost Price',
            'Supplier',
            'Code',
            'Quantity',
            'Visible on specsheet',
            'Unit',
            'Public Description',
            'Contractor Description 1',
            'Contractor Description 2',
            'Contractor Description 3',
            'Contractor Description 4',
            'Contractor Description 5',
        ]
        return headers

    def get_rows(self, table=None):
        rows = [
            [
                sku.name,
                sku.description,
                sku.sku_category.name if sku.sku_category else '',
                str(sku.retail_price) if sku.retail_price is not None else '',
                str(sku.wholesale_price) if sku.wholesale_price is not None else '',
                str(sku.cost_price) if sku.cost_price is not None else '',
                sku.supplier.name if sku.supplier else '',
                sku.code if sku.code else '',
                str(sku.quantity) if sku.quantity else '',
                'TRUE' if sku.is_visible else 'FALSE',
                sku.unit if sku.unit else '',
                sku.public_description if sku.public_description else '',
                sku.contractor_description1 if sku.contractor_description1 else '',
                sku.contractor_description2 if sku.contractor_description2 else '',
                sku.contractor_description3 if sku.contractor_description3 else '',
                sku.contractor_description4 if sku.contractor_description4 else '',
                sku.contractor_description5 if sku.contractor_description5 else '',
            ]
            for sku in SKU.objects.all()
            ]
        return rows

    def get(self, request):
        return self.write_csv()
