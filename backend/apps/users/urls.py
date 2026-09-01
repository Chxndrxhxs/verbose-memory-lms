from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    BecomeInstructorView,
    CompleteProfileView,
    LogoutView,
    MeView,
    SendOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("auth/send-otp", SendOTPView.as_view()),
    path("auth/verify-otp", VerifyOTPView.as_view()),
    path("auth/refresh", TokenRefreshView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/complete-profile", CompleteProfileView.as_view()),
    path("auth/become-instructor", BecomeInstructorView.as_view()),
    path("users/me", MeView.as_view()),
]
