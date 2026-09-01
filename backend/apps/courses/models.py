from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    class Level(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="courses"
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, db_index=True)
    price = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    cover_image = models.URLField(blank=True)
    level = models.CharField(max_length=12, choices=Level.choices, default=Level.BEGINNER)
    average_rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)
    what_you_will_learn = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:200]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class Section(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sections")
    title = models.CharField(max_length=200)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class Lesson(models.Model):
    class Kind(models.TextChoices):
        VIDEO = "video", "Video"
        PDF = "pdf", "PDF"
        QUIZ = "quiz", "Quiz"
        LINK = "link", "External link"
        AUDIO = "audio", "Audio"
        TEXT = "text", "Text / Markdown"

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.VIDEO)
    duration = models.CharField(max_length=10, blank=True)
    video_url = models.URLField(blank=True)
    resource_url = models.URLField(blank=True)
    quiz_data = models.JSONField(default=list, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]
