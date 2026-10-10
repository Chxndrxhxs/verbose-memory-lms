import logging

from django.conf import settings
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course
from apps.enrollments.services import enroll
from apps.packs.models import PackPurchase, QuestionPack
from apps.packs.services import grant_pack_purchase
from apps.promotions.models import Coupon, Gift
from apps.promotions.services import (
    fulfil_gift,
    normalize_code,
    price_paise,
    quote_coupon,
    record_free_redemption,
    record_redemption,
    validate_coupon,
)
from apps.users.permissions import RequireCompleteProfile

from .models import Payment
from .serializers import PaymentSerializer
from .services import create_razorpay_order, get_razorpay_client, verify_signature

logger = logging.getLogger(__name__)


def _coupon_error(exc: serializers.ValidationError) -> str:
    detail = exc.detail
    if isinstance(detail, dict):
        detail = next(iter(detail.values()), "Invalid coupon")
    if isinstance(detail, list):
        detail = detail[0] if detail else "Invalid coupon"
    return str(detail)


def _mock_order(
    user, amount_paise, currency, receipt, course=None, pack=None, coupon=None, discount_paise=0
):
    import uuid

    mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    Payment.objects.create(
        user=user,
        course=course,
        pack=pack,
        razorpay_order_id=mock_order_id,
        amount=amount_paise,
        currency=currency,
        status=Payment.Status.CREATED,
        coupon=coupon,
        discount_paise=discount_paise,
    )
    data: dict = {
        "order_id": mock_order_id,
        "amount": amount_paise,
        "currency": currency,
        "key_id": "rzp_test_mock",
        "mock": True,
    }
    if coupon is not None:
        data["coupon"] = coupon.code
        data["discount_paise"] = discount_paise
    return Response({"data": data, "error": None})


def _real_order(
    user, amount_paise, currency, receipt, course=None, pack=None, coupon=None, discount_paise=0
):
    try:
        order = create_razorpay_order(amount_paise, currency, receipt)
    except Exception:
        logger.exception("Razorpay order create failed")
        return Response(
            {"data": None, "error": "Payment provider unavailable"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    Payment.objects.create(
        user=user,
        course=course,
        pack=pack,
        razorpay_order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        status=Payment.Status.CREATED,
        coupon=coupon,
        discount_paise=discount_paise,
    )
    data: dict = {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
    }
    if coupon is not None:
        data["coupon"] = coupon.code
        data["discount_paise"] = discount_paise
    return Response({"data": data, "error": None})


def _create_item_order(
    user, amount_paise, receipt, course=None, pack=None, coupon=None, discount_paise=0
):
    currency = "INR"
    client = get_razorpay_client()
    if client is None and mock_payments_allowed():
        return _mock_order(
            user, amount_paise, currency, receipt, course, pack, coupon, discount_paise
        )
    return _real_order(user, amount_paise, currency, receipt, course, pack, coupon, discount_paise)


def mock_payments_allowed() -> bool:
    """Mock orders exist for local dev only: explicit flag, never DEBUG alone."""
    return bool(getattr(settings, "ALLOW_MOCK_PAYMENTS", False))


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def create_order(request):
    course_id = request.data.get("course_id")
    pack_id = request.data.get("pack_id")
    coupon_code = request.data.get("coupon_code", "")
    if bool(course_id) == bool(pack_id):
        return Response(
            {"data": None, "error": "Provide exactly one of course_id, pack_id"}, status=400
        )
    if course_id:
        return _course_order(request, course_id, coupon_code)
    return _pack_order(request, pack_id, coupon_code)


def _resolve_coupon(coupon_code, user, course=None, pack=None):
    """Return (coupon, error_response). Coupons only apply to paid items."""
    if not normalize_code(coupon_code):
        return None, None
    try:
        return validate_coupon(coupon_code, user, course=course, pack=pack), None
    except serializers.ValidationError as exc:
        return None, Response(
            {"data": None, "error": _coupon_error(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _course_order(request, course_id, coupon_code=""):
    try:
        course = Course.objects.get(id=course_id, status=Course.Status.PUBLISHED)
    except Course.DoesNotExist:
        return Response({"data": None, "error": "Course not found"}, status=404)

    # free course: enroll directly, no payment needed (coupons don't apply)
    if course.price == 0:
        enrollment = enroll(request.user, course)
        return Response(
            {
                "data": {"free": True, "enrolled": True, "enrollment_id": enrollment.id},
                "error": None,
            }
        )

    # already enrolled?
    from apps.enrollments.models import Enrollment

    if Enrollment.objects.filter(learner=request.user, course=course).exists():
        return Response({"data": {"already_enrolled": True}, "error": None})

    coupon, error = _resolve_coupon(coupon_code, request.user, course=course)
    if error is not None:
        return error
    full = price_paise(course)
    discount, final = quote_coupon(coupon, full) if coupon else (0, full)

    # 100% coupon: no payment needed, but the redemption still counts.
    if coupon is not None and final == 0:
        with transaction.atomic():
            record_free_redemption(coupon=coupon, user=request.user, course=course)
        enrollment = enroll(request.user, course)
        return Response(
            {
                "data": {
                    "free": True,
                    "enrolled": True,
                    "enrollment_id": enrollment.id,
                    "coupon": coupon.code,
                    "discount_paise": discount,
                },
                "error": None,
            }
        )

    return _create_item_order(
        request.user,
        final,
        f"course_{course.id}_user_{request.user.id}",
        course=course,
        coupon=coupon,
        discount_paise=discount,
    )


def _pack_order(request, pack_id, coupon_code=""):
    try:
        pack = QuestionPack.objects.get(id=pack_id, status=QuestionPack.Status.PUBLISHED)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)

    # free pack: grant directly, no payment needed (coupons don't apply)
    if pack.price == 0:
        purchase = grant_pack_purchase(request.user, pack)
        return Response(
            {
                "data": {"free": True, "owned": True, "purchase_id": purchase.id},
                "error": None,
            }
        )

    if PackPurchase.objects.filter(learner=request.user, pack=pack).exists():
        return Response({"data": {"already_owned": True}, "error": None})

    coupon, error = _resolve_coupon(coupon_code, request.user, pack=pack)
    if error is not None:
        return error
    full = price_paise(pack)
    discount, final = quote_coupon(coupon, full) if coupon else (0, full)

    if coupon is not None and final == 0:
        with transaction.atomic():
            record_free_redemption(coupon=coupon, user=request.user, pack=pack)
        purchase = grant_pack_purchase(request.user, pack)
        return Response(
            {
                "data": {
                    "free": True,
                    "owned": True,
                    "purchase_id": purchase.id,
                    "coupon": coupon.code,
                    "discount_paise": discount,
                },
                "error": None,
            }
        )

    return _create_item_order(
        request.user,
        final,
        f"pack_{pack.id}_user_{request.user.id}",
        pack=pack,
        coupon=coupon,
        discount_paise=discount,
    )


def _fulfil(payment):
    """Mark paid and grant the purchased item. Revenue sharing plugs in here later."""
    try:
        gift = payment.gift
    except Gift.DoesNotExist:
        gift = None
    if gift is not None:
        if gift.status == Gift.Status.PENDING:
            gift.status = Gift.Status.PAID
            gift.save(update_fields=["status", "updated_at"])
        return fulfil_gift(gift)
    if payment.course_id:
        enrollment = enroll(payment.user, payment.course)
        return {"enrollment_id": enrollment.id}
    purchase = grant_pack_purchase(payment.user, payment.pack, payment=payment)
    return {"purchase_id": purchase.id}


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def verify_payment(request):
    order_id = request.data.get("razorpay_order_id")
    payment_id = request.data.get("razorpay_payment_id")
    signature = request.data.get("razorpay_signature")
    course_id = request.data.get("course_id")
    pack_id = request.data.get("pack_id")

    if not all([order_id, payment_id, signature]):
        return Response(
            {"data": None, "error": "Missing payment fields"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if bool(course_id) == bool(pack_id):
        return Response(
            {"data": None, "error": "Provide exactly one of course_id, pack_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            payment = (
                Payment.objects.select_related("course", "pack")
                .select_for_update()
                .get(razorpay_order_id=order_id, user=request.user)
            )
            # Item + amount are checked BEFORE anything is marked paid, so a
            # swapped id or tampered amount can never mint an entitlement.
            if course_id and str(payment.course_id) != str(course_id):
                return Response(
                    {"data": None, "error": "Course mismatch"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if pack_id and str(payment.pack_id) != str(pack_id):
                return Response(
                    {"data": None, "error": "Pack mismatch"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if payment.course_id is None and payment.pack_id is None:
                return Response(
                    {"data": None, "error": "Order has no item"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            expected = _expected_amount_paise(payment)
            if expected is not None and payment.amount != expected:
                logger.warning(
                    "Payment amount mismatch order=%s stored=%s expected=%s",
                    order_id,
                    payment.amount,
                    expected,
                )
                payment.status = Payment.Status.FAILED
                payment.save(update_fields=["status", "updated_at"])
                return Response(
                    {"data": None, "error": "Amount mismatch"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Idempotent: a retried webhook/double-tap replays fulfilment
            # without double-charging or double-granting.
            if payment.status == Payment.Status.PAID:
                return Response({"data": {"verified": True, **_fulfil(payment)}, "error": None})

            is_mock = order_id.startswith("order_mock_")
            if is_mock:
                if not mock_payments_allowed():
                    return Response(
                        {"data": None, "error": "Mock payments are disabled"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            elif not verify_signature(order_id, payment_id, signature):
                payment.status = Payment.Status.FAILED
                payment.save(update_fields=["status", "updated_at"])
                return Response(
                    {"data": None, "error": "Signature verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.status = Payment.Status.PAID
            payment.save(
                update_fields=["razorpay_payment_id", "razorpay_signature", "status", "updated_at"]
            )
            if payment.coupon_id and payment.coupon is not None:
                try:
                    record_redemption(
                        coupon=payment.coupon,
                        user=payment.user,
                        payment=payment,
                        course=payment.course,
                        pack=payment.pack,
                    )
                except Coupon.DoesNotExist:
                    logger.warning(
                        "Coupon vanished for order %s; honouring charged price", order_id
                    )
            return Response(
                {"data": {"verified": True, "mock": is_mock, **_fulfil(payment)}, "error": None}
            )
    except Payment.DoesNotExist:
        return Response(
            {"data": None, "error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
        )


def _expected_amount_paise(payment) -> int | None:
    base: int | None = None
    if payment.course_id and payment.course is not None:
        base = int(payment.course.price * 100)
    elif payment.pack_id and payment.pack is not None:
        base = int(payment.pack.price * 100)
    if base is None:
        return None
    # Orders store the post-discount amount; the snapshot keeps verification
    # stable even if the coupon is later edited or deleted.
    return max(base - int(payment.discount_paise or 0), 0)


@api_view(["GET"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def my_payments(request):
    qs = (
        Payment.objects.filter(user=request.user, status=Payment.Status.PAID)
        .select_related("course", "course__instructor", "pack", "pack__owner")
        .order_by("-created_at")
    )
    from core.pagination import paginate_queryset_view

    paged = paginate_queryset_view(request, qs, PaymentSerializer)
    if paged is not None:
        return paged
    return Response({"data": PaymentSerializer(qs, many=True).data, "error": None})
