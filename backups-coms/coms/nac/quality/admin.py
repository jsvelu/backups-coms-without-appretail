from django.contrib import admin

from .models import OrderQAItem
from .models import OrderQAItemPhoto
from .models import QAItem
from .models import QAType


class OrderQAItemPhotoAdmin(admin.ModelAdmin):

    list_display = ('image_tag', 'order_qa_item',)

# Register your models here.
# admin.site.register(QAType)
# admin.site.register(QAItem)
# admin.site.register(OrderQAItem)
# admin.site.register(OrderQAItemPhoto, OrderQAItemPhotoAdmin)
