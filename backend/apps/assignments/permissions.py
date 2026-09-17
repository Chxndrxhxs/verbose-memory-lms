from rest_framework.permissions import BasePermission


class IsInstructor(BasePermission):
    """Instructors and platform admins may manage assignments."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", "") in ("admin", "instructor") or user.is_staff)
        )
