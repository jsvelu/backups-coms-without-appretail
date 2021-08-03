import datetime

from allianceutils.api.mixins import CacheObjectMixin
from allianceutils.api.permissions import GenericDjangoViewsetPermissions
from django.utils import dateparse
from rest_framework import generics
from rest_framework.decorators import action
from rest_framework.fields import CurrentUserDefault
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import rest_framework.serializers as serializers
from rest_framework.viewsets import GenericViewSet

from ..models import Build
from ..models import BuildNote
from ..models import ChecklistOverride


class BuildViewSet(CacheObjectMixin, GenericViewSet):

    queryset = Build.objects.all()

    class BuildViewPermissions(GenericDjangoViewsetPermissions):
        actions_to_perms_map = {
            'date_priority': ['production.change_build_date_priority'],
            'priority': ['production.change_build_priority'],
        }

    permission_classes = (IsAuthenticated, BuildViewPermissions,)

    def _patch(self, request, pk, Serializer):
        """
        Simple Builld record patch request cycle
        :param request: HttpRequest
        :param pk: primary key value
        :param Serializer: serializer to use
        :return:
        """
        build = self.get_object()
        serializer = Serializer(instance=build, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def priority(self, request, pk):

        class BuildPrioritySerializer(serializers.ModelSerializer):
            def to_internal_value(self, data):
                return super(BuildPrioritySerializer, self).to_internal_value({
                    'build_priority': data.get('buildPriorityId'),
                })

            def to_representation(self, instance):
                return {'buildPriorityId': instance.build_priority}

            class Meta:
                model = Build
                fields = ('build_priority',)

        return self._patch(request, pk, BuildPrioritySerializer)

    @action(detail=True, methods=['patch'])
    def date_priority(self, request, pk):
        class BuildDatePrioritySerializer(serializers.ModelSerializer):
            def to_internal_value(self, data):
                return super(BuildDatePrioritySerializer, self).to_internal_value({
                    'build_date': dateparse.parse_date(data.get('buildDate')),
                    'build_priority': data.get('buildPriorityId'),
                })

            def to_representation(self, instance):
                return {
                    'buildDate': instance.build_date,
                    'buildPriorityId': instance.build_priority,
                }

            class Meta:
                model = Build
                fields = ('build_date', 'build_priority',)

        return self._patch(request, pk, BuildDatePrioritySerializer)


class ChecklistOverrideSerializer(serializers.ModelSerializer):
    recorded_by = serializers.HiddenField(default=CurrentUserDefault())
    recorded_on = serializers.HiddenField(default=datetime.datetime.now)
    # DRF automatically generated  field seems to not allow null if the model field has a choices= entry so define manually
    is_complete = serializers.NullBooleanField()

    def to_internal_value(self, data):
        try:
            is_complete = {100: True, 0: False, None: None}[data['overrideValue']]
        except KeyError:
            raise serializers.ValidationError({'is_complete': 'Invalid Value'})
        return super(ChecklistOverrideSerializer, self).to_internal_value({'is_complete': is_complete})

    class Meta:
        model = ChecklistOverride
        fields = (
            'is_complete',
            'recorded_by',
            'recorded_on',
        )
        read_only_fields = (
            'build_id',
            'checklist_id',
        )


class ChecklistOverrideAPIView(generics.UpdateAPIView):
    permission_required = 'production.modify_checklistoverride'
    serializer_class = ChecklistOverrideSerializer

    def get_object(self):
        build_id = self.kwargs['build_id']
        checklist_id = self.kwargs['checklist_id']
        try:
            override = ChecklistOverride.objects.get(build_id=build_id, checklist_id=checklist_id)
        except ChecklistOverride.DoesNotExist:
            override = ChecklistOverride(build_id=build_id, checklist_id=checklist_id)

        self.check_object_permissions(self.request, override)

        return override


class BuildNoteSerializer(serializers.ModelSerializer):
    recorded_by = serializers.HiddenField(default=CurrentUserDefault())
    recorded_on = serializers.HiddenField(default=datetime.datetime.now)

    class Meta:
        model = BuildNote
        fields = (
            'build',
            'checklist',
            'recorded_by',
            'recorded_on',
            'text',
        )


class BuildNoteAPIView(generics.ListCreateAPIView):
    class BuildNoteViewPermissions(GenericDjangoViewsetPermissions):
        actions_to_perms_map = {
            'create': ['production.add_buildnote'],
        }

    permission_classes = (IsAuthenticated, BuildNoteViewPermissions,)
    serializer_class = BuildNoteSerializer

    def create(self, request, *args, **kwargs):
        # treat url params as data
        request.data.update(kwargs)
        return super(BuildNoteAPIView, self).create(request, *args, **kwargs)
