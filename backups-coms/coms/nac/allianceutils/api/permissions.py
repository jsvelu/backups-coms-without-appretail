from django.core.exceptions import ImproperlyConfigured
from rest_framework.permissions import BasePermission
from rest_framework.permissions import IsAuthenticated


class SimpleDjangoObjectPermissions(BasePermission):
    """
    Differs from just using DjangoObjectPermissions because it
    - does not require a queryset
    - uses a single permission for all request methods

    Note the DRF documentation:
    http://www.django-rest-framework.org/api-guide/permissions/#object-level-permissions
    get_object() is only required if you want to implement object-level permissions

    Also note that if you override get_object() then you need to manually invoke
    self.check_object_permissions(self.request, obj)
    """
    def has_permission(self, request, view):
        return request.user.has_perm(view.permission_required)

    def has_object_permission(self, request, view, obj):
        return request.user.has_perm(view.permission_required, obj)


class PermissionRequiredAPIMixin(object):
    """
    Glues django-rest-framework permissions checking together with simple django per-object permissions checks

    Usage:
    class MyAPIView(APIView):
        permission_required = 'my_module.my_permission'

        def get_object(self):
            obj = get_object_or_404(self.get_queryset())
            self.check_object_permissions(self.request, obj)
            return obj
    """
    permission_classes = (IsAuthenticated, SimpleDjangoObjectPermissions,)


class GenericDjangoViewsetPermissions(BasePermission):
    """
    Map viewset actions to Django permissions.
    You may subclass this class, and provide an actions_to_perms_map attribute,
    which will override the default value for any keys present. That is, if
    you specify, for instance,
        actions_to_perms_map = {
            'create': []
        }
    then no permissions will be required for the create action, but permissions
    for other actions will remain unchanged.
    """

    # Maps actions to required permission strings. *All* strings must be present
    # to allow the action.
    default_actions_to_perms_map = {
        'list':     ['%(app_label)s.view_%(model_name)s'],
        'retrieve': ['%(app_label)s.view_%(model_name)s'],
        'create':   ['%(app_label)s.add_%(model_name)s'],
        'update':   ['%(app_label)s.change_%(model_name)s'],
        'partial_update': ['%(app_label)s.change_%(model_name)s'],
        'destroy':  ['%(app_label)s.delete_%(model_name)s'],
    }

    # Default (undecorated) routes that should not perform an object
    # permission check [since get_object() makes no sense].
    default_list_routes = (
        'list',
        'create',
    )

    def __init__(self):
        self._saved_actions_to_perms_map = None

    def get_actions_to_perms_map(self):
        """
        Merge the default actions to perms map with the class overrides & return
        Will cache results
        """
        if self._saved_actions_to_perms_map is None:
            self._saved_actions_to_perms_map = self.default_actions_to_perms_map.copy()
            self._saved_actions_to_perms_map.update(getattr(self, 'actions_to_perms_map', {}))

        return self._saved_actions_to_perms_map

    def get_permissions_for_action(self, action, view):
        """Given a model and an action, return the list of permission
        codes that the user is required to have."""

        model_cls = view.queryset.model
        kwargs = {
            'app_label': model_cls._meta.app_label,
            'model_name': model_cls._meta.model_name,
        }
        perms_map = self.get_actions_to_perms_map()
        try:
            return [perm % kwargs for perm in perms_map[action]]
        except KeyError:
            raise ImproperlyConfigured('Missing GenericDjangoViewsetPermissions action permission for %s' % action)

    def get_list_actions(self, viewset):
        """
        Get the list actions; these will not have get_object() invoked when checking permissions
        """
        viewset_class = viewset.__class__

        # Is this really ok to be caching on this another object?
        if not hasattr(viewset_class, '_saved_permission_list_actions'):
            viewset_class._saved_permission_list_actions = set(self.default_list_routes)

            # Determine any `@list_route` decorated methods on the viewset
            for methodname in dir(viewset_class):
                method = getattr(viewset_class, methodname)
                http_methods = getattr(method, 'bind_to_methods', None)
                # Only certain methods do not require an object
                if http_methods and all(m.lower() in ('header', 'get', 'post',) for m in http_methods):
                    if getattr(method, 'detail', None) is False:
                        viewset_class._saved_permission_list_actions.add(methodname)

        return viewset_class._saved_permission_list_actions

    def has_permission(self, request, viewset):

        action = getattr(viewset, 'action', None)

        # Handles OPTION requests
        if action is None:
            return True

        user = request.user
        perms = self.get_permissions_for_action(action, viewset)

        # Check permissions for action available irrespective of object
        if user.has_perms(perms):
            return True

        # Action relates to object, check object level permission
        if action not in self.get_list_actions(viewset):
            # This should invoke self.check_object_permissions() which
            # will then invoke has_object_permission()
            viewset.get_object()   # will raise an exception if permission denied
            return True

        return False

    def has_object_permission(self, request, viewset, obj):
        action = viewset.action
        perms = self.get_permissions_for_action(action, viewset)
        user = request.user
        return user.has_perms(perms, obj)
