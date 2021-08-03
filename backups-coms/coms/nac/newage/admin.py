import authtools.admin
from authtools.models import User
from django import forms
from django.conf.urls import url
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.urls import reverse
from django.shortcuts import redirect
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from dealerships.models import DealershipUser

from .models import Address
from .models import ArchiveFile
from .models import Postcode
from .models import Settings
from .models import State
from .models import Suburb


class UserAdmin(authtools.admin.NamedUserAdmin):
    list_display = authtools.admin.NamedUserAdmin.list_display + ('hijack_link', 'make_dealership_staff_link')

    def get_list_display(self, request):
        fields = super(UserAdmin, self).get_list_display(request)
        if not request.user.is_superuser:
            fields = [field for field in fields if field not in ('hijack_link', 'make_dealership_staff_link')]
        return fields

    @mark_safe    
    def hijack_link(self, user):
        hijack_url = reverse('hijack:login_with_id', args=(user.id,))
        return format_html('<a href="{}" class="button transformGetToCsrfPost">Impersonate</a>', hijack_url)
    hijack_link.allow_tags = True
    hijack_link.short_description = ''

    @mark_safe
    def make_dealership_staff_link(self, user):
        if not hasattr(user, 'dealershipuser'):
            convert_url = reverse('admin:make_dealership_staff', args=(user.id,))
            return format_html('<a href="{}" class="button transformGetToCsrfPost">Make Dealership Staff</a>', convert_url)
        return ''
    make_dealership_staff_link.allow_tags = True
    make_dealership_staff_link.short_description = ''

    def get_urls(self):
        urls = super(UserAdmin, self).get_urls()
        my_urls = [
            url(r'^admin/dealershipify/(?P<user_id>\d+)$', self.admin_site.admin_view(self.make_dealership_staff), name='make_dealership_staff'),
        ]
        return my_urls + urls

    def make_dealership_staff(self, request, *args, **kwargs):
        if request.user.is_anonymous or not request.user.is_superuser or not 'user_id' in kwargs:
            raise PermissionDenied

        try:
            user = User.objects.get(id=kwargs['user_id'])
        except User.DoesNotExist:
            raise PermissionDenied

        dealership_user = DealershipUser(user_ptr_id=user.pk)
        dealership_user.__dict__.update(user.__dict__)
        dealership_user.save()

        # use admin:reverse fails here due to middleware interfering.
        return redirect('/admin/dealerships/dealershipuser/%s/' % dealership_user.id)


class SettingsAdmin(admin.ModelAdmin):
    exclude = ('id', 'schedule_lockdown_month', 'schedule_lockdown_number')

    def has_add_permission(self, request):
        return not Settings.objects.all().exists()


class ArchiveFileAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'type',
        'gen_time',
    )


class PostcodeAdmin(admin.ModelAdmin):
    search_fields = ['number', 'state__name']


class SuburbAdmin(admin.ModelAdmin):
    search_fields = ['name', 'post_code__number', 'post_code__state__name']


class AddressAdminForm(forms.ModelForm):
    suburb = forms.ModelChoiceField(queryset=Suburb.objects.select_related('post_code__state').all().order_by('name'), widget=forms.Select(attrs={'style': 'width: auto;'}))


class AddressAdmin(admin.ModelAdmin):
    form = AddressAdminForm
    list_select_related = True


# Register your models here.
admin.site.register(State)
admin.site.register(Postcode, PostcodeAdmin)
admin.site.register(Suburb, SuburbAdmin)
admin.site.register(Address, AddressAdmin)
admin.site.register(Settings, SettingsAdmin)
# admin.site.register(ArchiveFile, ArchiveFileAdmin)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
