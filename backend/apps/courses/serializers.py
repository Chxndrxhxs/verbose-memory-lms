import re
from urllib.parse import unquote, urlparse

from rest_framework import serializers

from core.validators import validate_text_block, validate_title

from .models import Course, Lesson, Review, Section, WishlistItem

IMAGE_EXTENSIONS = (
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "avif",
    "bmp",
    "ico",
)
IMAGE_URL_RE = re.compile(r"\.(?:" + "|".join(IMAGE_EXTENSIONS) + r")$", re.IGNORECASE)


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


def validate_course_title(value: str) -> str:
    """A title made only of punctuation is unreadable everywhere it
    renders, and keyboard smash ("qwertyuiop !@#$%12345") is not a
    course name.
    """
    return validate_title(value)


def validate_cover_image_url(value: str) -> str:
    """A cover has to be a real image link, otherwise both the instructor and
    student course cards render a broken image.

    Only the path is inspected so CDN links carrying a query string
    ("…/cover.png?w=1600") still pass.
    """
    url = (value or "").strip()
    if not url:
        return url
    if urlparse(url).scheme not in ("http", "https"):
        raise serializers.ValidationError("Cover image must be a valid image URL.")
    path = unquote(urlparse(url).path)
    if not IMAGE_URL_RE.search(path):
        raise serializers.ValidationError("Cover image must be a valid image URL.")
    return url


class CourseListSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    instructor_avatar = serializers.SerializerMethodField()
    instructor_role = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()
    section_count = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()

    def validate_title(self, value: str) -> str:
        return validate_course_title(value)

    def validate_subtitle(self, value: str) -> str:
        return validate_text_block(value, "Subtitle", 140)

    def validate_description(self, value: str) -> str:
        return validate_text_block(value, "Description", 5000)

    def validate_cover_image(self, value: str) -> str:
        return validate_cover_image_url(value)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "subtitle",
            "category",
            "description",
            "price",
            "pricing_type",
            "original_price",
            "pg_fees_to_learner",
            "cover_image",
            "status",
            "level",
            "average_rating",
            "what_you_will_learn",
            "instructor_name",
            "instructor_avatar",
            "instructor_role",
            "student_count",
            "section_count",
            "lesson_count",
            "slug",
            "meta",
            "created_at",
            "updated_at",
        )

    def get_instructor_name(self, obj: Course) -> str:
        return obj.instructor.display_name

    def get_instructor_avatar(self, obj: Course) -> str:
        return getattr(obj.instructor, "avatar", "") or ""

    def get_instructor_role(self, obj: Course) -> str:
        role = getattr(obj.instructor, "role", "")
        return "Senior Instructor" if role == "instructor" else "QTNXT Instructor"

    def get_student_count(self, obj: Course) -> int:
        return obj.enrollments.count()

    def get_section_count(self, obj: Course) -> int:
        return obj.sections.count()

    def get_lesson_count(self, obj: Course) -> int:
        return Lesson.objects.filter(section__course=obj).count()

    def get_meta(self, obj: Course) -> str:
        rating = f"{obj.average_rating:.1f}" if obj.average_rating else "New"
        level = obj.get_level_display()
        return f"{rating} • {level}"

    def validate(self, attrs):
        pricing_type = attrs.get(
            "pricing_type", getattr(self.instance, "pricing_type", Course.PricingType.FREE)
        )
        price = attrs.get("price", getattr(self.instance, "price", 0))
        if pricing_type == Course.PricingType.FREE:
            attrs["price"] = 0
            attrs["original_price"] = 0
        elif price <= 0:
            raise serializers.ValidationError(
                {"price": "Price must be greater than 0 for paid courses."}
            )
        return attrs


class CourseDetailSerializer(CourseListSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    rating_count = serializers.SerializerMethodField()

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + (
            "description",
            "created_at",
            "updated_at",
            "sections",
            "rating_count",
        )

    def get_rating_count(self, obj: Course) -> int:
        return obj.reviews.count()


class WishlistItemSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ("id", "course", "created_at")


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("id", "rating", "created_at")
        read_only_fields = ("id", "created_at")
