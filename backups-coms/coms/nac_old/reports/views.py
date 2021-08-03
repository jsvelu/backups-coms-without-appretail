

import collections
from datetime import datetime
from decimal import Decimal
from datetime import date
import functools
import time
import json
<<<<<<< HEAD
import csv
import re
=======

>>>>>>> 575bd8a765bd5644985e00363a0b1881eb80e817

from django.conf import settings
from django.utils import timezone
from django.views.generic.base import TemplateView
from django.views.generic.base import View
from django.urls import reverse
from django.shortcuts import redirect
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework.response import Response
from django.template import loader
from django.shortcuts import render
from django.core.mail import send_mail
from django.core.mail import EmailMessage
from rest_framework.generics import get_object_or_404
from rules.contrib.views import PermissionRequiredMixin

from caravans.models import Series
from caravans.models import SeriesSKU
from dealerships.models import Dealership
from newage.utils import ExportCSVMixin
from orders.models import Order
from orders.models import OrderSKU
from orders.models import Show
from caravans.models import Model
from production.models import Build
from reports.models import PriceAuditCapture

from smtplib import SMTPException

from smtplib import SMTPException

from .rules import get_user_reports_dealerships
from .rules import get_model_series_id


SECONDS_PER_DAY = 24*60*60
SELECTIONS_DAYS_UNRESOLVED = 7
SALESREPORT_DEALERSHIP_ID_ALL = -1



class ReportsIndexView(PermissionRequiredMixin, TemplateView):
    template_name = 'reports/index.html'
    permission_required = 'reports.view_reports_page'

    def get_context_data(self, **kwargs):
        data = super(ReportsIndexView, self).get_context_data(**kwargs)
        data['shows'] = [
            {
                'id': show.id,
                'name': show.name,
            }
            for show in Show.objects.all()
        ]

        user = self.request.user
        models = get_model_series_id(user)

        data['models'] = [
            {
                'id': model.id,
                'name': model.name,
            }
            for model in models

        ]

        
        
        user = self.request.user

        dealerships = get_user_reports_dealerships(user)

        data['dealerships'] = [
            {
                'id': dealership.id,
                'name': dealership.name,
            }
            for dealership in dealerships
        ]

        if user.has_perm('reports.view_sales_breakdown_all'):
            data['dealerships'].append({'id': SALESREPORT_DEALERSHIP_ID_ALL, 'name': 'All Dealerships'})
        
        data['current_user'] = user.get_username()
        # current_user =[{'this_user':request.user.get_username(),}]
<<<<<<< HEAD
        # print(data['current_user'] )
=======
        
>>>>>>> 575bd8a765bd5644985e00363a0b1881eb80e817
        data['can_export_invoice'] = user.has_perm('reports.view_invoice_report')
        data['can_export_runsheet'] = user.has_perm('reports.export_runsheet')
        data['can_export_sales_any'] = user.has_perm('reports.view_sales_breakdown_all')
        data['can_export_sales_user'] = user.has_perm('reports.view_sales_breakdown_own')
        data['can_export_colorsheet'] = user.has_perm('reports.export_colorsheet')
        data['can_view_series_pricelist_all'] = user.has_perm('reports.view_series_pricelist_all')
        data['can_upload_vin_number'] = user.has_perm('reports.upload_vin_numbers')
        data['can_upload_series_pricelist'] = user.has_perm('reports.upload_series_pricelist')

        return data


class InvoiceView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_invoice_report'

    def get_orders(self):
        date_from = datetime.strptime(self.date_from, settings.FORMAT_DATE_DATEPICKER_DASH_FMT).date()
        date_to = datetime.strptime(self.date_to, settings.FORMAT_DATE_DATEPICKER_DASH_FMT).date()

        date_to = datetime.combine(date_to, datetime.max.time())  # get all orders of that same day

        if self.type == 'production_date':
            orders = (Order.objects
                .filter(
                build__build_date__gte=date_from,
                build__build_date__lte=date_to,
                order_cancelled__isnull=True,
            )
                .order_by('id')
                .select_related(
                'customer__physical_address__suburb__post_code__state',
                'orderseries',
                'orderseries__series',
                )
            )
        else:
            orders = (Order.objects
                .filter(
                order_submitted__gte=date_from,
                order_submitted__lte=date_to,
                order_cancelled__isnull=True,
            )
                .order_by('id')
                .select_related(
                'customer__physical_address__suburb__post_code__state',
                'orderseries',
                'orderseries__series',
                )
            )
        orders = [order for order in orders if not order.is_quote()]
        return orders

    def get_order_items(self, order):
        def get_wholesale_price(order_sku):
            # When order is finalised, use the wholesale price recorded against the OrderSku object, otherwise the actual sku wholesale price
            if order.get_finalization_status() == Order.STATUS_APPROVED:
                return order_sku.wholesale_price or 0
            return order_sku.sku.wholesale_price or 0

        # Special features
        def get_special_feature_display(special_feature):
            # result = special_feature.customer_description or '[No Customer Description]'
            result = special_feature.factory_description or '[No Factory Description]'
            # if special_feature.factory_description:
                # result += ', ' + special_feature.factory_description
            return result


        # Base price
        items = [
            {
                'type': 'Standard',
                'name': 'Base price',
                'wholesale_price': order.orderseries.wholesale_price if hasattr(order, 'orderseries') and order.orderseries.wholesale_price else 0,
                'retail_price': order.orderseries.retail_price if hasattr(order, 'orderseries') and order.orderseries.retail_price else 0,
            }
        ]

        items += [
            {
                'type': 'Price adjustment',
                'name': order.price_adjustment_wholesale_comment or None,
                'wholesale_price': order.price_adjustment_wholesale or 0,
                'retail_price': order.price_adjustment_retail or 0,
            }
        ]
        # Options
        items += [
            {
                'type': 'Option',
                'name': osku.sku.public_description or osku.sku.description,
                'wholesale_price': get_wholesale_price(osku),
                'retail_price' : osku.retail_price or 0,
            } for osku in order.ordersku_set.filter(base_availability_type=SeriesSKU.AVAILABILITY_OPTION)
        ]

        items += [
            {
                'type': 'Upgrade' if (osku.sku.wholesale_price if osku.sku.wholesale_price else 0) > 0 else 'Downgrade',
                'name': osku.sku.public_description,
                'wholesale_price': get_wholesale_price(osku),
                'retail_price' : osku.retail_price or 0,
            } for osku in order.ordersku_set.filter(base_availability_type=SeriesSKU.AVAILABILITY_UPGRADE)
        ]

        # Special feature
        items += [
            {
                'type': 'Special Feature',
                'name': get_special_feature_display(special),
                'wholesale_price': special.wholesale_price or 0,
                'retail_price': special.retail_price or 0,
            } for special in order.specialfeature_set.all()
        ]

        return items

    def get_headers(self, table=None):
        headers = [
            'Option / Special Feature',
            'SKU Name',
            'Chassis no / Order no',
            'Series',
            'Dealership',
            'Customer Name',
            'Whole Sale Price',
            'Retail Price',
            'Postcode',
            'Show',
            'Sales Person',
            'Production Date',
            'Order Placed Date',
        ]
        return headers

    def get_order_rows(self, order):
        items = self.get_order_items(order)

        order_rows = [
            [item['type'],
             item['name'],
             order.chassis if order.chassis else 'Order #' + str(order.id),
             order.orderseries.series.code if hasattr(order, 'orderseries') else '',
             order.dealership if order.dealership else '',
             order.customer.first_name + ' ' + order.customer.last_name if order.customer else '(Stock)',
             item['wholesale_price'],
             item['retail_price'],
             order.customer.physical_address.suburb.post_code.number if order.customer and order.customer.physical_address else '',
             order.show.name if order.show else '',
             order.dealer_sales_rep.get_full_name(),
             self.convert_date_time_to_local(order.build.build_date) if order.build else '',
             self.convert_date_time_to_local(order.order_submitted) if order.order_submitted else '',
             ]
            for item in items
        ]

        return order_rows

    def get_rows(self, table=None, id=None):
        orders = self.get_orders()

        rows = []
        for order in orders:
            rows += self.get_order_rows(order)

        return rows

    def get_file_name(self):
        return 'Invoice for '

    def get_complete_file_name(self):
        return '{0}{1} {2} - {3}'.format(self.get_file_name(), self.type, self.date_from, self.date_to)

    def get(self, request, * args, **kwargs):
        self.type = kwargs['type']
        self.date_from = kwargs['date_from']
        self.date_to = kwargs['date_to']
        return self.write_csv()


class VinImport(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_invoice_report'
    template_name = 'reports/display_vin_data.html'

    def post(self, request):
        # print('Entered POST ! ')
        if request.method == "POST":
            csv_file = request.FILES["csv_file"]
            data = csv_file.read().decode('utf-8')
            rows = re.split('\n', data) 
            
            vin_data=[]
            t=0 
            # print (' File Type ',csv_file.name[-3:])
            if not (csv_file.name[-3:] == "csv"):
                return render(request,'reports/display_vin_data.html',{'invalid_file_type':'invalid_file_type'} )

            chassis_upload_list=[]
            vin_upload_list=[]

            for index, row in enumerate(rows):
                if (index != 0):
                    if (t < len(rows)-1):
                        cells = row.split(',')
                        chassis_upload_list.append(cells[0]) 
                        vin_upload_list.append(cells[1])
                        if(len(cells)<2 ):
                            return render(request,'reports/display_vin_data.html',{'invalid_file':'invalid_file'} )
                        else:    
                            vin_data.append(cells)
                t += 1

            # print ( chassis_upload_list ) 
            # First Check whether the imported chassis list contains any duplicates.
            chassis_list_duplicates = []
            chassis_no_repeat=[]

            # [without_duplicates.append(element) for element in a_list if element not in without_duplicates]

            # [chassis_list_duplicates.append(element) for element in chassis_upload_list if element in chassis_list_duplicates]
            for element in chassis_upload_list :
                if element in chassis_no_repeat:
                    chassis_list_duplicates.append(element)
                else:
                    chassis_no_repeat.append(element) 

            # print ( chassis_list_duplicates )

            
                # return render(request,'reports/display_vin_data.html',{'chassis_list_duplicates':chassis_list_duplicates} ) 

            vin_list_duplicates = []
            vin_no_repeat=[]

            # [without_duplicates.append(element) for element in a_list if element not in without_duplicates]

            # [chassis_list_duplicates.append(element) for element in chassis_upload_list if element in chassis_list_duplicates]
            for element in vin_upload_list :
                if element in vin_no_repeat:
                    vin_list_duplicates.append(element)
                else:
                    vin_no_repeat.append(element) 

            # print ( chassis_list_duplicates )

            if(len(chassis_list_duplicates)>0) or (len(vin_list_duplicates)>0):
                return render(request,'reports/display_vin_data.html',{'chassis_list_duplicates':chassis_list_duplicates,'vin_list_duplicates':vin_list_duplicates}) 
# 
            t=0 
            pass_data=[]
            for row in vin_data:
                error_chassis=False
                error_vin_number= False 
                existing_chassis_no = None
                existing_vin_number = None
                error_message=''
                if t < len(vin_data)  :
                   
                    # Function 1 checks the blank chassis nos and non existant chassis nos 
                    # It returns imported chassis nos with message -- compare upon return and add error key
                    row[0]=row[0].strip()
                    chassis_result = check_chassis_no(row[0])
                    if not ( chassis_result == row[0] ):
                        error_chassis=True
                        error_message = chassis_result
                        # error_message='Alread Has A VIN Number' 
                    else:
                        existing_vin_number = get_vin_number (row[0])
                        if existing_vin_number is not  None:
                            error_message += ' Already has a VIN Number '
                            


                    # Function 2 returns VIN Nos for the CHASSIS if available. --- Above else part

                    # Function 3 checks VIN Pattern and blanks and returns VIN or VIN + messages -- compare and add error key to record
                    row[1]=row[1].strip()
                    vin_result = check_vin_no(row[1])
                    if not ( vin_result == row[1] ):
                        error_vin_number=True
                        error_message += ' ' + vin_result 
                    else:
                        existing_chassis_no = get_chassis_number (row[1])
                        if existing_chassis_no is not None:
                         error_message += ' Duplicate VIN !'


                    # Function 4 checks the existing VIN numbers and returns the CHASSIS Nos for such VINS above else part 
                    my_dict={}
                    if error_chassis :
                        my_dict={'chassis_no':chassis_result,'existing_vin_number':existing_vin_number,'error_chassis':'error_chassis','error_message':error_message}
                    else:
                        my_dict={'chassis_no':chassis_result,'existing_vin_number':existing_vin_number,'error_message':error_message}

                    if error_vin_number :
                        my_dict.update ({'vin_number':vin_result,'existing_chassis_no':existing_chassis_no,'error_vin_number':'error_vin_number','error_message':error_message})
                    else:
                        my_dict.update ({'vin_number':vin_result,'existing_chassis_no':existing_chassis_no,'error_message':error_message})
                        
                    pass_data.append (my_dict )

                    t += 1
            
            # Check for three conditions
            # 1 If chassis no is blank imported
            # 2 If VIN number is blank imported
            # 3 If Chassis No is incorrect  imported
            # 4 If the VIN number is already present for the Chassis No then ask an option to retain or replace
            # 5 If the VIN Number 1   
            # 6 If the Chassis No is wrongly given capture and throw error  

            # print ('File', csv_file.name)
            # print  (pass_data )

            vin_data_upload = pass_data
            request.session['value'] = pass_data
        return render(request,'reports/display_vin_data.html', {'data_type':'vin_number_upload','vin_data':pass_data})



# Get Vin Number from Chassis Number if available else return None
def get_vin_number(chassis_number = None):
    try:
        build = Build.objects.get(order_id=Order.objects.get(chassis = chassis_number))
        return build.vin_number

    except Build.DoesNotExist:
        pass 
        return None 

# Function to Check Chassis Number Existing  or Blank    
def check_chassis_no(chassis_number = None):
    # Chassis Number Blank Check

    if (chassis_number is None) or chassis_number == "" or len(chassis_number) <=0  :
        # 1 --- Blank or None 
        return chassis_number + ' Invalid Chassis'

    # Chassis Number Valid Check
    if (Order.objects.filter(chassis = chassis_number)).count()>0:
        order= Order.objects.get(chassis = chassis_number)
        return order.chassis
    else:
        return chassis_number + '  Invalid Chassis'


# Return the chassis No else None 
def get_chassis_number(vin_no=None):
    # print( 'Entering Get Chassis ',vin_no)
    # build = Build.objects . get(vin_number=vin_no)
    # print('Build Record Set ', build)
    try:
        build=Build.objects.get(vin_number=vin_no)
        # print('Build Record Set ', build)
         
    except Build.DoesNotExist:
        return None
    except Exception as e:
        return ' Multiple VIN Numbers !!!'
    try: 
        order = Order.objects.get(id=build.order_id)
        # print('Checking Chassis ', vin_no,order )
        return order.chassis 
    except Order.DoesNotExist:
        return None 
    

def check_vin_no(vin_no=None):

    # Vin No is blank
    if (vin_no is None) or vin_no=='':
        return ' Invalid Vin '

    # Vin No does not match pattern
    # print ('Checking VIN ' , vin_no, ' length ' ,len(vin_no))
    string_part = vin_no[:12]
    int_part = vin_no[-7:]
    # print (string_part, ' Checking VIN ' , int_part)  
    # print (re.match(r'^.{11}\d{6}$', vin_no))

    if not (len(vin_no) == 17) :
        return vin_no + ' Invalid VIN '
    else:
        return vin_no
 
    try:
        test= int (int_part)
        var_test = isinstance(test, int) 
        print (var_test )
    except Exception as e:
        pass
        return ' Inavlid VIN No'
    if var_test:
        return vin_no

    
class VinDataUpload(ExportCSVMixin, View) :   
    def post(self, request):
        user_submit_value  =  request.POST.get("but1","")
        approved_list=[]
        for key, value in request.POST.items():
            # print('Key: %s' % (key) )
            approved_list.append(key)
            # print(f'Key: {key}') in Python >= 3.7

        approved_list.remove ('but1')

        if user_submit_value == "Cancel":
            return redirect("../")

        if len(approved_list) <=0:
            return render(request,'reports/display_vin_data.html', {'no_data_to_update':'no_data_to_update'})
        


        test_data =[]
        test_data = request.session['value'] 

        counter = 0 
        if user_submit_value == "Upload":

            updated_data=[]
            not_updated_data=[]

            for chassis in approved_list:
                try:
                    # record = [element for element in test_data if element['chassis_no'] == chassis]
                    record=list(  filter(lambda record: record['chassis_no'] == chassis, test_data))
                    build = Build.objects.get(order_id=Order.objects.get(chassis=record[0]['chassis_no']))

                    build.vin_number= record[0]['vin_number']

                    build.save()
                    counter += 1
                    updated_data.append({'chassis_no':record[0]['chassis_no'],'vin_number':build.vin_number})
                except Order.DoesNotExist:

                    not_updated_data.append({'chassis_no':record[0]['chassis_no'],'vin_number':build.vin_number})
                    pass 
                

            count = str(counter) + " / " + str(len(test_data)) + ' updated successfully and ' + str(len(test_data)-counter) + ' records not updated ! ' 

            return render(request,'reports/display_vin_data.html', {'vin_after_data_type':'after_vin_number_upload','updated_data': updated_data,'not_updated_data':not_updated_data,'count_data':count})
                
        else:
            # redirect the user to the reports page iteself to reload another csv file
            return redirect('../' )


                                



def get_model_name(model_id=None):
    try:
        model=Model.objects.get(id=int(model_id))
        return model.name
    except Model.DoesNotExist:
        
        pass

class SeriesPriceImport(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.upload_series_pricelist'
    template_name = 'reports/display_vin_data.html'

    def post(self, request):
        if request.method == "POST":
            csv_file = request.FILES["csv_file"]

            if not (csv_file.name[-3:] == "csv"):
                return render(request,'reports/display_vin_data.html',{'invalid_series_file_type':'invalid_series_file_type'} )


            data = csv_file.read().decode('utf-8')
            rows = re.split('\n', data) 
            

            price_data=[]

            t=0    
            for index, row in enumerate(rows):
                if (index != 0):
                    if (t < len(rows) -1):
                        cells = row.split(',')

                        if(len(cells)<3 ):
                            return render(request,'reports/display_vin_data.html',{'invalid_series_file_type':'invalid_series_file_type'} )
                        else:    
                            price_data.append(cells)
                t += 1

            # print('Price Data ', price_data)

            t=0 
            pass_data=[]
            for row in price_data:
                error_series=False
                error_wholesale= False 
                error_retail = False
                error_message=''
                if t < len(price_data)  :
                   
                    # Function 1 checks for blank Series Code and Incorrect Series Code
                    # For both the scenarios ensure that the prices are not fetched and error message is shown   
                    # This function if series_code is not blank, next checks for the series code to be available and valid 
                    row[0]=row[0].strip()
                    series_result = check_series_code(row[0])
                    if not ( series_result == row[0] ):
                        error_series=True
                        error_message = series_result
                        # error_message=' Blank Series Code or Invalid Series Code '

                    # Function 2 checks for blank Wholesale Price  and Incorrect WholeSale Price 
                    # This function if wholesale price is not blank, next checks whether the wholesale price is numberic or not 
                    row[1]=row[1].strip()
                    wholesale_result = check_wholesale_price(row[1])
                    if not ( wholesale_result == row[1] ):
                        error_wholesale = True
                        error_message += wholesale_result


                    # Function 3 checks for blank Retail Price and Incorrect Retail Price 
                    # This function checks if retail price is not blank, next checks whether the retail price is numberic or not 
                    row[2]=row[2].strip()
                    retail_result = check_retail_price(row[2])
                    if not ( retail_result == row[2] ):
                        error_retail = True
                        error_message += retail_result

                    # Now check for the error messages first for series code and if no error then fetch the data for the series 
                    my_dict={}
                    if error_series and error_wholesale and error_retail:
                        my_dict={'series_code':series_result,'model_name':'Invalid Model','series_name':'Invalid Series','exist_wholesale_price':' NA ','exist_retail_price':' NA ','new_wholesale_price':' NA ','error_series':'error_series','new_retail_price':' NA ','error_wholesale':'error_wholesale','error_retail':'error_retail','error_message':error_message}
                    
                    if error_series and error_wholesale and (not error_retail):
                        my_dict={'series_code':series_result,'model_name':'Invalid Model','error_series':'error_series','series_name':'Invalid Series','exist_wholesale_price':' NA ','exist_retail_price':' NA ','new_wholesale_price':' NA ','error_wholesale':'error_wholesale','new_retail_price':retail_result,'error_message':error_message}

                    if error_series and (not error_wholesale) and (not error_retail):
                        my_dict={'series_code':series_result,'model_name':'Invalid Model','error_series':'error_series','series_name':'Invalid Series','exist_wholesale_price':' NA ','exist_retail_price':' NA ','new_wholesale_price':wholesale_result,'new_retail_price':retail_result,'error_message':error_message}
                    
                    if (not error_series) and (not error_wholesale) and (not error_retail):
                        # All three are true and have no errors
                        try:
                            series_name=Series.objects.values('name','model_id','wholesale_price','retail_price').get(code=series_result)
                            my_dict={'series_code':series_result,'model_name':get_model_name(str(series_name['model_id'])),'series_name':series_name['name'],'exist_wholesale_price':str(series_name['wholesale_price']),'exist_retail_price':str(series_name['retail_price']),'new_wholesale_price':wholesale_result,'new_retail_price':retail_result,'count_data':t+1}
                        except Exception as e:
                            print (e)
                            pass   

                    if (not error_series) and (not error_wholesale) and (error_retail):
                        # Series and Wholesale are true while Retail has errors
                        try:
                            series_name=Series.objects.values('name','model_id','wholesale_price','retail_price').get(code=series_result)
                            my_dict={'series_code':series_result,'model_name':get_model_name(str(series_name['model_id'])),'series_name':series_name['name'],'exist_wholesale_price':str(series_name['wholesale_price']),'exist_retail_price':str(series_name['retail_price']),'new_wholesale_price':wholesale_result,'new_retail_price':retail_result,'error_retail':'error_retail','error_message':error_message}
                        except Exception as e:
                            print (e)
                            pass  

                    if (not error_series) and (error_wholesale) and (not error_retail):
                        # Series and Retail are true while Retail has errors
                        try:
                            series_name=Series.objects.values('name','model_id','wholesale_price','retail_price').get(code=series_result)
                            my_dict={'series_code':series_result,'model_name':get_model_name(str(series_name['model_id'])),'series_name':series_name['name'],'exist_wholesale_price':str(series_name['wholesale_price']),'exist_retail_price':str(series_name['retail_price']),'new_wholesale_price':wholesale_result,'error_wholesale':'error_wholesale','new_retail_price':retail_result,'error_message':error_message}
                        except Exception as e:
                            print (e)
                            pass  
                    if (not error_series) and (error_wholesale) and (error_retail):
                        # All three are true and have no errors
                        try:
                            series_name=Series.objects.values('name','model_id','wholesale_price','retail_price').get(code=series_result)
                            my_dict={'series_code':series_result,'model_name':get_model_name(str(series_name['model_id'])),'series_name':series_name['name'],'exist_wholesale_price':str(series_name['wholesale_price']),'exist_retail_price':str(series_name['retail_price']),'new_wholesale_price':wholesale_result,'new_retail_price':retail_result,'error_message':error_message}
                        except Exception as e:
                            print (e)
                            pass  
                    # print('Data added ', my_dict)
                    pass_data.append (my_dict )
                    t += 1
            print  ('Final ' , pass_data )
            # print(sum([1 for d in pass_data if 'count_data' in d]))
            ok_records = sum([1 for d in pass_data if 'count_data' in d])
            total_records = len(pass_data)
            print  ('No of Records  ' , ok_records , ' Valid Records ' ,  total_records)
            request.session['series_price_value'] = pass_data
        return render(request,'reports/display_vin_data.html', {'series_data_type':'series_price','price_data':pass_data,'ok_records':ok_records, 'total_records':total_records})

        # return render(request,'reports/display_vin_data.html', {'data_type':'vin_number_upload','vin_data':pass_data})

def check_series_code(series_code = None):
    if (series_code is None) or series_code == "" or len(series_code) <=0  :
        # 1 --- Blank or None 
        return series_code + ' Blank Series Code '

    # Check if the Series Exists 
    if (Series.objects.filter(code = series_code)).count()>0:
        # order= Order.objects.get(chassis = chassis_number)
        return series_code
    else:
        return series_code + '  Invalid Series Code '



def check_wholesale_price(wholesale_price = None):
    # Series Code Blank Check
    if (wholesale_price is None) or wholesale_price == "" or len(wholesale_price) <=0  :
        # 1 --- Blank or None 
        return wholesale_price + ' Blank Whole Sale Price '


    # Check if wholesale price is a number or not   
    if wholesale_price.isnumeric():
        # order= Order.objects.get(chassis = chassis_number)
        if int(wholesale_price) <= 0:
            return ' Cannot Be ' + wholesale_price
        else:      
            return wholesale_price
    else:
        return wholesale_price + '  Invalid Whole Sale Price  '


def check_retail_price(retail_price = None):
    # Series Code Blank Check
    if (retail_price is None) or retail_price == "" or len(retail_price) <=0  :
        # 1 --- Blank or None 
        return retail_price + ' Blank Retail Sale Price '

    # Check if wholesale price is a number or not   
    if retail_price.isnumeric():
        if int(retail_price) <= 0:
            return ' Cannot Be ' + retail_price
        else:      
            return retail_price
    else:
        return retail_price + '  Invalid Retail Price  '

class SeriesPriceImport_working(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.upload_series_pricelist'
    template_name = 'reports/display_vin_data.html'

    def post(self, request):
        if request.method == "POST":
            csv_file = request.FILES["csv_file"]

            if not (csv_file.name[-3:] == "csv"):
                return render(request,'reports/display_vin_data.html',{'invalid_series_file_type':'invalid_series_file_type'} )


            data = csv_file.read().decode('utf-8')
            rows = re.split('\n', data) 
            
            if not (csv_file.name[-3:] == "csv"):
                return render(request,'reports/display_vin_data.html',{'invalid_series_file_type':'invalid_series_file_type'} )

            price_data=[]

            for index, row in enumerate(rows):
                if (index != 0):
                    cells = row.split(',')
                    price_data.append(cells)

            t=0 
            pass_data=[]
            fail_data=[]
            for i in price_data:
                if t < len(price_data)-1  :
                    try:
                        series_name=Series.objects.values('name','model_id','wholesale_price','retail_price').get(code=i[0])
                        pass_data.append({ 'series_code':i[0],
                        'model_name':get_model_name(series_name['model_id']),
                        'exist_wholesale_price':str(series_name['wholesale_price']),
                        'wholesale_price':i[1],
                        'exist_retail_price':str(series_name['retail_price']),
                        'series_name':series_name['name'],'retail_price':i[2]})
                    except Series.DoesNotExist as e:
                        fail_data.append({'series_code':i[0], 'series_name':'No Such Series Name',   'wholesale_price':i[1],'exist_wholesale_price':'NA','retail_price':i[2],'exist_retail_price':'NA'})
                        pass
                    else:
                        pass
                    finally:
                        pass
                     
                    t += 1
            request.session['series_price_value'] = pass_data
        return render(request,'reports/display_vin_data.html', {'series_data_type':'series_price','price_data':pass_data,'fail_data':fail_data})

class SeriesPriceUpload(ExportCSVMixin, View) :   

    def post(self, request):

        user_submit_value  =  request.POST.get("but1","")

        approved_list=[]
        for key, value in request.POST.items():
            approved_list.append(key)

        approved_list.remove ('but1')

        if len(approved_list) <=0:
            return render(request,'reports/display_vin_data.html', {'series_no_data_to_update':'series_no_data_to_update'})

        test_data =[]
        test_data = request.session['series_price_value'] 

        # counter
        series_counter = 0
        series_updated_data=[]
        series_not_updated_data=[]

        if user_submit_value == "Upload":
            for upd_data in test_data:
                if('count_data' in upd_data):
                    try:
                        series=Series.objects.get(code=upd_data['series_code'])
                        series.wholesale_price= upd_data['new_wholesale_price']
                        series.retail_price= upd_data['new_retail_price']
                        series.save()
                        series_updated_data.append({'series_code':upd_data['series_code'],'model_name':upd_data['model_name'],'series_name':upd_data['series_name'],'wholesale_price':upd_data['new_wholesale_price'],'retail_price':upd_data['new_retail_price']})
                        series_counter += 1
                    except Series.DoesNotExist:
                        series_not_updated_data.append({'series_code':upd_data['series_code'],'series_name':upd_data['series_name'],'wholesale_price':upd_data['new_wholesale_price'],'retail_price':upd_data['new_retail_price']})
                        
                        pass 
            
            series_count_data = str(series_counter) + ' / ' + str (len(test_data)) + ' Records Updated !'

            today = date.today()

            
            # =======================
            # Do Audit capture Here 
            # =======================
            for upd_data in test_data:
                if('count_data' in upd_data):
                    try:
                        series_audit=PriceAuditCapture()
                        series_audit.series_code = upd_data['series_code']
                        series_audit.existing_wholesale_price= str(upd_data['exist_wholesale_price'])
                        series_audit.existing_retail_price= str(upd_data['exist_retail_price'])
                        series_audit.new_wholesale_price= upd_data['new_wholesale_price']
                        series_audit.new_retail_price= upd_data['new_retail_price']
                        series_audit.price_changed_datetime= str(today.strftime("%d-%m-%Y"))
                        series_audit.price_changed_user= request.user.name
                        series_audit.save()
                    except Exception as e :
                        print('Exception Raised ' , e)                        
                        pass 
              
            return render(request,'reports/display_vin_data.html', {'series_after_data_type':'after_series_number_upload','series_updated_data': series_updated_data,'series_not_updated_data':series_not_updated_data,'count_data':series_count_data})
                
        else:
            # redirect the user to the reports page iteself to reload another csv file
            return redirect('../' )

            
 



class ViewSeriesPriceAudit(PermissionRequiredMixin,ExportCSVMixin, View):
    permission_required = 'reports.upload_series_pricelist'
    template_name = 'reports/display_audit_price_data.html'

    def get_headers(self, table=None):
        headers = [
            'SNo',
            'Series Code',
            'Changed Date',
            'Previous WholeSale Price',
            'New WholeSale Price',
            'Previous Retail Price',
            'New Retail Price',
            'Changed By',
        ]
        return headers
    def get_rows(self, table=None, id=None):
        rows=[
        [
            index,
            row.series_code,
            row.price_changed_datetime,
            row.existing_wholesale_price,
            row.new_wholesale_price,
            row.existing_retail_price,
            row.new_retail_price,
            row.price_changed_user
        ]
        for index, row in enumerate(self.series_audit, start=1)
        # for row in self.series_audit
        ]
        return rows

    def get_file_name(self):
        return 'Price Audit '

    def get_complete_file_name(self):
        return 'Price Audit --' + str(datetime.now().date().strftime("%d-%m-%Y"))
   
    def get(self, request):
        
        view_type=str(request.GET['view_type'])
        view_type=view_type.strip()

        self.series_audit = PriceAuditCapture.objects.all().order_by('-id')
        if view_type == "view_audit":
            return render(request,'reports/display_audit_price_data.html',{'series_audit_data':self.series_audit})
        
        if view_type == 'view_export':
            return self.write_csv() 


def getattr_nested(obj, *args, **kwargs):
    """
    Checks that obj.arg1 is defined and not None
    Then check obj.arg1.arg2 etc, until all args have been checked
    Returns True if all args are defined and not None

    >>> # A base object() has no __dict__ so we need to create a dummy class for testing
    >>> class EmptyObject(object):
    ...     pass
    >>> x = EmptyObject()
    >>> setattr(x, 'a', EmptyObject())
    >>> setattr(x.a, 'b', EmptyObject())
    >>> setattr(x.a.b, 'c', None)
    >>> setattr(x.a.b, 'd', 4)
    >>> setattr(x.a.b, 'e', {})
    >>> setattr(x.a.b, 'f', EmptyObject())
    >>> setattr(x.a.b, 'g', False)
    >>> check_object_chain(x, 'a')
    True
    >>> check_object_chain(x, 'aaa')
    False
    >>> check_object_chain(x, 'a', 'b')
    True
    >>> check_object_chain(x, 'a', 'bbb')
    False
    >>> check_object_chain(x, 'a', 'b', 'c')
    False
    >>> check_object_chain(x, 'a', 'b', 'ccc')
    False
    >>> check_object_chain(x, 'a', 'b', 'd')
    True
    >>> check_object_chain(x, 'a', 'b', 'e')
    True
    >>> check_object_chain(x, 'a', 'b', 'f')
    True
    >>> check_object_chain(x, 'a', 'b', 'g')
    True
    """
    default = kwargs.get('default')

    try:
        value = functools.reduce(getattr, args, obj)
        return value
    except AttributeError:
        return default



def calculate_margin_without_gst(order):

    price_affecting_order_skus = order.ordersku_set.filter(base_availability_type__in=(SeriesSKU.AVAILABILITY_OPTION, SeriesSKU.AVAILABILITY_UPGRADE))

    retail_total = (
        (order.orderseries.retail_price if hasattr(order, 'orderseries') and order.orderseries.retail_price else 0) +
        (order.price_adjustment_retail or 0) +
        (order.after_sales_retail or 0) +
        sum(osku.sku.retail_price or 0 for osku in price_affecting_order_skus) +
        sum(specialfeature.retail_price or 0 for specialfeature in order.specialfeature_set.all())
    )
    wholesale_total = (
        (order.orderseries.wholesale_price if hasattr(order, 'orderseries') and order.orderseries.wholesale_price else 0) +
        (order.price_adjustment_wholesale or 0) +
        (order.after_sales_wholesale or 0) +
        sum(osku.sku.wholesale_price or 0 for osku in price_affecting_order_skus) +
        sum(specialfeature.wholesale_price or 0 for specialfeature in order.specialfeature_set.all()) +
        order.dealer_load
    )

    wholesale_total += order.trade_in_write_back

    return round((retail_total - wholesale_total) / Decimal(1.1), 2)

def get_sales_date(export_csv_mixin, order):
    """
    Calls the datetime conversion method from ExportCSVMixin to turn order's relevant date into desired format
    """
    if order.is_order_converted:
        if order.order_converted:
            return export_csv_mixin.convert_date_time_to_local(order.order_converted)
        else:
            return ''
    elif order.order_submitted:
        return export_csv_mixin.convert_date_time_to_local(order.order_submitted)
    else:
        return ''


class SalesView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_sales_breakdown'

    def get_rows(self, table=None, id=None):

        date_from = datetime.strptime(self.date_from, settings.FORMAT_DATE_DATEPICKER_DASH_FMT).date()
        date_to = datetime.strptime(self.date_to, settings.FORMAT_DATE_DATEPICKER_DASH_FMT).date()
        date_to = datetime.combine(date_to, datetime.max.time())  # get all orders of that same day

        orders = (Order.objects
            .filter(
                order_submitted__gte=date_from,
                order_submitted__lte=date_to,
                order_cancelled__isnull=True,
            )
            .order_by('id')
            .select_related(
                'customer__physical_address__suburb__post_code__state',
                'orderseries',
                'orderseries__series',
                'dealership',
            )
        )

        if self.dealership_id != SALESREPORT_DEALERSHIP_ID_ALL:
            orders = orders.filter(dealership_id=self.dealership_id)

        orders = [order for order in orders if not order.is_quote()]

        rows = [
            [
                order.dealership,
                get_sales_date(self, order),
                order.customer.first_name if order.customer else 'STOCK',
                order.customer.last_name if order.customer else '',
                getattr_nested(order, 'customer', 'physical_address', 'suburb', 'name', default=''),
                getattr_nested(order, 'customer', 'physical_address', 'suburb', 'post_code', 'state', 'code', default=''),
                getattr_nested(order, 'customer', 'physical_address', 'suburb', 'post_code', 'number', default=''),
                order.customer.email if order.customer else '',
                order.orderseries.series.code if hasattr(order, 'orderseries') else '',
                order.id,
                order.chassis,
                order.dealer_sales_rep.get_full_name(),
            ]
            for order in orders
            ]
        return rows


    def get_headers(self, table=None):
        headers = [
            'Dealership',
            'Order Placed Date',
            'First Name',
            'Last Name',
            'Suburb',
            'State',
            'Post Code',
            'E-mail Address',
            'Series Code',
            'Order #',
            'Chassis #',
            'Sales Rep Name',
        ]
        return headers

    def get_file_name(self):
        return 'Sales between '

    def get_complete_file_name(self):
        return '{0} {1} - {2}'.format(self.get_file_name(), self.date_from, self.date_to)

    def get(self, request, * args, **kwargs):
        self.dealership_id = None
        self.date_from = kwargs['date_from']
        self.date_to = kwargs['date_to']
        dealership_id = kwargs['dealership_id']

        if get_user_reports_dealerships(request.user, dealership_id):
            self.dealership_id = int(dealership_id)

        return self.write_csv()

class ReadyForDispatchView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_sales_breakdown'

    def send_ready_email(self,date_from=None,date_to=None):
        format_str = '%d-%m-%Y' # The format
        final_qc_date_from = datetime.strptime(date_from, format_str)
        final_qc_date_to = datetime.strptime(date_to, format_str)
        # print(final_qc_date_from,':',final_qc_date_to)
        today = date.today()
        ready_for_dispatch_list_mail = Order \
            .objects \
            .filter(
            order_submitted__isnull=False,
            order_cancelled__isnull=True,
            build__build_order__production_month__gte='2019-10-01',
            build__build_order__production_month__lte= today,
            ordertransport__actual_production_date__isnull = False,
            ordertransport__watertest_date__isnull = False,
            ordertransport__detailing_date__isnull = False,
            build__qc_date_actual__isnull = False,
            ordertransport__final_qc_date__isnull =False,
            ordertransport__final_qc_date__gte = final_qc_date_from,
            ordertransport__final_qc_date__lte = final_qc_date_to,
            # dispatch_date_actual__isnull = True,
            ) \
            .order_by('build__build_order__production_month', 'build__build_order__order_number') \
            .select_related(
            'build__build_order',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
            'show',
            'dealership',
            'customer',
            'build__drafter',
            'ordertransport',
        ).prefetch_related('orderdocument_set',) 

        final_ready_for_dispatch_list_mail = [
                    {   
                        'production_date': order.build.build_date,
                        'url': 'coms.newagecaravans.com.au' + '{}#/{}/status'.format(reverse('newage:angular_app', kwargs={'app': 'orders'}), order.id),
                        'chassis': str(order.chassis) if order.chassis else '#%d' %(order.id),
                        'id':str(order.id),
                        'series_name':order.get_series_code(),
                        'dname':str(order.dealership.name),
                        'finalqcdate':str((datetime.strptime(str(order.ordertransport.final_qc_date),'%Y-%m-%d').strftime('%d-%m-%Y'))),
                    }
                    for order in ready_for_dispatch_list_mail
                        ]
        msg1=''

        try:
            subject = ' Ready For Dispatch List -- ' + date_from + ' to ' + date_to

            html_message = loader.render_to_string('ready_for_dispatch_file.html',{'dispatch_list':final_ready_for_dispatch_list_mail,'date_from':date_from,'date_to':date_to})

            send_mail(subject , msg1 , ' NewAge Caravans  <Annesley.Greig@newagecaravans.com.au>', ['gvelu4@gmail.com','accounts@newagecaravans.com.au','it@newagecaravans.com.au'],html_message=html_message)
            # send_mail(subject , msg1 , ' NewAge Caravans  <Annesley.Greig@newagecaravans.com.au>', ['gvelu4@gmail.com'],html_message=html_message)

        except SMTPException as e:
            
            print('There was an error sending an email: ', e)
        
        except Exception as e:
        
            print(' Uncexpected Error', e)
            raise 
        
        finally:
            print ('')
        
        return True 
        

    def get_complete_file_name(self):
        return '{0} {1} - {2}'.format(self.get_file_name(), self.date_from, self.date_to)

    def get(self, request, * args, **kwargs):
        self.date_from = kwargs['date_from']
        self.date_to = kwargs['date_to']
        if (self.send_ready_email(self.date_from,self.date_to)):
            return redirect('/reports/')

class ReadyForDispatchExportView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_sales_breakdown'

    def get_rows(self, table=None, id=None):

        date_from = datetime.strptime(self.date_from, settings.FORMAT_DATE_DATEPICKER_DASH_FMT).date()
        date_to = datetime.strptime(self.date_to, settings.FORMAT_DATE_DATEPICKER_DASH_FMT).date()
        date_to = datetime.combine(date_to, datetime.max.time())  # get all orders of that same day

        format_str = '%d-%m-%Y' # The format
        # final_qc_date_from = datetime.strptime(date_from, format_str)
        # final_qc_date_to = datetime.strptime(date_to, format_str)
        # print(final_qc_date_from,':',final_qc_date_to)
        today = date.today()
        ready_for_dispatch_list_mail = Order \
            .objects \
            .filter(
            order_submitted__isnull=False,
            order_cancelled__isnull=True,
            build__build_order__production_month__gte='2019-10-01',
            build__build_order__production_month__lte= today,
            ordertransport__actual_production_date__isnull = False,
            ordertransport__watertest_date__isnull = False,
            ordertransport__detailing_date__isnull = False,
            build__qc_date_actual__isnull = False,
            ordertransport__final_qc_date__isnull =False,
            ordertransport__final_qc_date__gte = date_from,
            ordertransport__final_qc_date__lte = date_to,
            # dispatch_date_actual__isnull = True,
            ) \
            .order_by('build__build_order__production_month', 'build__build_order__order_number') \
            .select_related(
            'build__build_order',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
            'show',
            'dealership',
            'customer',
            'build__drafter',
            'ordertransport',
        ).prefetch_related('orderdocument_set',) 



        # orders = [order for order in orders if not order.is_quote()]

        rows = [
            [
                order.id,
                order.chassis,
                order.get_series_code(),
                order.dealership.name,
                order.ordertransport.final_qc_date,
            ]
            for order in ready_for_dispatch_list_mail
            ]
        return rows


    def get_headers(self, table=None):
        headers = [
            'Order No',
            'Chassis ',
            'Series',
            'Dealership',
            'Final QC Completed Date'
        ]
        return headers

    def get_file_name(self):
        return 'Ready For Dispatch between '

    def get_complete_file_name(self):
        return '{0} {1} - {2}'.format(self.get_file_name(), self.date_from, self.date_to)

    def get(self, request, * args, **kwargs):
        self.date_from = kwargs['date_from']
        self.date_to = kwargs['date_to']
        return self.write_csv()



class DispatchMailView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_sales_breakdown'

    def send_ready_email(self,date_from=None,date_to=None):
        format_str = '%d-%m-%Y' # The format
        actual_dispatch_date_from = datetime.strptime(date_from, format_str)
        actual_dispatch_date_to = datetime.strptime(date_to, format_str)
        today = date.today()

        actual_dispatch_list_mail = Order \
            .objects \
            .filter(
            order_submitted__isnull=False,
            order_cancelled__isnull=True,
            dispatch_date_actual__gte = actual_dispatch_date_from,
            dispatch_date_actual__lte = actual_dispatch_date_to,
            ) \
            .order_by('build__build_order__production_month', 'build__build_order__order_number') \
            .select_related(
            'build__build_order',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
            'show',
            'dealership',
            'customer',
            'build__drafter',
        ).prefetch_related('orderdocument_set',)

        final_actual_dispatch_list_mail = [
                    {   
                        'production_date': order.build.build_date,
                        'url': 'coms.newagecaravans.com.au' + '/orders/invoice/'+ str(order.id),
                        'chassis': str(order.chassis) if order.chassis else '#%d' %(order.id),
                        'series_name':order.get_series_code(),
                        'id':str(order.id),
                        'dname':str(order.dealership.name),
                        'actual_dispatch_date':str((datetime.strptime(str(order.dispatch_date_actual),'%Y-%m-%d').strftime('%d-%m-%Y'))),
                        'total_price':self.calculate_price_for_order(order.id)
                    }
                    for order in actual_dispatch_list_mail
                        ]
        msg1=''
        try:
            subject = ' Actual Dispatch Vans List -- ' + date_from + ' to ' + date_to

            html_message = loader.render_to_string('actual_dispatch_file.html',{'dispatch_list':final_actual_dispatch_list_mail,'date_from':date_from,'date_to':date_to})

            send_mail(subject , msg1 , ' NewAge Caravans  <Annesley.Greig@newagecaravans.com.au>', ['gvelu4@gmail.com','accounts@newagecaravans.com.au','darren.swenson@newagecaravans.com.au','matthew.mcphail@newagecaravans.com.au','tina.teo@newagecaravans.com.au','Annesley.greig@newagecaravans.com.au'],html_message=html_message)
            # send_mail(subject , msg1 , ' NewAge Caravans  <Annesley.Greig@newagecaravans.com.au>', ['gvelu4@gmail.com'],html_message=html_message)

        except SMTPException as e:
            
            print('There was an error sending an email: ', e)
        
        except Exception as e:
        
            print(' Uncexpected Error', e)
            raise 
        
        finally:
            print ('')

        return True 

    def calculate_price_for_order(self,order_id=None):
        order = Order.objects.filter_by_visible_to(self.request.user).get(id=order_id)
        # print('inside id :',order.id)
        def get_price(order_sku):
            # When order is finalised, use the wholesale price recorded against the OrderSku object, otherwise the actual sku wholesale price
            if order.get_finalization_status() == Order.STATUS_APPROVED:
                return order_sku.wholesale_price or 0
            return order_sku.sku.wholesale_price or 0

        # Options
        items = [
            {
                'type': 'Option',
                'name': osku.sku.public_description or osku.sku.description,
                'price': get_price(osku),
            } for osku in order.ordersku_set.filter(base_availability_type=SeriesSKU.AVAILABILITY_OPTION)
        ]



        # Upgrades
        items += [
            {
                'type': 'Upgrade' if osku.sku.wholesale_price > 0 else 'Downgrade',
                'name': osku.sku.public_description,
                'price': get_price(osku),
            } for osku in order.ordersku_set.filter(base_availability_type=SeriesSKU.AVAILABILITY_UPGRADE)
        ]

        for special_feature in order.specialfeature_set.all():
            items += [
                {
                    'type': 'Special Feature',
                    'name': special_feature.factory_description or special_feature.customer_description,
                    'price': special_feature.wholesale_price or 0,
                }
            ]

        # Price adjustment
        items += [
            {
                'type': 'Price adjustment',
                'name': order.price_adjustment_wholesale_comment,
                'price': order.price_adjustment_wholesale,
            }
        ]


        context_data = {
            'order': order,
            'date_printed': timezone.now(),
            'items': items,
            'total': (order.orderseries.wholesale_price or 0) + sum([item["price"] for item in items]),
            # 'is_html': is_html,
            # 'is_html': True,
        }
        # print('Total Price : ' ,context_data['total'])
        return str(context_data['total'])


    def get(self, request, * args, **kwargs):
        self.date_from = kwargs['date_from']
        self.date_to = kwargs['date_to']
        if (self.send_ready_email(self.date_from,self.date_to)):
            return redirect('/reports/')

class DispatchExportView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_sales_breakdown'

    def get_rows(self, table=None, id=None):

        format_str = '%d-%m-%Y' # The format
        actual_dispatch_date_from = datetime.strptime(self.date_from, format_str)
        actual_dispatch_date_to = datetime.strptime(self.date_to, format_str)

        today = date.today()

        actual_dispatch_list_mail = Order \
            .objects \
            .filter(
            order_submitted__isnull=False,
            order_cancelled__isnull=True,
            dispatch_date_actual__gte = actual_dispatch_date_from,
            dispatch_date_actual__lte = actual_dispatch_date_to,
            ) \
            .order_by('build__build_order__production_month', 'build__build_order__order_number') \
            .select_related(
            'build__build_order',
            'orderseries',
            'orderseries__series',
            'orderseries__series__model',
            'show',
            'dealership',
            'customer',
            'build__drafter',
        ).prefetch_related('orderdocument_set',) 


        rows = [
            [
                order.id,
                order.chassis,
                order.get_series_code(),
                order.dealership.name,
                order.dispatch_date_actual,
                self.calculate_price_for_order(order.id)
            ]
            for order in actual_dispatch_list_mail
            ]
        return rows

    def calculate_price_for_order(self,order_id=None):
        order = Order.objects.filter_by_visible_to(self.request.user).get(id=order_id)
<<<<<<< HEAD
=======
        # print('inside id :',order.id)
>>>>>>> 575bd8a765bd5644985e00363a0b1881eb80e817
        def get_price(order_sku):
            # When order is finalised, use the wholesale price recorded against the OrderSku object, otherwise the actual sku wholesale price
            if order.get_finalization_status() == Order.STATUS_APPROVED:
                return order_sku.wholesale_price or 0
            return order_sku.sku.wholesale_price or 0

        # Options
        items = [
            {
                'type': 'Option',
                'name': osku.sku.public_description or osku.sku.description,
                'price': get_price(osku),
            } for osku in order.ordersku_set.filter(base_availability_type=SeriesSKU.AVAILABILITY_OPTION)
        ]



        # Upgrades
        items += [
            {
                'type': 'Upgrade' if osku.sku.wholesale_price > 0 else 'Downgrade',
                'name': osku.sku.public_description,
                'price': get_price(osku),
            } for osku in order.ordersku_set.filter(base_availability_type=SeriesSKU.AVAILABILITY_UPGRADE)
        ]

        for special_feature in order.specialfeature_set.all():
            items += [
                {
                    'type': 'Special Feature',
                    'name': special_feature.factory_description or special_feature.customer_description,
                    'price': special_feature.wholesale_price or 0,
                }
            ]

        # Price adjustment
        items += [
            {
                'type': 'Price adjustment',
                'name': order.price_adjustment_wholesale_comment,
                'price': order.price_adjustment_wholesale,
            }
        ]


        context_data = {
            'order': order,
            'date_printed': timezone.now(),
            'items': items,
            'total': (order.orderseries.wholesale_price or 0) + sum([item["price"] for item in items]),
            # 'is_html': is_html,
            # 'is_html': True,
        }
        # print('Toal Price : ' ,context_data['total'])
        return str(context_data['total'])

    def get_headers(self, table=None):
        headers = [
            'Order No',
            'Chassis #',
            'Series Code',
            'Dealership',
            'Dispatched On',
            'Total Price',
        ]
        return headers

    def get_file_name(self):
        return 'Actual Vans Dispatch between '

    def get_complete_file_name(self):
        return '{0} {1} - {2}'.format(self.get_file_name(), self.date_from, self.date_to)

    def get(self, request, * args, **kwargs):
        self.date_from = kwargs['date_from']
        self.date_to = kwargs['date_to']
        return self.write_csv()


class RunsheetView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.export_runsheet'

    # HttpResponse(dump, content_type='application/json'), table=None):
    def get_headers(self, table=None):
            headers = [
                'Sequence. No',
                'Date',
                'First Name',
                'Last Name',
                'Suburb',
                'State',
                'Post Code',
                'E-mail Address',
                'Series Code',
                'Chassis #',
                'Order no',
                'Trade-in',
                'Deposit',
                'Retained Gross',
                'Sales Rep Name',
                'Desired Delivery Month',
                'Comments',
                'After Market',
                'Subject To',
            ]
            return headers

    def get_rows(self, table=None, id=None):

        orders = (Order.objects
            .filter(
            show_id=self.show_id,
            order_cancelled__isnull=True,
        )
            .order_by('id')
            .select_related(
            'customer__physical_address__suburb__post_code__state',
            'orderseries',
            'orderseries__series',
        )
        )

        orders = [order for order in orders if not order.is_quote()]

        rows = [
            [
                row + 1,
                get_sales_date(self, order),
                order.customer.first_name if order.customer else 'STOCK',
                order.customer.last_name if order.customer else '',
                getattr_nested(order, 'customer', 'physical_address', 'suburb', 'name', default=''),
                getattr_nested(order, 'customer', 'physical_address', 'suburb', 'post_code', 'state', 'code', default=''),
                getattr_nested(order, 'customer', 'physical_address', 'suburb', 'post_code', 'number', default=''),
                order.customer.email if order.customer else '',
                order.orderseries.series.code if hasattr(order, 'orderseries') else '',
                order.chassis,
                order.id,
                order.trade_in_comment,
                order.deposit_paid_amount,
                calculate_margin_without_gst(order),
                order.dealer_sales_rep.get_full_name(),
                order.delivery_date,
                order.price_comment,
                order.aftermarketnote.note if hasattr(order, 'aftermarketnote') and order.aftermarketnote else '',
                order.orderconditions.details if hasattr(order, 'orderconditions') and order.orderconditions else '',
            ]
            for row, order in enumerate(orders)
            ]
        return rows

    def get_file_name(self):
        return 'Runsheet for '

    def get_complete_file_name(self):
        return '{0}{1} - {2}'.format(self.get_file_name(), self.show.name,
                                     timezone.localtime(timezone.now()).strftime(settings.FORMAT_DATE_ONEWORD))

    def get(self, request, show_id=None):
        self.show_id = show_id
        self.show = get_object_or_404(Show, id=show_id)
        return self.write_csv()


########################NEW FUNC#############################

class ColorSelectionSheetView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.export_colorsheet'

    def get_headers(self, table=None):
        headers = [
            'Date',
            'Order',
            'Dealership',
            'Customer',
            'Day since order placed',
            'Number of selections still to be made',
        ]

        # print(headers)
        return headers

    def get_rows(self, table=None):

        orderskus = OrderSKU \
        .objects \
        .filter(sku__public_description__icontains='to be selected') \
        .select_related('sku',).prefetch_related('order','order__dealership','order__customer',) 


        ordercount = collections.defaultdict(int)
        for osku in orderskus:
            ordercount[osku.order_id] += 1


        rows = []
        for item in orderskus:
            if not item.order.order_submitted:
                continue

            day_elapsed = int((timezone.now() - item.order.order_submitted).total_seconds()/SECONDS_PER_DAY)
            if day_elapsed < SELECTIONS_DAYS_UNRESOLVED: continue
            rows.append([
                item.order.order_submitted.date(),
                item.order.id,
                item.order.dealership.name,
                item.order.customer.get_full_name() if item.order.customer else '(STOCK)',
                day_elapsed,
                ordercount[item.order_id]
            ])

        return rows

    def get_file_name(self):
        return 'Orders requiring selections as of'

    def get_complete_file_name(self):
        return '{0} {1}'.format(self.get_file_name(),
                                     datetime.now().date().strftime("%d-%m-%Y"))


    def get(self, request):
        return self.write_csv()


if __name__ == "__main__":
    import doctest
    doctest.testmod()

class ModelSeriesPriceListView(ExportCSVMixin, PermissionRequiredMixin, View):
    permission_required = 'reports.view_series_pricelist_all'

    def get_rows(self, table=None, id=None):
        if self.model_id == "0":
            series1 = Series.objects.all().order_by('model_id')
        else:
            series1 = Series.objects.filter(model_id=self.model_id).order_by('id')

        rows = [
            [
                series.model.name,
                series.code,
                series.name,
                series.wholesale_price,
                series.retail_price,
            ]
            for series in series1
            ]
        return rows

    def get_headers(self, table=None):
        headers = [
            
            'Model Name',
            'Series Code',
            'Series Name',
            'Wholesale Price',
            'Retail Price',
                    ]
        return headers

    def get_file_name(self):
        return ' ModelSeriesPriceList  ' + self.model_id

    def get_complete_file_name(self):
        return '{0} '.format(self.get_file_name())

    def get(self, request, * args, **kwargs):
        self.model_id = None
        self.model_id = kwargs['model_id']
        return self.write_csv()
        
