from rest_framework import serializers

from apps.courses.serializers import CourseListSerializer

from .models import Certificate, Enrollment


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
