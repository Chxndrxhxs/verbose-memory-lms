import logging
import secrets

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import serializers

from apps.courses.models import Course
from apps.packs.models import QuestionPack

from .models import Coupon, CouponRedemption, Gift

logger = logging.getLogger(__name__)

User = get_user_model()


def normalize_code(raw) -> str:
    return str(raw or "").strip().upper()


def price_paise(item) -> int:
    return int(item.price * 100)


def quote_coupon(coupon: Coupon, item_price_paise: int) -> tuple[int, int]:
    """Return (discount_paise, final_amount_paise) for a validated coupon."""
    if coupon.discount_type == Coupon.DiscountType.FLAT:
        discount = min(int(coupon.discount_value), item_price_paise)
    else:
        discount = item_price_paise * min(int(coupon.discount_value), 100) // 100
        if coupon.max_discount_paise is not None:
            discount = min(discount, int(coupon.max_discount_paise))
    discount = max(min(discount, item_price_paise), 0)
    return discount, item_price_paise - discount


def validate_coupon(code, user, *, course=None, pack=None) -> Coupon:
    """Raise ValidationError unless the code is redeemable by user for this item."""
    normalized = normalize_code(code)
    if not normalized:
        raise serializers.ValidationError("Coupon code is required.")
    if bool(course) == bool(pack):
        raise serializers.ValidationError("Provide exactly one of course_id, pack_id.")
    try:
        coupon = Coupon.objects.get(code=normalized)
    except Coupon.DoesNotExist:
        raise serializers.ValidationError("Invalid or expired coupon code.") from None
    now = timezone.now()
    if (
        not coupon.is_active
        or (coupon.valid_from and now < coupon.valid_from)
        or (coupon.valid_to and now > coupon.valid_to)
    ):
        raise serializers.ValidationError("Invalid or expired coupon code.")
    if course is not None and coupon.applies_to == Coupon.Scope.PACK:
        raise serializers.ValidationError("This coupon is not valid for this course.")
    if pack is not None and coupon.applies_to == Coupon.Scope.COURSE:
        raise serializers.ValidationError("This coupon is not valid for this pack.")
    if coupon.applies_to == Coupon.Scope.COURSE and coupon.course_id != course.id:
        raise serializers.ValidationError("This coupon is not valid for this course.")
    if coupon.applies_to == Coupon.Scope.PACK and coupon.pack_id != pack.id:
        raise serializers.ValidationError("This coupon is not valid for this pack.")
    item_price = price_paise(course or pack)
    if item_price < int(coupon.min_order_paise):
        minimum = int(coupon.min_order_paise) / 100
        raise serializers.ValidationError(
            f"This coupon needs a minimum order of \u20b9{minimum:,.0f}."
        )
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        raise serializers.ValidationError("This coupon has reached its usage limit.")
    used = CouponRedemption.objects.filter(coupon=coupon, user=user).count()
    if used >= coupon.per_user_limit:
        raise serializers.ValidationError("You have already used this coupon.")
    return coupon


def record_redemption(*, coupon: Coupon, user, payment, course=None, pack=None) -> CouponRedemption:
    """Atomically count one redemption. Safe to call inside the verify transaction."""
    with transaction.atomic():
        locked = Coupon.objects.select_for_update().get(id=coupon.id)
        discount, _ = quote_coupon(locked, price_paise(course or pack))
        redemption, created = CouponRedemption.objects.get_or_create(
            payment=payment,
            defaults={
                "coupon": locked,
                "user": user,
                "course": course,
                "pack": pack,
                "discount_paise": discount,
            },
        )
        if created:
            # The price was already charged at order time, so usage is always
            # recorded — a coupon pulled mid-checkout never strands a payment.
            Coupon.objects.filter(id=locked.id).update(usage_count=F("usage_count") + 1)
        return redemption


def record_free_redemption(*, coupon: Coupon, user, course=None, pack=None) -> CouponRedemption:
    """Count a 100%-off redemption that needed no payment row."""
    with transaction.atomic():
        locked = Coupon.objects.select_for_update().get(id=coupon.id)
        discount, _ = quote_coupon(locked, price_paise(course or pack))
        redemption, created = CouponRedemption.objects.get_or_create(
            coupon=locked,
            user=user,
            course=course,
            pack=pack,
            payment=None,
            defaults={"discount_paise": discount},
        )
        if created:
            Coupon.objects.filter(id=locked.id).update(usage_count=F("usage_count") + 1)
        return redemption


def generate_gift_code() -> str:
    for _ in range(10):
        code = f"GIFT-{secrets.token_hex(5).upper()}"
        if not Gift.objects.filter(code=code).exists():
            return code
    raise serializers.ValidationError("Could not generate a gift code, try again.")


def recipient_user(email: str):
    address = str(email or "").strip()
    if not address:
        return None
    return User.objects.filter(email__iexact=address).first()


def user_owns(user, course=None, pack=None) -> bool:
    from apps.enrollments.models import Enrollment
    from apps.packs.models import PackPurchase

    if course is not None:
        return Enrollment.objects.filter(learner=user, course=course).exists()
    return PackPurchase.objects.filter(learner=user, pack=pack).exists()


def _gift_item(course_id=None, pack_id=None):
    if bool(course_id) == bool(pack_id):
        raise serializers.ValidationError("Provide exactly one of course_id, pack_id.")
    if course_id:
        try:
            return Course.objects.get(id=course_id, status=Course.Status.PUBLISHED)
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found.") from None
    try:
        return QuestionPack.objects.get(id=pack_id, status=QuestionPack.Status.PUBLISHED)
    except QuestionPack.DoesNotExist:
        raise serializers.ValidationError("Pack not found.") from None


def create_gift(
    *,
    giver,
    course_id=None,
    pack_id=None,
    recipient_email: str,
    recipient_name: str = "",
    message: str = "",
    coupon: Coupon | None = None,
) -> Gift:
    """Create a gift in PENDING state (payment attached later by the caller)."""
    from apps.enrollments.models import Enrollment
    from apps.packs.models import PackPurchase

    item = _gift_item(course_id, pack_id)
    course = item if isinstance(item, Course) else None
    pack = None if isinstance(item, Course) else item
    email = str(recipient_email or "").strip()
    if not email or "@" not in email:
        raise serializers.ValidationError("Enter a valid recipient email address.")
    if giver.email and giver.email.strip().lower() == email.lower():
        raise serializers.ValidationError("You cannot gift a course to yourself.")
    existing = recipient_user(email)
    if existing is not None:
        owned = (
            Enrollment.objects.filter(learner=existing, course=course).exists()
            if course is not None
            else PackPurchase.objects.filter(learner=existing, pack=pack).exists()
        )
        if owned:
            raise serializers.ValidationError("The recipient already owns this item.")
    gift = Gift.objects.create(
        code=generate_gift_code(),
        giver=giver,
        recipient_email=email,
        recipient_name=str(recipient_name or "").strip()[:120],
        message=str(message or "").strip()[:500],
        course=course,
        pack=pack,
        coupon=coupon,
    )
    logger.info("Gift %s created by %s for %s", gift.code, giver.mobile, email)
    return gift


def fulfil_gift(gift: Gift) -> dict:
    """Grant the gifted item to the recipient when they have an account.

    Idempotent: replays for an already-claimed gift just report the state,
    and a missing recipient leaves the gift PAID for later manual claim.
    """
    gift.refresh_from_db()
    if gift.status == Gift.Status.CLAIMED:
        return {"gift_code": gift.code, "claimed": True, "enrolled": True}
    user = recipient_user(gift.recipient_email)
    if user is None:
        return {"gift_code": gift.code, "claimed": False, "enrolled": False}
    try:
        result = fulfil_claim(user, gift)
    except serializers.ValidationError as exc:
        logger.info("Gift %s auto-enrol skipped: %s", gift.code, exc)
        return {"gift_code": gift.code, "claimed": False, "enrolled": False}
    return {"gift_code": gift.code, "enrolled": True, **result}


def claim_gift(user, code: str) -> dict:
    normalized = normalize_code(code).replace(" ", "")
    try:
        gift = Gift.objects.select_related("course", "pack").get(code=normalized)
    except Gift.DoesNotExist:
        raise serializers.ValidationError("Invalid gift code.") from None
    if gift.status == Gift.Status.CLAIMED:
        raise serializers.ValidationError("This gift has already been claimed.")
    if gift.status != Gift.Status.PAID:
        raise serializers.ValidationError("This gift is not ready to claim yet.")
    if user_owns(user, course=gift.course, pack=gift.pack):
        raise serializers.ValidationError("You already own this item.")
    return fulfil_claim(user, gift)


def fulfil_claim(user, gift: Gift) -> dict:
    from apps.enrollments.services import enroll
    from apps.packs.services import grant_pack_purchase

    with transaction.atomic():
        locked = Gift.objects.select_for_update().get(id=gift.id)
        if locked.status == Gift.Status.CLAIMED:
            raise serializers.ValidationError("This gift has already been claimed.")
        if locked.status != Gift.Status.PAID:
            raise serializers.ValidationError("This gift is not ready to claim yet.")
        if user_owns(user, course=locked.course, pack=locked.pack):
            raise serializers.ValidationError("You already own this item.")
        if locked.course_id:
            enrollment = enroll(user, locked.course)
            result = {"enrollment_id": enrollment.id}
        else:
            purchase = grant_pack_purchase(user, locked.pack)
            result = {"purchase_id": purchase.id}
        locked.status = Gift.Status.CLAIMED
        locked.claimed_by = user
        locked.claimed_at = timezone.now()
        locked.save(update_fields=["status", "claimed_by", "claimed_at", "updated_at"])
    logger.info("Gift %s claimed by %s", locked.code, user.mobile)
    item = locked.course or locked.pack
    return {
        "gift_code": locked.code,
        "claimed": True,
        "kind": "course" if locked.course_id else "pack",
        "item_id": locked.course_id or locked.pack_id,
        "item_title": item.title if item else "",
        **result,
    }
