import logging

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

logger = logging.getLogger(__name__)


class QuestionPack(models.Model):
    """A sellable bundle of questions (e.g. "100 Aptitude Questions").

    Questions are snapshot copies (PackQuestion), so editing the source
    assignment never mutates an already-sold pack. At publish time the pack is
    materialised into one hidden Assignment per allowed module; learners only
    ever attempt those instances through the pack flow.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    cover = models.URLField(blank=True, default="")
    inter_category = models.ForeignKey(
        "assignments.InterCategory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="packs",
    )
    # Mirrors Assignment.board so the learner catalog can filter packs and
    # assignments by the same single "Board" dropdown.
    board = models.ForeignKey(
        "assignments.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="packs",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="question_packs",
    )

    price = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    original_price = models.DecimalField(max_digits=7, decimal_places=2, default=0, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)

    # Exam formats this pack can be taken in (subset of practice/mock).
    allowed_modules = models.JSONField(default=list, blank=True)
    # Shared attempt pool across all modules. 0 = unlimited.
    max_attempts = models.PositiveIntegerField(default=0)

    # Exam shaping knobs used when materialising instances.
    test_size = models.PositiveIntegerField(default=25)
    test_duration_seconds = models.PositiveIntegerField(default=1800)
    set_size = models.PositiveIntegerField(default=10)
    set_duration_seconds = models.PositiveIntegerField(default=600)
    execution_mode = models.CharField(max_length=12, default="sequential")
    passing_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    negative_marking = models.BooleanField(default=True)

    question_count = models.PositiveIntegerField(default=0)
    # Bumped whenever questions change after publishing; purchases pin it.
    # Revenue sharing plugs in here later (currently out of scope).
    version = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class PackQuestion(models.Model):
    """A snapshot copy of a question belonging to a pack."""

    pack = models.ForeignKey(QuestionPack, on_delete=models.CASCADE, related_name="questions")
    question = models.TextField()
    question_image = models.CharField(max_length=500, blank=True, default="")
    options = models.JSONField(default=list)
    correct_answer = models.PositiveIntegerField(default=0)
    explanation = models.TextField(blank=True, default="")
    marks = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    difficulty = models.CharField(max_length=10, default="medium")
    topic = models.CharField(max_length=120, blank=True, default="")
    position = models.PositiveIntegerField(default=0)
    # Provenance: {"kind": "bank"|"upload"|"generated", "assignment_id": N, ...}
    source = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return self.question[:60]


class PackPurchase(models.Model):
    """Entitlement: a learner owns a pack version with a shared attempt pool."""

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pack_purchases"
    )
    pack = models.ForeignKey(QuestionPack, on_delete=models.CASCADE, related_name="purchases")
    version = models.PositiveIntegerField(default=1)
    payment = models.ForeignKey(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pack_purchases",
    )
    attempts_used = models.PositiveIntegerField(default=0)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("learner", "pack")
        ordering = ["-purchased_at"]

    def __str__(self) -> str:
        return f"{self.learner} -> {self.pack}"
