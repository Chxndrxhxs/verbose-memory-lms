from django.urls import path

from .views import (
    BecomeInstructorView,
    CompleteProfileView,
    CookieRefreshView,
    LogoutView,
    MeView,
    SendOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("auth/send-otp", SendOTPView.as_view()),
    path("auth/verify-otp", VerifyOTPView.as_view()),
    path("auth/refresh", CookieRefreshView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/complete-profile", CompleteProfileView.as_view()),
    path("auth/become-instructor", BecomeInstructorView.as_view()),
    path("users/me", MeView.as_view()),
]
