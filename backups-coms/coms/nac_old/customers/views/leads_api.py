import logging

from django.http import JsonResponse
from rest_framework.decorators import APIView,api_view
from rest_framework import authentication, permissions

from django.contrib.auth.models import User, Group
from django.contrib.auth import get_user_model
from customers.models import Customer
from dealerships.models import Dealership,DealershipUser,DealershipUserDealership
from newage.models import Address
from django.utils import timezone
from django.http import Http404, HttpResponseRedirect
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token

from django.contrib.auth import authenticate,login



class MyLogoutTest(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [authentication.TokenAuthentication]
    def post(self, request):
        #print('Post requested')
        MyLogoutTest.uname=self.request.user.name
        #print('Name : ',MyLogoutTest.uname)
        return self.logout(request)

    def logout(self, request):
        try:
            #print(MyLogoutTest.uname)
            request.user.auth_token.delete()
        except (AttributeError, ObjectDoesNotExist):
            pass

        return JsonResponse({"success": (MyLogoutTest.uname , " Successfully logged out.")})
        # ,status=status.HTTP_200_OK)

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
        leads = Customer.objects.filter(lead_type=Customer.LEAD_TYPE_LEAD)

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
        incoming_data =  self.request.POST.get("token")
        
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
        # print(User)
        
        # Get User IP Address
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')

        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        
       

        # User Permissions
        all_permissions_in_groups = self.request.user.get_group_permissions()

        my_list= Dealership.objects.filter(dealershipuserdealership__dealership_user_id=user_id).values('id','name')

        dealership_list=[]
        
        dealership_list=list(my_list)

        my_token= Token.objects.get_or_create(user=self.request.user)[0]
 
 
        token=str(my_token)
 

        login(self.request, self.request.user,backend='django.contrib.auth.backends.ModelBackend')


        session_key=self.request.session.session_key
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
            'token': token,
            'session_key':session_key,
          
            })
        return JsonResponse({'list':user_data})
        
        