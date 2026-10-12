from django.urls import path

from .views import (
    claim_gift_view,
    create_gift_view,
    my_gifts_view,
    validate_coupon_view,
)
from .views_instructor import (
    instructor_coupon_detail,
    instructor_coupons_list,
)

urlpatterns = [
    path("coupons/validate", validate_coupon_view),
    path("gifts", create_gift_view),
    path("gifts/mine", my_gifts_view),
    path("gifts/claim", claim_gift_view),
    path("instructor/coupons", instructor_coupons_list),
    path("instructor/coupons/<int:coupon_id>", instructor_coupon_detail),
]
