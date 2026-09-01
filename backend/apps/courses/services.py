import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from .models import Course

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mp3", ".wav", ".txt", ".md",
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

