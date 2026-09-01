from rest_framework import serializers

from .models import Course, Lesson, Section


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = (
            "id",
            "title",
            "kind",
            "duration",
            "video_url",
            "resource_url",
            "quiz_data",
            "order",
        )


class SectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ("id", "title", "order", "lessons")


class CourseListSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    instructor_avatar = serializers.SerializerMethodField()
    instructor_role = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "subtitle",
            "category",
            "price",
            "cover_image",
            "status",
            "level",
            "average_rating",
            "what_you_will_learn",
            "instructor_name",
            "instructor_avatar",
            "instructor_role",
            "student_count",
            "slug",
            "meta",
        )

    def get_instructor_name(self, obj: Course) -> str:
        return obj.instructor.get_full_name() or obj.instructor.username

    def get_instructor_avatar(self, obj: Course) -> str:
        return getattr(obj.instructor, "avatar", "") or ""

    def get_instructor_role(self, obj: Course) -> str:
        role = getattr(obj.instructor, "role", "")
        return "Senior Instructor" if role == "instructor" else "Knoova Instructor"

    def get_student_count(self, obj: Course) -> int:
        return obj.enrollments.count()

    def get_meta(self, obj: Course) -> str:
        rating = f"{obj.average_rating:.1f}" if obj.average_rating else "New"
        level = obj.get_level_display()
        return f"{rating} • {level}"


class CourseDetailSerializer(CourseListSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + (
            "description",
            "created_at",
            "updated_at",
            "sections",
        )
