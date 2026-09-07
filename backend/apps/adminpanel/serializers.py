from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.courses.models import Course, Lesson, Section
from apps.courses.serializers import CourseDetailSerializer, CourseListSerializer
from apps.enrollments.models import ActivityEvent, Certificate, Enrollment
from apps.payments.serializers import PaymentSerializer

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "name",
            "first_name",
            "last_name",
            "email",
            "mobile",
            "role",
            "age",
            "city",
            "avatar",
            "is_mobile_verified",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined", "is_superuser")


class AdminCourseListSerializer(CourseListSerializer):
    instructor_id = serializers.IntegerField(read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ("instructor_id",)


class AdminCourseDetailSerializer(CourseDetailSerializer):
    instructor_id = serializers.IntegerField(read_only=True)

    class Meta(CourseDetailSerializer.Meta):
        fields = CourseDetailSerializer.Meta.fields + ("instructor_id",)


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    learner_id = serializers.IntegerField(read_only=True)
    learner_name = serializers.SerializerMethodField()
    learner_mobile = serializers.CharField(source="learner.mobile", read_only=True)
    learner_avatar = serializers.CharField(source="learner.avatar", read_only=True)
    course_id = serializers.IntegerField(read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_price = serializers.SerializerMethodField()
    course_status = serializers.CharField(source="course.status", read_only=True)
    instructor = serializers.SerializerMethodField()
    progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "learner_id",
            "learner_name",
            "learner_mobile",
            "learner_avatar",
            "course_id",
            "course_title",
            "course_price",
            "course_status",
            "instructor",
            "progress",
            "enrolled_at",
        )

    def get_learner_name(self, obj: Enrollment) -> str:
        return obj.learner.get_full_name() or obj.learner.username

    def get_course_price(self, obj: Enrollment) -> str:
        return str(obj.course.price)

    def get_instructor(self, obj: Enrollment) -> str:
        return obj.course.instructor.get_full_name() or obj.course.instructor.username


class AdminPaymentSerializer(PaymentSerializer):
    user_id = serializers.IntegerField(read_only=True)
    user_name = serializers.SerializerMethodField()
    user_mobile = serializers.CharField(source="user.mobile", read_only=True)
    course_id = serializers.IntegerField(read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    amount_inr = serializers.SerializerMethodField()

    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + (
            "user_id",
            "user_name",
            "user_mobile",
            "course_id",
            "course_title",
            "amount_inr",
        )

    def get_user_name(self, obj) -> str:
        return obj.user.get_full_name() or obj.user.username

    def get_amount_inr(self, obj) -> float:
        return obj.amount / 100


class AdminActivitySerializer(serializers.ModelSerializer):
    learner_name = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    lesson_title = serializers.SerializerMethodField()

    class Meta:
        model = ActivityEvent
        fields = (
            "id",
            "learner_name",
            "verb",
            "course_title",
            "lesson_title",
            "meta",
            "created_at",
        )

    def get_learner_name(self, obj) -> str:
        return obj.learner.get_full_name() or obj.learner.username

    def get_course_title(self, obj) -> str | None:
        return obj.course.title if obj.course else None

    def get_lesson_title(self, obj) -> str | None:
        return obj.lesson.title if obj.lesson else None


class AdminCertificateSerializer(serializers.ModelSerializer):
    learner_name = serializers.SerializerMethodField()
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Certificate
        fields = ("id", "certificate_id", "learner_name", "course_title", "issued_at")

    def get_learner_name(self, obj) -> str:
        return obj.learner.get_full_name() or obj.learner.username


def section_payload(course: Course) -> list[dict]:
    return [
        {
            "id": section.id,
            "title": section.title,
            "order": section.order,
            "lessons": [
                {
                    "id": lesson.id,
                    "title": lesson.title,
                    "kind": lesson.kind,
                    "duration": lesson.duration,
                    "video_url": lesson.video_url,
                    "resource_url": lesson.resource_url,
                    "quiz_data": lesson.quiz_data,
                    "order": lesson.order,
                }
                for lesson in Lesson.objects.filter(section=section).order_by("order")
            ],
        }
        for section in Section.objects.filter(course=course).order_by("order")
    ]
