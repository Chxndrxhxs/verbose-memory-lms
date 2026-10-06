import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from .models import Course, Lesson, Review, Section, WishlistItem

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".md",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".mp4",
    ".mp3",
    ".wav",
}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_BYTES = 25 * 1024 * 1024
# Profile photos are advertised as a 2 MB limit in every frontend, but they
# used to share the 25 MB lesson-upload cap server-side (RAM-32). Keep the two
# purposes apart so tightening a photo does not break lesson attachments.
MAX_AVATAR_BYTES = 2 * 1024 * 1024
UPLOAD_PURPOSES = {
    "avatar": {"max_bytes": MAX_AVATAR_BYTES, "extensions": IMAGE_EXTENSIONS, "dir": "avatars"},
    "lesson": {"max_bytes": MAX_BYTES, "extensions": ALLOWED_EXTENSIONS, "dir": "lessons"},
}
DEFAULT_UPLOAD_PURPOSE = "lesson"


def save_uploaded_file(
    file: UploadedFile, purpose: str = DEFAULT_UPLOAD_PURPOSE
) -> tuple[str, int]:
    config = UPLOAD_PURPOSES.get(purpose, UPLOAD_PURPOSES[DEFAULT_UPLOAD_PURPOSE])
    ext = Path(file.name or "").suffix.lower()
    if ext not in config["extensions"]:
        raise ValueError(f"Unsupported file type: {ext}")
    if file.size > config["max_bytes"]:
        limit_mb = config["max_bytes"] // (1024 * 1024)
        raise ValueError(f"File too large (max {limit_mb}MB)")
    media_root = Path(settings.MEDIA_ROOT) / config["dir"]
    media_root.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    full_path = media_root / name
    with open(full_path, "wb") as out:
        for chunk in file.chunks():
            out.write(chunk)
    url = f"{settings.MEDIA_URL}{config['dir']}/{name}"
    logger.info("Saved %s upload %s (%s bytes)", purpose, url, full_path.stat().st_size)
    return url, full_path.stat().st_size


def create_course(*, instructor, data) -> Course:
    course = Course.objects.create(instructor=instructor, **data)
    logger.info("Course created: %s by %s", course.id, instructor.mobile)
    return course


def publish_course(course: Course) -> Course:
    course.status = Course.Status.PUBLISHED
    course.save(update_fields=["status"])
    return course


def replace_curriculum(course: Course, sections: list) -> Course:
    from apps.enrollments.models import Enrollment

    old_ids = list(
        Lesson.objects.filter(section__course=course)
        .order_by("section__order", "order")
        .values_list("id", flat=True)
    )
    course.sections.all().delete()
    new_ids: list[int] = []
    for si, sec in enumerate(sections or []):
        s = Section.objects.create(
            course=course,
            title=sec.get("title", f"Section {si + 1}"),
            order=si,
        )
        for li, les in enumerate(sec.get("lessons", [])):
            lesson = Lesson.objects.create(
                section=s,
                title=les.get("title", "Untitled"),
                kind=les.get("kind", "video"),
                duration=les.get("duration", ""),
                resource_url=les.get("resource_url", ""),
                quiz_data=les.get("quiz_data", []),
                order=li,
            )
            new_ids.append(lesson.id)
    # A re-save deletes every old lesson row, so stored completions point at dead
    # IDs. Remap them by position so learner progress survives content edits.
    if old_ids and new_ids:
        old_index = {lid: i for i, lid in enumerate(old_ids)}
        for enrollment in Enrollment.objects.filter(course=course):
            done = sorted(
                old_index[lid] for lid in enrollment.completed_lessons if lid in old_index
            )
            enrollment.completed_lessons = [new_ids[i] for i in done if i < len(new_ids)]
            enrollment.progress = int(len(enrollment.completed_lessons) / len(new_ids) * 100)
            enrollment.save(update_fields=["completed_lessons", "progress"])
    return course


def add_to_wishlist(learner, course: Course) -> WishlistItem:
    item, created = WishlistItem.objects.get_or_create(learner=learner, course=course)
    if created:
        logger.info("User %s wishlisted course %s", learner.mobile, course.id)
    return item


def remove_from_wishlist(learner, course: Course) -> bool:
    deleted, _ = WishlistItem.objects.filter(learner=learner, course=course).delete()
    if deleted:
        logger.info("User %s removed course %s from wishlist", learner.mobile, course.id)
    return bool(deleted)


def rate_course(course: Course, user, rating: int) -> dict:
    from django.db.models import Avg

    from apps.enrollments.models import ActivityEvent
    from apps.enrollments.services import log_event

    Review.objects.update_or_create(course=course, user=user, defaults={"rating": rating})
    log_event(
        user,
        ActivityEvent.Verb.RATED_COURSE,
        course=course,
        meta={"rating": rating},
    )
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
