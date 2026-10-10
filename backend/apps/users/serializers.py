from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from core.validators import validate_person_age, validate_person_email, validate_person_name

from .models import OTP

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "name",
            "email",
            "mobile",
            "role",
            "age",
            "city",
            "avatar",
            "is_mobile_verified",
            "profile_complete",
        )
        read_only_fields = ("id", "role", "is_mobile_verified")

    def get_name(self, obj: User) -> str:
        # Empty until the learner sets a real name: /users/me prefills
        # the profile form, and the username is the raw mobile number.
        return obj.get_full_name() or ""


def tokens_for(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class SendOTPSerializer(serializers.Serializer):
    mobile = serializers.RegexField(
        r"^[6-9]\d{9}$", max_length=15, error_messages={"invalid": "Invalid mobile"}
    )


class VerifyOTPSerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            otp = OTP.objects.filter(mobile=attrs["mobile"], is_used=False).latest("created_at")
        except OTP.DoesNotExist:
            if OTP.objects.filter(mobile=attrs["mobile"]).exists():
                msg = "OTP already used or expired — request a new one"
                raise serializers.ValidationError(msg) from None
            raise serializers.ValidationError("No OTP sent for this mobile") from None
        if not otp.is_valid() or otp.code != attrs["code"]:
            otp.attempts += 1
            if otp.attempts >= OTP.MAX_ATTEMPTS:
                otp.is_used = True
            otp.save(update_fields=["attempts", "is_used"])
            raise serializers.ValidationError("Invalid or expired OTP") from None
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        user, created = User.objects.get_or_create(
            mobile=attrs["mobile"],
            defaults={"username": attrs["mobile"]},
        )
        user.is_mobile_verified = True
        user.save(update_fields=["is_mobile_verified"])
        attrs["user"] = user
        attrs["is_new"] = created
        return attrs


class CompleteProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("name", "email", "age", "city", "avatar")

    def validate_name(self, value: str) -> str:
        # A profile name arrives as one string but is stored split across
        # first_name/last_name, so validate each part with the shared rule.
        parts = (value or "").strip().split(" ", 1)
        first = parts[0].strip() if parts else ""
        last = parts[1].strip() if len(parts) > 1 else ""
        if len(parts) > 1 and not last:
            raise serializers.ValidationError("Last name is required.")
        return " ".join(
            part
            for part in (
                validate_person_name(first, "First name"),
                validate_person_name(last, "Last name") if last else "",
            )
            if part
        )

    def validate_email(self, value: str) -> str:
        return validate_person_email(value)

    def validate_city(self, value: str) -> str:
        text = (value or "").strip()
        return validate_person_name(text, "City") if text else ""

    def validate_age(self, value) -> int | None:
        # required: clearing age from a filled profile is what RAM-8 reported.
        return validate_person_age(value, required=True)

    def update(self, instance, validated_data):
        name = validated_data.pop("name", "").strip()
        if name:
            parts = name.split(" ", 1)
            instance.first_name = parts[0]
            instance.last_name = parts[1] if len(parts) > 1 else ""
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        return instance
