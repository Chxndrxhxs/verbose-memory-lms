from rest_framework import serializers

from apps.courses.serializers import CourseListSerializer

from .models import ActivityEvent, Certificate, Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ("id", "course", "progress", "completed_lessons", "enrolled_at")


class CertificateSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    enrolled_at = serializers.DateTimeField(source="enrollment.enrolled_at", read_only=True)
    learner_name = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            "id",
            "certificate_id",
            "course",
            "learner_name",
            "enrolled_at",
            "issued_at",
        )

    def get_learner_name(self, obj) -> str:
        return obj.learner.get_full_name() or obj.learner.username


class ActivityEventSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    lesson_title = serializers.SerializerMethodField()

    class Meta:
        model = ActivityEvent
        fields = (
            "id",
            "verb",
            "course",
            "course_title",
            "lesson",
            "lesson_title",
            "meta",
            "created_at",
        )

    def get_course_title(self, obj) -> str | None:
        return obj.course.title if obj.course else None

    def get_lesson_title(self, obj) -> str | None:
        return obj.lesson.title if obj.lesson else None


class InstructorActivitySerializer(ActivityEventSerializer):
    learner = serializers.SerializerMethodField()

    class Meta(ActivityEventSerializer.Meta):
        fields = ActivityEventSerializer.Meta.fields + ("learner",)

    def get_learner(self, obj) -> dict | None:
        u = obj.learner
        if not u:
            return None
        return {
            "id": u.id,
            "name": u.get_full_name() or u.username,
            "avatar": u.avatar or "",
            "city": u.city or "",
        }
