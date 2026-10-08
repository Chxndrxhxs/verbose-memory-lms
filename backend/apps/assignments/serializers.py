from rest_framework import serializers

from core.validators import (
    MAX_TOTAL_MARKS,
    MIN_TOTAL_MARKS,
    validate_question_text,
    validate_step_name,
    validate_text_block,
    validate_title,
)

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
            "board",
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
            "source_document_file_id",
            "draft_data",
        ]

    def validate_title(self, value: str) -> str:
        # Mirrors isValidTitle() in packages/shared/src/validation.ts.
        return validate_title(value)

    def validate_description(self, value: str) -> str:
        return validate_text_block(value, "Description", 2000)

    def validate_instructions(self, value: str) -> str:
        return validate_text_block(value, "Instructions", 5000)

    def validate(self, attrs):
        if "access" not in attrs or attrs["access"] is None:
            attrs["access"] = {}
        if not attrs.get("security"):
            attrs["security"] = dict(DEFAULT_SECURITY)
        if not attrs.get("results"):
            attrs["results"] = dict(DEFAULT_RESULTS)
        if attrs.get("status") == Assignment.Status.PUBLISHED and not attrs.get("board"):
            # A published assignment with no board is invisible in the learner
            # catalog (RAM-34). Drafts may still be saved without one.
            raise serializers.ValidationError({"board": "Select an exam board to publish."})
        draft = attrs.get("draft_data")
        if isinstance(draft, dict) and "totalMarks" in draft:
            total = draft["totalMarks"]
            if not isinstance(total, (int, float)) or isinstance(total, bool):
                raise serializers.ValidationError({"draft_data": "Total marks must be a number."})
            if total < MIN_TOTAL_MARKS or total > MAX_TOTAL_MARKS:
                # RAM-44: an unbounded total breaks scoring and result maths.
                raise serializers.ValidationError(
                    {
                        "draft_data": (
                            f"Total marks must be between {MIN_TOTAL_MARKS} and {MAX_TOTAL_MARKS}."
                        )
                    }
                )
        # A PATCH that omits draft_data must not resurrect a stored
        # out-of-range total (1e+27 shipped once), so re-check the
        # persisted draft on every update.
        instance = self.instance
        if instance is not None and not isinstance(draft, dict):
            stored = instance.draft_data or {}
            stored_total = stored.get("totalMarks")
            if isinstance(stored_total, (int, float)) and not isinstance(stored_total, bool):
                if stored_total < MIN_TOTAL_MARKS or stored_total > MAX_TOTAL_MARKS:
                    raise serializers.ValidationError(
                        {
                            "draft_data": (
                                f"Total marks must be between {MIN_TOTAL_MARKS} "
                                f"and {MAX_TOTAL_MARKS}."
                            )
                        }
                    )
        negative = attrs.get(
            "negative_marking",
            getattr(instance, "negative_marking", True) if instance else True,
        )
        per_wrong = attrs.get(
            "negative_marks_per_wrong",
            getattr(instance, "negative_marks_per_wrong", 0.25) if instance else 0.25,
        )
        if negative and not (per_wrong is not None and float(per_wrong) > 0):
            # A 0.00 deduction makes the "negative marking" flag a lie:
            # the UI advertises it but nothing is ever deducted.
            raise serializers.ValidationError(
                {
                    "negative_marks_per_wrong": (
                        "Must be greater than 0 when negative marking is on."
                    )
                }
            )
        return attrs


class QuestionPayloadSerializer(serializers.Serializer):
    """A single question in a structure payload (frontend/generated JSON).

    Options may be plain strings or ``{"text", "image"}`` objects so PDF figures
    can appear inside options.
    """

    id = serializers.CharField(required=False, allow_blank=True)
    question = serializers.CharField(allow_blank=True, validators=[validate_question_text])
    question_image = serializers.CharField(required=False, allow_blank=True, default="")
    options = serializers.ListField(child=serializers.JSONField(), allow_empty=False)
    correct_answer = serializers.IntegerField(min_value=0)
    explanation = serializers.CharField(required=False, allow_blank=True, default="")
    marks = serializers.FloatField(
        required=False, min_value=0, max_value=MAX_TOTAL_MARKS, default=1
    )
    difficulty = serializers.CharField(required=False, allow_blank=True, default="medium")
    topic = serializers.CharField(required=False, allow_blank=True, default="")
    source = serializers.JSONField(required=False, default=dict)

    def validate(self, attrs):
        if attrs["correct_answer"] >= len(attrs["options"]):
            raise serializers.ValidationError(
                {"correct_answer": "Must reference one of the provided options."}
            )
        return attrs


class StepPayloadSerializer(serializers.Serializer):
    """A step/leaf of a model. Children are validated recursively."""

    kind = serializers.ChoiceField(choices=["test", "set"], default="test")
    name = serializers.CharField(allow_blank=True, validators=[validate_step_name])
    description = serializers.CharField(required=False, allow_blank=True, default="")
    duration_seconds = serializers.IntegerField(min_value=1)
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
    code = serializers.ChoiceField(choices=["practice", "mock"])
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
