from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        LEARNER = "learner", "Learner"
        INSTRUCTOR = "instructor", "Instructor"
        ADMIN = "admin", "Admin"

    mobile = models.CharField(max_length=15, unique=True)
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.LEARNER)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    city = models.CharField(max_length=64, blank=True, default="")
    avatar = models.URLField(blank=True, default="")
    is_mobile_verified = models.BooleanField(default=False)
    email = models.EmailField(blank=True)

    def __str__(self) -> str:
        return f"{self.username} ({self.mobile})"

    @property
    def profile_complete(self) -> bool:
        """True once the user has set a name, email, age and city.

        Incomplete profiles are locked out of protected endpoints
        (see apps.users.permissions.RequireCompleteProfile) until the
        /auth/complete-profile step is done.
        """
        return bool(
            self.first_name and self.email and self.age is not None and self.city
        )

    @property
    def display_name(self) -> str:
        """Public-facing name. The username is the raw mobile number,
        so it must never surface as a display name on leaderboards,
        certificates or instructor bylines — phone numbers are private.
        """
        full = self.get_full_name()
        if full:
            return full
        if self.role == self.Role.INSTRUCTOR:
            return "Instructor"
        if self.role == self.Role.ADMIN:
            return "Admin"
        return f"Learner #{self.id}"


class OTP(models.Model):
    mobile = models.CharField(max_length=15, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    MAX_ATTEMPTS = 5

    @classmethod
    def create_for(cls, mobile: str, code: str | None = None) -> "OTP":
        import random

        # resending invalidates older unused codes for this mobile
        cls.objects.filter(mobile=mobile, is_used=False).update(is_used=True)
        code = code or f"{random.randint(1000, 9999)}"
        return cls.objects.create(
            mobile=mobile,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

    def is_valid(self) -> bool:
        return (
            not self.is_used
            and self.attempts < self.MAX_ATTEMPTS
            and timezone.now() < self.expires_at
        )

    class Meta:
        ordering = ["-created_at"]
