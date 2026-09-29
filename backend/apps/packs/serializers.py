from rest_framework import serializers

from apps.assignments.serializers import QuestionPayloadSerializer

from .models import QuestionPack
from .services import MODULE_CODES


class PackWriteSerializer(serializers.ModelSerializer):
    """Validate/create/update pack top-level fields (questions are managed separately)."""

    class Meta:
        model = QuestionPack
        fields = [
            "title",
            "description",
            "cover",
            "inter_category",
            "price",
            "original_price",
            "status",
            "allowed_modules",
            "max_attempts",
            "test_size",
            "test_duration_seconds",
            "set_size",
            "set_duration_seconds",
            "execution_mode",
            "passing_percentage",
            "negative_marking",
        ]

    def validate_allowed_modules(self, value):
        modules = [m for m in (value or []) if m in MODULE_CODES]
        if not modules:
            raise serializers.ValidationError("Enable at least one exam module.")
        return modules

    def validate_execution_mode(self, value):
        if value not in ("sequential", "parallel"):
            raise serializers.ValidationError("Must be sequential or parallel.")
        return value


class PackQuestionsSerializer(serializers.Serializer):
    """Bulk-replace a pack's snapshot questions (bank import / upload / generate)."""

    questions = QuestionPayloadSerializer(many=True)
