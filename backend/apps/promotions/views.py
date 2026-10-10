import logging
import uuid

from django.conf import settings
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course
from apps.packs.models import QuestionPack
from apps.payments.models import Payment
from apps.payments.services import create_razorpay_order, get_razorpay_client
from apps.users.permissions import RequireCompleteProfile

from .models import Gift
from .serializers import GiftSerializer
from .services import (
    claim_gift,
    create_gift,
    fulfil_gift,
    normalize_code,
    price_paise,
    quote_coupon,
    record_free_redemption,
    validate_coupon,
)

logger = logging.getLogger(__name__)


def _first_error(exc: serializers.ValidationError) -> str:
    detail = exc.detail
    if isinstance(detail, dict):
        detail = next(iter(detail.values()), "Invalid request")
    if isinstance(detail, list):
        detail = detail[0] if detail else "Invalid request"
    return str(detail)


def _resolve_item(course_id, pack_id):
    """Return (course, pack) or an error Response (404 item, 400 bad pair)."""
    if bool(course_id) == bool(pack_id):
        return None, Response(
            {"data": None, "error": "Provide exactly one of course_id, pack_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if course_id:
        try:
            return (
                Course.objects.get(id=course_id, status=Course.Status.PUBLISHED),
                None,
            ), None
        except Course.DoesNotExist:
            return None, Response(
                {"data": None, "error": "Course not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
    try:
        pack = QuestionPack.objects.get(id=pack_id, status=QuestionPack.Status.PUBLISHED)
    except QuestionPack.DoesNotExist:
        return None, Response(
            {"data": None, "error": "Pack not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    return (None, pack), None


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def validate_coupon_view(request):
    (course, pack), error = _resolve_item(
        request.data.get("course_id"), request.data.get("pack_id")
    )
    if error is not None:
        return error
    item = course or pack
    try:
        coupon = validate_coupon(
            request.data.get("code", ""), request.user, course=course, pack=pack
        )
    except serializers.ValidationError as exc:
        return Response(
            {"data": None, "error": _first_error(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    original = price_paise(item)
    discount, final = quote_coupon(coupon, original)
    return Response(
        {
            "data": {
                "code": coupon.code,
                "discount_type": coupon.discount_type,
                "discount_value": coupon.discount_value,
                "discount_paise": discount,
                "original_amount_paise": original,
                "final_amount_paise": final,
                "currency": "INR",
            },
            "error": None,
        }
    )


def _mock_gift_order(gift, payment_amount, coupon, discount):
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    payment = Payment.objects.create(
        user=gift.giver,
        course=gift.course,
        pack=gift.pack,
        razorpay_order_id=mock_order_id,
        amount=payment_amount,
        currency="INR",
        status=Payment.Status.CREATED,
        coupon=coupon,
        discount_paise=discount,
    )
    gift.payment = payment
    gift.save(update_fields=["payment", "updated_at"])
    return Response(
        {
            "data": {
                "gift": GiftSerializer(gift).data,
                "order_id": mock_order_id,
                "amount": payment_amount,
                "currency": "INR",
                "key_id": "rzp_test_mock",
                "mock": True,
            },
            "error": None,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def create_gift_view(request):
    (course, pack), error = _resolve_item(
        request.data.get("course_id"), request.data.get("pack_id")
    )
    if error is not None:
        return error
    item = course or pack
    coupon = None
    if normalize_code(request.data.get("coupon_code", "")):
        try:
            coupon = validate_coupon(
                request.data.get("coupon_code", ""), request.user, course=course, pack=pack
            )
        except serializers.ValidationError as exc:
            return Response(
                {"data": None, "error": _first_error(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
    try:
        with transaction.atomic():
            gift = create_gift(
                giver=request.user,
                course_id=course.id if course else None,
                pack_id=pack.id if pack else None,
                recipient_email=request.data.get("recipient_email", ""),
                recipient_name=request.data.get("recipient_name", ""),
                message=request.data.get("message", ""),
                coupon=coupon,
            )
    except serializers.ValidationError as exc:
        return Response(
            {"data": None, "error": _first_error(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    original = price_paise(item)
    discount, final = quote_coupon(coupon, original) if coupon else (0, original)

    # Free item, or a 100% coupon: no payment needed.
    if original == 0 or final == 0:
        with transaction.atomic():
            gift = Gift.objects.select_for_update().get(id=gift.id)
            if coupon:
                record_free_redemption(coupon=coupon, user=request.user, course=course, pack=pack)
            gift.status = Gift.Status.PAID
            gift.save(update_fields=["status", "updated_at"])
        result = fulfil_gift(gift)
        gift.refresh_from_db()
        return Response(
            {
                "data": {
                    "gift": GiftSerializer(gift).data,
                    "free": True,
                    "discount_paise": discount,
                    **result,
                },
                "error": None,
            }
        )

    if get_razorpay_client() is None and bool(getattr(settings, "ALLOW_MOCK_PAYMENTS", False)):
        return _mock_gift_order(gift, final, coupon, discount)

    try:
        order = create_razorpay_order(final, "INR", f"gift_{gift.id}_user_{request.user.id}")
    except Exception:
        logger.exception("Razorpay gift order create failed")
        gift.delete()
        return Response(
            {"data": None, "error": "Payment provider unavailable"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    payment = Payment.objects.create(
        user=request.user,
        course=course,
        pack=pack,
        razorpay_order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        status=Payment.Status.CREATED,
        coupon=coupon,
        discount_paise=discount,
    )
    gift.payment = payment
    gift.save(update_fields=["payment", "updated_at"])
    return Response(
        {
            "data": {
                "gift": GiftSerializer(gift).data,
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
            },
            "error": None,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def claim_gift_view(request):
    try:
        result = claim_gift(request.user, request.data.get("code", ""))
    except serializers.ValidationError as exc:
        return Response(
            {"data": None, "error": _first_error(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({"data": result, "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def my_gifts_view(request):
    given = (
        Gift.objects.filter(giver=request.user)
        .select_related("course", "pack")
        .order_by("-created_at")
    )
    claimable = Gift.objects.none()
    if request.user.email:
        claimable = (
            Gift.objects.filter(
                recipient_email__iexact=request.user.email.strip(),
                status=Gift.Status.PAID,
            )
            .select_related("course", "pack")
            .order_by("-created_at")
        )
    return Response(
        {
            "data": {
                "given": GiftSerializer(given, many=True).data,
                "claimable": GiftSerializer(claimable, many=True).data,
            },
            "error": None,
        }
    )
