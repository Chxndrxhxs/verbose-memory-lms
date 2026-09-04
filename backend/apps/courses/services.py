import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from .models import Course, Lesson, Review, Section

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".mp4",
    ".mp3",
    ".wav",
    ".txt",
    ".md",
}
MAX_BYTES = 25 * 1024 * 1024


def create_course(*, instructor, data) -> Course:
    course = Course.objects.create(instructor=instructor, **data)
    logger.info("Course created: %s by %s", course.id, instructor.mobile)
    return course


def publish_course(course: Course) -> Course:
    course.status = Course.Status.PUBLISHED
    course.save(update_fields=["status"])
    return course


def save_uploaded_file(file: UploadedFile) -> tuple[str, int]:
    ext = Path(file.name or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}")
    if file.size > MAX_BYTES:
        raise ValueError("File too large (max 25MB)")
    media_root = Path(settings.MEDIA_ROOT) / "lessons"
    media_root.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    full_path = media_root / name
    with open(full_path, "wb") as out:
        for chunk in file.chunks():
            out.write(chunk)
    url = f"{settings.MEDIA_URL}lessons/{name}"
    logger.info("Saved upload %s (%s bytes)", url, full_path.stat().st_size)
    return url, full_path.stat().st_size


def replace_curriculum(course: Course, sections: list) -> Course:
    course.sections.all().delete()
    for si, sec in enumerate(sections or []):
        s = Section.objects.create(
            course=course,
            title=sec.get("title", f"Section {si + 1}"),
            order=si,
        )
        for li, les in enumerate(sec.get("lessons", [])):
            Lesson.objects.create(
                section=s,
                title=les.get("title", "Untitled"),
                kind=les.get("kind", "video"),
                duration=les.get("duration", ""),
                resource_url=les.get("resource_url", ""),
                quiz_data=les.get("quiz_data", []),
                order=li,
            )
    return course


def rate_course(course: Course, user, rating: int) -> dict:
    from django.db.models import Avg

    Review.objects.update_or_create(course=course, user=user, defaults={"rating": rating})
    agg = Review.objects.filter(course=course).aggregate(avg=Avg("rating"), count=Avg("id"))
    total = Review.objects.filter(course=course).count()
    course.average_rating = round(agg["avg"] or 0, 1)
    course.save(update_fields=["average_rating", "updated_at"])
    return {
        "rating": rating,
        "average_rating": str(course.average_rating),
        "rating_count": total,
    }


def get_user_rating(course: Course, user) -> dict:
    rating = (
        Review.objects.filter(course=course, user=user).values_list("rating", flat=True).first()
    )
    total = Review.objects.filter(course=course).count()
    return {
        "rating": rating,
        "average_rating": str(course.average_rating),
        "rating_count": total,
    }
