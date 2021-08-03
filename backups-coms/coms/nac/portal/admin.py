from django.contrib import admin

# Register your models here.

class PortalImageAdmin(admin.ModelAdmin):
    list_display = ('image_file', 'recorded_on')

# admin.site.register(PortalImage, PortalImageAdmin)
# admin.site.register(PortalImageCollection)
