from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    CompleteProfileSerializer,
    SendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
    tokens_for,
)
from .services import send_otp

ACCESS_MAX_AGE = 1800
REFRESH_MAX_AGE = 604800


def set_auth_cookies(res: Response, tokens: dict) -> Response:
    secure = not settings.DEBUG
    res.set_cookie(
        "access_token",
        tokens["access"],
        httponly=True,
        secure=secure,
        samesite="Lax",
        max_age=ACCESS_MAX_AGE,
        path="/",
    )
    res.set_cookie(
        "refresh_token",
        tokens["refresh"],
        httponly=True,
        secure=secure,
        samesite="Lax",
        max_age=REFRESH_MAX_AGE,
        path="/",
    )
    return res


class SendOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "send_otp"

    def post(self, request):
        s = SendOTPSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        otp = send_otp(s.validated_data["mobile"])
        return Response({"data": {"message": "OTP sent", "mock_code": otp.code}, "error": None})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verify_otp"

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
        return set_auth_cookies(res, tokens)


class MeView(APIView):
    def get(self, request):
        return Response({"data": UserSerializer(request.user).data, "error": None})

    def delete(self, request):
        request.user.delete()
        res = Response({"data": {"message": "Account deleted"}, "error": None})
        res.delete_cookie("access_token", path="/")
        res.delete_cookie("refresh_token", path="/")
        return res


class LogoutView(APIView):
    def post(self, request):
        res = Response({"data": {"message": "Logged out"}, "error": None})
        res.delete_cookie("access_token", path="/")
        res.delete_cookie("refresh_token", path="/")
        return res


class CompleteProfileView(APIView):
    def patch(self, request):
        s = CompleteProfileSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"data": UserSerializer(request.user).data, "error": None})


class BecomeInstructorView(APIView):
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
    permission_classes = [AllowAny]

    def post(self, request):
        raw = request.COOKIES.get("refresh_token")
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
        return set_auth_cookies(Response({"data": {"refreshed": True}, "error": None}), tokens)
