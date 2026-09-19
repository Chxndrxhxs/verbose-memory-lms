from rest_framework import serializers

from .models import Assignment, AssignmentAttempt
from .services import DEFAULT_RESULTS, DEFAULT_SECURITY


class AssignmentWriteSerializer(serializers.ModelSerializer):
    """Validate/create/update the top-level assignment fields."""

    class Meta:
        model = Assignment
        fields = [
            "title",
            "description",
            "instructions",
            "difficulty",
            "inter_category",
            "course",
            "status",
            "access_type",
            "access",
            "security",
            "results",
            "marks_per_correct",
            "negative_marking",
            "negative_marks_per_wrong",
            "marks_unanswered",
            "passing_percentage",
            "max_attempts",
            "start_date",
            "end_date",
            "randomize_questions",
            "randomize_options",
            "source_document",
            "source_document_name",
            "draft_data",
        ]

    def validate(self, attrs):
        if "access" not in attrs or attrs["access"] is None:
            attrs["access"] = {}
        if not attrs.get("security"):
            attrs["security"] = dict(DEFAULT_SECURITY)
        if not attrs.get("results"):
            attrs["results"] = dict(DEFAULT_RESULTS)
        return attrs


class QuestionPayloadSerializer(serializers.Serializer):
    """A single question in a structure payload (frontend/generated JSON).

    Options may be plain strings or ``{"text", "image"}`` objects so PDF figures
    can appear inside options.
    """

    id = serializers.CharField(required=False, allow_blank=True)
    question = serializers.CharField(allow_blank=True)
    question_image = serializers.CharField(required=False, allow_blank=True, default="")
    options = serializers.ListField(child=serializers.JSONField(), allow_empty=False)
    correct_answer = serializers.IntegerField(min_value=0)
    explanation = serializers.CharField(required=False, allow_blank=True, default="")
    marks = serializers.FloatField(required=False, min_value=0, default=1)
    difficulty = serializers.CharField(required=False, allow_blank=True, default="medium")
    topic = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if attrs["correct_answer"] >= len(attrs["options"]):
            raise serializers.ValidationError(
                {"correct_answer": "Must reference one of the provided options."}
            )
        return attrs


class StepPayloadSerializer(serializers.Serializer):
    """A step/leaf of a model. Children are validated recursively."""

    kind = serializers.ChoiceField(choices=["test", "set"], default="test")
    name = serializers.CharField(allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    duration_seconds = serializers.IntegerField(min_value=0)
    children = serializers.ListField(required=False, default=list)
    questions = QuestionPayloadSerializer(many=True, required=False, default=list)

    def validate_children(self, value):
        children = []
        for child in value:
            serializer = StepPayloadSerializer(data=child)
            serializer.is_valid(raise_exception=True)
            children.append(serializer.validated_data)
        return children


class ModelPayloadSerializer(serializers.Serializer):
    code = serializers.CharField(allow_blank=True)
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, default="")
    execution_mode = serializers.ChoiceField(
        choices=["sequential", "parallel"], default="sequential"
    )
    is_published = serializers.BooleanField(default=True)
    steps = serializers.ListField(required=False, default=list)

    def validate_steps(self, value):
        steps = []
        for step in value:
            serializer = StepPayloadSerializer(data=step)
            serializer.is_valid(raise_exception=True)
            steps.append(serializer.validated_data)
        return steps


class StructurePayloadSerializer(serializers.Serializer):
    models = ModelPayloadSerializer(many=True)


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentAttempt
        fields = [
            "id",
            "assignment",
            "model",
            "status",
            "started_at",
            "expires_at",
            "ended_at",
            "is_auto_submitted",
            "total_questions",
            "answered",
            "correct",
            "wrong",
            "unanswered",
            "positive_marks",
            "negative_marks",
            "final_score",
            "max_score",
            "percentage",
            "passed",
        ]
