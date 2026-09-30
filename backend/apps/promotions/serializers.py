from rest_framework import serializers

from .models import Coupon, Gift
from .services import normalize_code


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "discount_type",
            "discount_value",
            "max_discount_paise",
            "min_order_paise",
            "usage_limit",
            "usage_count",
            "per_user_limit",
            "applies_to",
            "course",
            "pack",
            "valid_from",
            "valid_to",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "usage_count", "created_at", "updated_at")

    def validate_code(self, value: str) -> str:
        code = normalize_code(value)
        if not code or len(code) > 32:
            raise serializers.ValidationError("Code must be 1-32 characters.")
        if not code.replace("-", "").replace("_", "").isalnum():
            raise serializers.ValidationError(
                "Code may only contain letters, digits, hyphens and underscores."
            )
        return code

    def validate(self, attrs):
        discount_type = attrs.get("discount_type") or getattr(self.instance, "discount_type", None)
        value = attrs.get("discount_value", getattr(self.instance, "discount_value", None))
        if discount_type == Coupon.DiscountType.PERCENT and value is not None:
            if value < 1 or value > 100:
                raise serializers.ValidationError(
                    {"discount_value": "Percent discount must be between 1 and 100."}
                )
        scope = attrs.get("applies_to", getattr(self.instance, "applies_to", Coupon.Scope.ALL))
        course = attrs.get("course", getattr(self.instance, "course", None))
        pack = attrs.get("pack", getattr(self.instance, "pack", None))
        if scope == Coupon.Scope.COURSE and course is None:
            raise serializers.ValidationError({"course": "Course-scoped coupons need a course."})
        if scope == Coupon.Scope.PACK and pack is None:
            raise serializers.ValidationError({"pack": "Pack-scoped coupons need a pack."})
        if scope == Coupon.Scope.ALL and (course is not None or pack is not None):
            raise serializers.ValidationError("Store-wide coupons cannot pin a course or pack.")
        if course is not None and pack is not None:
            raise serializers.ValidationError("A coupon cannot pin both a course and a pack.")
        return attrs


class GiftSerializer(serializers.ModelSerializer):
    item_title = serializers.SerializerMethodField()
    kind = serializers.SerializerMethodField()

    class Meta:
        model = Gift
        fields = (
            "id",
            "code",
            "kind",
            "item_title",
            "course",
            "pack",
            "recipient_email",
            "recipient_name",
            "message",
            "status",
            "claimed_at",
            "created_at",
        )
        read_only_fields = fields

    def get_kind(self, obj: Gift) -> str:
        return "course" if obj.course_id else "pack"

    def get_item_title(self, obj: Gift) -> str:
        item = obj.course or obj.pack
        return item.title if item else ""
