import logging

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.payments.models import Payment

logger = logging.getLogger(__name__)

User = get_user_model()


def dashboard_stats() -> dict:
    users = User.objects.all()
    courses = Course.objects.all()
    enrollments = Enrollment.objects.all()
    payments = Payment.objects.filter(status=Payment.Status.PAID)

    revenue_paise = payments.aggregate(total=Sum("amount"))["total"] or 0

    top_categories = (
        Course.objects.filter(status=Course.Status.PUBLISHED)
        .values("category")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    return {
        "users": {
            "total": users.count(),
            "learners": users.filter(role=User.Role.LEARNER).count(),
            "instructors": users.filter(role=User.Role.INSTRUCTOR).count(),
            "admins": users.filter(role=User.Role.ADMIN).count(),
        },
        "courses": {
            "total": courses.count(),
            "published": courses.filter(status=Course.Status.PUBLISHED).count(),
            "drafts": courses.filter(status=Course.Status.DRAFT).count(),
            "paid": courses.exclude(price=0).count(),
            "free": courses.filter(price=0).count(),
        },
        "enrollments": {
            "total": enrollments.count(),
            "in_progress": enrollments.exclude(progress=100).count(),
            "completed": enrollments.filter(progress=100).count(),
        },
        "revenue_inr": revenue_paise / 100,
        "payments_paid": payments.count(),
        "top_categories": list(top_categories),
        "recent_users": [
            {
                "id": u.id,
                "name": u.get_full_name() or u.username,
                "mobile": u.mobile,
                "role": u.role,
                "city": u.city,
                "avatar": u.avatar,
                "date_joined": u.date_joined,
            }
            for u in users.order_by("-date_joined")[:6]
        ],
        "recent_enrollments": [
            {
                "id": e.id,
                "learner_id": e.learner_id,
                "learner": e.learner.get_full_name() or e.learner.username,
                "course": e.course.title,
                "progress": e.progress,
                "enrolled_at": e.enrolled_at,
            }
            for e in enrollments.select_related("learner", "course").order_by("-enrolled_at")[:6]
        ],
    }


def delete_course(course: Course) -> None:
    title = course.title
    course.delete()
    logger.info("Admin deleted course %s (%s)", title, course.id)


def delete_user(user) -> None:
    identity = user.mobile
    user.delete()
    logger.info("Admin deleted user %s", identity)


def update_user(user, data: dict):
    name = data.pop("name", None)
    if name is not None:
        parts = str(name).strip().split(" ", 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else ""
    for key, value in data.items():
        setattr(user, key, value)
    user.save()
    return user


def user_search_qs(q: str):
    qs = User.objects.all()
    if q:
        qs = qs.filter(
            Q(mobile__icontains=q)
            | Q(username__icontains=q)
            | Q(email__icontains=q)
            | Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
        )
    return qs


def course_search_qs(q: str):
    qs = Course.objects.select_related("instructor").prefetch_related("enrollments")
    if q:
        qs = qs.filter(
            Q(title__icontains=q)
            | Q(subtitle__icontains=q)
            | Q(instructor__first_name__icontains=q)
            | Q(instructor__last_name__icontains=q)
            | Q(instructor__username__icontains=q)
        )
    return qs


def enrollment_search_qs(q: str):
    qs = Enrollment.objects.select_related("learner", "course", "course__instructor")
    if q:
        qs = qs.filter(
            Q(learner__mobile__icontains=q)
            | Q(learner__first_name__icontains=q)
            | Q(learner__last_name__icontains=q)
            | Q(course__title__icontains=q)
        )
    return qs


def payment_search_qs(q: str):
    qs = Payment.objects.select_related("user", "course", "course__instructor")
    if q:
        qs = qs.filter(
            Q(user__mobile__icontains=q)
            | Q(user__first_name__icontains=q)
            | Q(user__last_name__icontains=q)
            | Q(course__title__icontains=q)
            | Q(razorpay_order_id__icontains=q)
        )
    return qs
