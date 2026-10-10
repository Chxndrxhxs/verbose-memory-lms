from rest_framework.permissions import BasePermission

from .models import User


class RequireCompleteProfile(BasePermission):
    """Learners and instructors must finish /auth/complete-profile
    (name, email, age, city) before using any protected endpoint.

    Admins are exempt — the admin app has no complete-profile step
    (admins are provisioned via the create_admin CLI). Auth-flow
    endpoints an incomplete user still needs (complete-profile
    itself, logout, token refresh, /users/me) mark themselves exempt
    with `complete_profile_exempt = True`; avatar upload stays on
    plain IsAuthenticated because it is part of onboarding and a
    gated user has nothing to attach an upload to.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            # IsAuthenticated / AllowAny on the view decides.
            return True
        if user.is_staff or getattr(user, "role", "") == User.Role.ADMIN:
            return True
        if getattr(view, "complete_profile_exempt", False):
            return True
        return user.profile_complete
