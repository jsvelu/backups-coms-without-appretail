from django.contrib import admin

from .models import Build
from .models import Checklist
from .models import CoilType
from .models import Outcome
from .models import OutcomeImage
from .models import OutcomeNote
from .models import Step


class StepInline(admin.TabularInline):
    model = Step
    list_display = ('display_order', 'name')
    extra = 0
    ordering = ('display_order', 'name')
    list_display_links = ('name',)


class ChecklistAdmin(admin.ModelAdmin):
    list_display = ('section', 'display_order', 'name')
    list_display_links = ('name',)
    ordering = ('section', 'display_order', 'name')
    inlines = [
        StepInline,
    ]


# admin.site.register(Build)
# admin.site.register(CoilType)
# admin.site.register(Checklist, ChecklistAdmin)
# admin.site.register(Step)
# admin.site.register(Outcome)
# admin.site.register(OutcomeNote)
# admin.site.register(OutcomeImage)
