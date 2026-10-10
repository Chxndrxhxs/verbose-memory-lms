from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken

from .authentication import auth_app, clear_auth_cookies, cookie_names, set_auth_cookies
from .serializers import (
    CompleteProfileSerializer,
    SendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
    tokens_for,
)
from .services import send_otp


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = SendOTPSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        send_otp(s.validated_data["mobile"])
        payload: dict = {"message": "OTP sent"}
        # Dev only: tests and local toasts still need the code. Never in prod.
        if settings.DEBUG:
            from .models import OTP as OTPModel

            latest = (
                OTPModel.objects.filter(mobile=s.validated_data["mobile"], is_used=False)
                .order_by("-created_at")
                .first()
            )
            if latest is not None:
                payload["mock_code"] = latest.code
        return Response({"data": payload, "error": None})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = VerifyOTPSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.validated_data["user"]
        tokens = tokens_for(user)
        res = Response(
            {
                "data": {
                    "user": UserSerializer(user).data,
                    "is_new": s.validated_data["is_new"],
                },
                "error": None,
            }
        )
        return set_auth_cookies(res, tokens, auth_app(request))


class MeView(APIView):
    # The frontends read /users/me on load to learn profile state
    # (and account deletion must stay reachable).
    complete_profile_exempt = True

    def get(self, request):
        return Response({"data": UserSerializer(request.user).data, "error": None})

    def delete(self, request):
        request.user.delete()
        res = Response({"data": {"message": "Account deleted"}, "error": None})
        return clear_auth_cookies(res, auth_app(request))


class LogoutView(APIView):
    # Incomplete profiles must still be able to log out.
    complete_profile_exempt = True

    def post(self, request):
        res = Response({"data": {"message": "Logged out"}, "error": None})
        return clear_auth_cookies(res, auth_app(request))


class CompleteProfileView(APIView):
    # The endpoint that makes the profile complete — blocking it
    # would lock incomplete users out permanently.
    complete_profile_exempt = True

    def patch(self, request):
        s = CompleteProfileSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"data": UserSerializer(request.user).data, "error": None})


class BecomeInstructorView(APIView):
    # Role change is part of onboarding, not gated content.
    complete_profile_exempt = True

    def post(self, request):
        if request.user.role != "learner":
            return Response(
                {"data": None, "error": "Role change not allowed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.role = "instructor"
        request.user.save(update_fields=["role"])
        return Response({"data": UserSerializer(request.user).data, "error": None})


class CookieRefreshView(APIView):
    # Token refresh must keep working for incomplete profiles,
    # or they'd be logged out mid-onboarding.
    complete_profile_exempt = True

    permission_classes = [AllowAny]

    def post(self, request):
        app = auth_app(request)
        _, refresh_name = cookie_names(app)
        raw = request.COOKIES.get(refresh_name)
        if not raw:
            return Response(
                {"data": None, "error": "Missing refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(raw)
            user_id = refresh["user_id"]
        except InvalidToken:
            return Response(
                {"data": None, "error": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        from django.contrib.auth import get_user_model

        try:
            user = get_user_model().objects.get(id=user_id)
        except get_user_model().DoesNotExist:
            return Response(
                {"data": None, "error": "User not found"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        tokens = tokens_for(user)
        res = Response({"data": {"refreshed": True}, "error": None})
        return set_auth_cookies(res, tokens, app)
