from django.conf import settings
from django.db import models


class Enrollment(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    progress = models.PositiveSmallIntegerField(default=0)
    completed_lessons = models.JSONField(default=list)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("learner", "course")
        ordering = ["-enrolled_at"]


class LessonCompletion(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_completions",
    )
    lesson = models.ForeignKey(
        "courses.Lesson",
        on_delete=models.CASCADE,
        related_name="completions",
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("learner", "lesson")
        ordering = ["-completed_at"]
        indexes = [models.Index(fields=["learner", "completed_at"])]


class Certificate(models.Model):
    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    certificate_id = models.CharField(max_length=32, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("learner", "course")
        ordering = ["-issued_at"]


class ActivityEvent(models.Model):
    """Append-only learner activity log. Never updated — history is the point."""

    class Verb(models.TextChoices):
        ENROLLED = "enrolled", "Enrolled"
        VIEWED_LESSON = "viewed_lesson", "Viewed lesson"
        COMPLETED_LESSON = "completed_lesson", "Completed lesson"
        QUIZ_ATTEMPT = "quiz_attempt", "Quiz attempt"
        ASSIGNMENT_SUBMITTED = "assignment_submitted", "Submitted assignment"
        ASSIGNMENT_GRADED = "assignment_graded", "Assignment graded"
        RATED_COURSE = "rated_course", "Rated course"
        EARNED_CERTIFICATE = "earned_certificate", "Earned certificate"
        SESSION_START = "session_start", "Session start"

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_events",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activity_events",
    )
    lesson = models.ForeignKey(
        "courses.Lesson",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activity_events",
    )
    verb = models.CharField(max_length=24, choices=Verb.choices, db_index=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["learner", "created_at"]),
            models.Index(fields=["course", "verb", "created_at"]),
        ]
