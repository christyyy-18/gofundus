from rest_framework.permissions import BasePermission


def user_role(user):
    profile = getattr(user, 'profile', None)
    return profile.role if profile else None


class IsSystemAdmin(BasePermission):
    message = 'System administrator access required.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_staff or user_role(request.user) == 'system_admin'
        )


class IsInstitutionOwnerOrSystemAdmin(BasePermission):
    message = 'Institution administrator access required.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_staff or user_role(request.user) == 'system_admin':
            return True
        return (
            user_role(request.user) == 'institution_admin'
            and view.action in {'update', 'partial_update'}
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or user_role(request.user) == 'system_admin':
            return True
        return (
            user_role(request.user) == 'institution_admin'
            and obj.user_id == request.user.id
        )
