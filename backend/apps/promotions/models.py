from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Coupon(models.Model):
    """Discount code redeemable at checkout for courses and packs."""

    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percent off"
        FLAT = "flat", "Flat off (paise)"

    class Scope(models.TextChoices):
        ALL = "all", "All courses & packs"
        COURSE = "course", "Single course"
        PACK = "pack", "Single pack"

    code = models.CharField(max_length=32, unique=True, db_index=True)
    discount_type = models.CharField(
        max_length=10, choices=DiscountType.choices, default=DiscountType.PERCENT
    )
    # percent (1-100) when discount_type=percent, paise when flat.
    discount_value = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )
    # Cap for percent discounts, in paise. Null = no cap.
    max_discount_paise = models.PositiveIntegerField(null=True, blank=True)
    # Item must cost at least this (paise) for the coupon to apply.
    min_order_paise = models.PositiveIntegerField(default=0)
    # Total redemptions allowed. Null = unlimited.
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    per_user_limit = models.PositiveIntegerField(default=1)
    applies_to = models.CharField(max_length=10, choices=Scope.choices, default=Scope.ALL)
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="coupons",
    )
    pack = models.ForeignKey(
        "packs.QuestionPack",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="coupons",
    )
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_coupons",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.code


class CouponRedemption(models.Model):
    """One recorded use of a coupon. Written once, when payment succeeds."""

    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="redemptions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coupon_redemptions"
    )
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_redemption",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_redemptions",
    )
    pack = models.ForeignKey(
        "packs.QuestionPack",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_redemptions",
    )
    discount_paise = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user} used {self.coupon_id} (-{self.discount_paise})"


class Gift(models.Model):
    """A paid course/pack bought by a giver for a recipient.

    Paid gifts stay claimable until the recipient redeems ``code``; when the
    recipient already has an account their enrolment happens automatically
    at payment verification time.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Awaiting payment"
        PAID = "paid", "Paid — awaiting claim"
        CLAIMED = "claimed", "Claimed"
        CANCELLED = "cancelled", "Cancelled"

    code = models.CharField(max_length=24, unique=True, db_index=True)
    giver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="gifts_given"
    )
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=120, blank=True, default="")
    message = models.CharField(max_length=500, blank=True, default="")
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="gifts",
    )
    pack = models.ForeignKey(
        "packs.QuestionPack",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="gifts",
    )
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gift",
    )
    coupon = models.ForeignKey(
        Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="gifts"
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    claimed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gifts_claimed",
    )
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(course__isnull=False, pack__isnull=True)
                    | models.Q(course__isnull=True, pack__isnull=False)
                ),
                name="gift_single_item",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.code} ({self.status})"
