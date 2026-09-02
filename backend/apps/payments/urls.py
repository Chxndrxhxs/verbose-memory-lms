from django.urls import path

from .views import create_order, my_payments, verify_payment

urlpatterns = [
    path("payments/create-order", create_order),
    path("payments/verify", verify_payment),
    path("payments/my-payments", my_payments),
]
