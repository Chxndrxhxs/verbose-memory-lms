import logging

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

logger = logging.getLogger(__name__)


class HierarchicalBase(models.Model):
    """Shared fields for the dynamic category tree (Category -> Sub Category -> Inter Category)."""

    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(HierarchicalBase):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignment_categories",
    )

    class Meta:
        ordering = ["position", "name"]

    def __str__(self) -> str:
        return self.name


class SubCategory(HierarchicalBase):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignment_subcategories",
    )

    class Meta:
        ordering = ["position", "name"]

    def __str__(self) -> str:
        return f"{self.category.name} / {self.name}"


class InterCategory(HierarchicalBase):
    sub_category = models.ForeignKey(
        SubCategory, on_delete=models.CASCADE, related_name="intercategories"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignment_intercategories",
    )

    class Meta:
        ordering = ["position", "name"]

    def __str__(self) -> str:
        return f"{self.sub_category} / {self.name}"


class Assignment(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    class AccessType(models.TextChoices):
        FREE = "free", "Free"
        PREMIUM = "premium", "Premium"
        PAID = "paid", "Paid"
        SUBSCRIPTION = "subscription", "Subscription"
        ORG = "org", "Organization-only"
        ROLE = "role", "Role-based"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    instructions = models.TextField(blank=True, default="")
    inter_category = models.ForeignKey(
        InterCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments",
    )
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_assignments",
    )

    source_document = models.CharField(max_length=500, blank=True, default="")
    source_document_name = models.CharField(max_length=200, blank=True, default="")
    # Stable storage id for the uploaded source file (path under the document
    # store). Derive once from source_document; the extract pipeline prefers
    # this over re-parsing URLs so backends can move off local disk.
    source_document_file_id = models.CharField(max_length=500, blank=True, default="")
    # The instructor wizard is progressively saved, including its in-progress
    # client-side model arrangement, so a refresh can resume the exact draft.
    draft_data = models.JSONField(default=dict, blank=True)

    # Evaluation
    marks_per_correct = models.DecimalField(
        max_digits=6, decimal_places=2, default=1, validators=[MinValueValidator(0)]
    )
    negative_marking = models.BooleanField(default=True)
    negative_marks_per_wrong = models.DecimalField(
        max_digits=6, decimal_places=2, default=0.25, validators=[MinValueValidator(0)]
    )
    marks_unanswered = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    passing_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    # Timing window
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    max_attempts = models.PositiveIntegerField(default=0)

    # Behaviour
    randomize_questions = models.BooleanField(default=False)
    randomize_options = models.BooleanField(default=False)

    # Subscription / access model - structured now so it can be gated later.
    access_type = models.CharField(
        max_length=20, choices=AccessType.choices, default=AccessType.FREE
    )
    access = models.JSONField(default=dict, blank=True)

    # Proctoring / browser lock - configurable per assignment.
    security = models.JSONField(
        default=dict,
        blank=True,
        help_text="Keys: fullscreen, camera, microphone, block_tab_switch, block_copy, "
        "block_paste, block_right_click, block_shortcuts, violations_before_auto_submit",
    )
    # Results disclosure.
    results = models.JSONField(
        default=dict,
        blank=True,
        help_text="Keys: instant_result, show_marks, show_correct_answers, show_explanations",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class AssignmentModel(models.Model):
    class ExecutionMode(models.TextChoices):
        SEQUENTIAL = "sequential", "Sequential"
        PARALLEL = "parallel", "Parallel"

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="models")
    code = models.CharField(max_length=30)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    execution_mode = models.CharField(
        max_length=12, choices=ExecutionMode.choices, default=ExecutionMode.SEQUENTIAL
    )
    is_published = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return f"{self.assignment.title} / {self.name}"


class AssignmentModelStep(models.Model):
    class Kind(models.TextChoices):
        TEST = "test", "Test"
        SET = "set", "Set"

    model = models.ForeignKey(AssignmentModel, on_delete=models.CASCADE, related_name="steps")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.TEST)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    duration_seconds = models.PositiveIntegerField(default=900)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return f"{self.name} ({self.duration_seconds}s)"


class AssignmentQuestion(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="questions")
    step = models.ForeignKey(
        AssignmentModelStep, on_delete=models.CASCADE, related_name="questions"
    )
    question = models.TextField()
    question_image = models.CharField(max_length=500, blank=True, default="")
    options = models.JSONField(default=list)
    correct_answer = models.PositiveIntegerField(default=0)
    explanation = models.TextField(blank=True, default="")
    marks = models.DecimalField(
        max_digits=6, decimal_places=2, default=1, validators=[MinValueValidator(0)]
    )
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM
    )
    topic = models.CharField(max_length=120, blank=True, default="")
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return self.question[:60]


class AssignmentAttempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        EXPIRED = "expired", "Expired"

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignment_attempts"
    )
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="attempts")
    model = models.ForeignKey(AssignmentModel, on_delete=models.CASCADE, related_name="attempts")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.IN_PROGRESS)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    is_auto_submitted = models.BooleanField(default=False)

    answers = models.JSONField(default=dict, blank=True)
    questions_snapshot = models.JSONField(default=dict, blank=True)
    transcript = models.JSONField(default=dict, blank=True)

    # Aggregated outcome
    total_questions = models.PositiveIntegerField(default=0)
    answered = models.PositiveIntegerField(default=0)
    correct = models.PositiveIntegerField(default=0)
    wrong = models.PositiveIntegerField(default=0)
    unanswered = models.PositiveIntegerField(default=0)
    positive_marks = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    negative_marks = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    final_score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.learner} -> {self.assignment} ({self.status})"


class AssignmentResult(models.Model):
    attempt = models.OneToOneField(
        AssignmentAttempt, on_delete=models.CASCADE, related_name="result"
    )
    transcript = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Result {self.attempt_id}"
