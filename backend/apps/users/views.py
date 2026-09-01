from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

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
        otp = send_otp(s.validated_data["mobile"])
        return Response({"data": {"message": "OTP sent", "mock_code": otp.code}, "error": None})


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
                    "tokens": tokens,
                    "is_new": s.validated_data["is_new"],
                },
                "error": None,
            }
        )
        res.set_cookie(
            "access_token",
            tokens["access"],
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=1800,
            path="/",
        )
        res.set_cookie(
            "refresh_token",
            tokens["refresh"],
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=604800,
            path="/",
        )
        return res


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
        request.user.role = "instructor"
        request.user.save(update_fields=["role"])
        return Response({"data": UserSerializer(request.user).data, "error": None})
