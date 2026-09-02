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


class OTP(models.Model):
    mobile = models.CharField(max_length=15, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_for(cls, mobile: str) -> "OTP":
        import random

        code = f"{random.randint(1000, 9999)}"
        return cls.objects.create(
            mobile=mobile,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() < self.expires_at

    class Meta:
        ordering = ["-created_at"]
