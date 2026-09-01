from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

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
            "avatar",
            "is_mobile_verified",
        )
        read_only_fields = ("id", "role", "is_mobile_verified")

    def get_name(self, obj: User) -> str:
        return obj.get_full_name() or obj.username


def tokens_for(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class SendOTPSerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)

    def validate_mobile(self, value: str) -> str:
        if not value.isdigit() or len(value) < 10:
            raise serializers.ValidationError("Invalid mobile")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            otp = OTP.objects.filter(mobile=attrs["mobile"], is_used=False).latest("created_at")
        except OTP.DoesNotExist:
            raise serializers.ValidationError("No OTP sent") from None
        if not otp.is_valid() or otp.code != attrs["code"]:
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
        fields = ("name", "email", "age", "avatar")
        extra_kwargs = {"email": {"required": True}}

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
