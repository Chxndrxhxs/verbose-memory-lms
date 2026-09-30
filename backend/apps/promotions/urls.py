from django.urls import path

from .views import (
    claim_gift_view,
    create_gift_view,
    my_gifts_view,
    validate_coupon_view,
)

urlpatterns = [
    path("coupons/validate", validate_coupon_view),
    path("gifts", create_gift_view),
    path("gifts/mine", my_gifts_view),
    path("gifts/claim", claim_gift_view),
]
