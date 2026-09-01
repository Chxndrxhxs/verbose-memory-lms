from django.urls import path

from .views import create_order, verify_payment

urlpatterns = [
    path("payments/create-order", create_order),
    path("payments/verify", verify_payment),
]
