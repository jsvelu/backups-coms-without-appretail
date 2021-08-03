import logging

from django.http import JsonResponse
from rest_framework.decorators import APIView
from django.contrib.auth.models import User, Group
from django.contrib.auth import get_user_model
from customers.models import Customer
from dealerships.models import Dealership,DealershipUser,DealershipUserDealership
from newage.models import Address
from django.utils import timezone
from django.conf import settings
from rest_framework.permissions import IsAuthenticated

class LeadsAPIView(APIView):
    # AttributeError: 'LeadsAPIView' object has no attribute 'permission_required'
    permission_classes = [IsAuthenticated]
    def __init__(self):
        return

    def post(self, request, *args, **kwargs):
        # **** to test model_items through api interface ****
        #return self.get_all_leads()
        return self.test_me()

        # if request.data.get('type') == 'all_leads':
        #     return self.get_all_leads()
        # else:
        #     return self.get_all_leads()


    def get_all_leads(self):
        # leads = Customer.objects.filter(lead_type=Customer.LEAD_TYPE_LEAD)
        leads = Customer.objects.all()

        print(leads)
        def build_lead(lead):
            return {
                'id': lead.pk,
                'name': lead.first_name + ' ' + lead.last_name,
                # 'post_code': lead.address.suburb.post_code.number,
                # 'state': lead.address.suburb.post_code.state.code,
                'created': str(lead.creation_time),
            }

        return JsonResponse({'list': [build_lead(l) for l in leads]})


    def test_me(self):
        user_data=[]
        l=[]
        for g in self.request.user.groups.all():
            l.append(g.name)

        query_set = Group.objects.filter(user = self.request.user)
        for g in query_set:
            # this should print all group names for the user
            print(g.name) # or id 
        
        user_id = self.request.user.id
        User = get_user_model()
        print(User)
        
        # Get User IP Address
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        
        print ('IP Address : ', ip)

        # User Permissions
        all_permissions_in_groups = self.request.user.get_group_permissions()
        print('Permissions',all_permissions_in_groups)
        # now = timezone.now()
        # print('Timezone',now)
        print(settings.TIME_ZONE)
        # Australia/Melbourne
        # my_list=User.objects \
        # .filter \
        # (
        #     id=32,
        #     ) \
        # .select_related \
        # (
        #     'dealershipuser',
        #     'dealership__dealershipuser',
        #     'dealershipuser__dealership',
        #     'dealershipuser__dealership_user_id',
        #     'dealership',
        #     ) \
        # .values_list('groups', 'id', 'is_active', 'is_staff', 'is_superuser','name','dealershipuser','dealership__name')

        my_list= Dealership.objects.filter(dealershipuserdealership__dealership_user_id=user_id).values('id','name')
        # values_list('id','name','address','address_id')
        # all_list 
        print(my_list)
        # my_l = [[ ord ]for ord in my_list]
        dealership_list=[]
        # 'chassis_list' : [
        #             {   
        #                 'production_date': order.build.build_date,
        #                 'url': '{}#/{}/status'.format(reverse('newage:angular_app', kwargs={'app': 'orders'}), order.id),
        #                 'chassis': str(order.chassis) if order.chassis else '',
        #             }
        #             for order in chassis_list
        #         ],
        
        dealership_list=list(my_list)
        # [
        # {
        # 'dealership_id':ord.id,
        # 'dealer_name':ord.name,
        # }
        # for ord in my_list
        # ]

        # for ord in my_list:
        #     my_l.append({
        #         'dealership id':ord['id'],
        #         'dealership name':ord['name'],
        #         'address':ord['address_id']
        #         })
        print(dealership_list)
        print(my_list.query)
        print('groups:',l)
        user_data.append({
            'user_id':self.request.user.id,
            'ip_address':ip,
            'last_name':self.request.user.name,
            'email_id':self.request.user.email,
            'is_staff':self.request.user.is_staff,
            'last_login':self.request.user.last_login,
            'timezone':settings.TIME_ZONE,
            'groups_belonging':l,
            'dealerships':dealership_list,
            'permissions':list(all_permissions_in_groups),
            })
        # l = self.request.user.groups.values_list('name',flat = True)
        # l_as_list = list(l)
        

        # print(l_as_list)
        # order = Order.objects.select_related('orderseries').get(id=data["order_id"])
        
        # all_data=User.objects.filter(
        #     id=request.user.id)\
        #     .select_related(
        #         'authtools_user_groups',
        #         'auth_group',

        #         )

        print(user_data)
        
        # context_dict ={'user_id':user_data[0],'user_name':user_data[1],'is_staff':user_data[2],'last_login':user_data[3]}
        # print(context_dict)
        # print('User Id : ', user_data[0]);
        # print('Name : ', user_data[1]);
        # print('Last Login : ', user_data[2]);
        # context=[]
     
        # print ('context text',context_dict)
        # print(user_data)

        return JsonResponse({'list':user_data})
        
        