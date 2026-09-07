from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only platform admins (role=admin or is_staff) may use the admin panel API."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", "") == "admin" or user.is_staff)
        )
