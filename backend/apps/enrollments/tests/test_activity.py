import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, Lesson, Section
from apps.enrollments.models import Enrollment, LessonCompletion
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="l1",
        mobile="9111111111",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="i1",
        mobile="9222222222",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def course_with_lesson(instructor, learner):
    course = Course.objects.create(
        instructor=instructor,
        title="T",
        category="x",
        price=0,
        status="published",
    )
    section = Section.objects.create(course=course, title="S1", order=0)
    lesson = Lesson.objects.create(section=section, title="L1", kind="text", order=0)
    Enrollment.objects.create(learner=learner, course=course)
    return course, lesson


@pytest.mark.django_db
def test_complete_lesson_records_completion(course_with_lesson, learner):
    course, lesson = course_with_lesson
    c = APIClient()
    c.force_authenticate(learner)
    r = c.post(
        f"/api/v1/courses/{course.id}/lessons/complete",
        {"lesson_id": lesson.id},
        format="json",
    )
    assert r.status_code == 200
    assert LessonCompletion.objects.filter(learner=learner, lesson=lesson).exists()


@pytest.mark.django_db
def test_activity_returns_last_six_months(course_with_lesson, learner):
    from django.utils import timezone

    course, lesson = course_with_lesson
    c = APIClient()
    c.force_authenticate(learner)
    c.post(
        f"/api/v1/courses/{course.id}/lessons/complete",
        {"lesson_id": lesson.id},
        format="json",
    )
    r = c.get("/api/v1/me/activity/")
    assert r.status_code == 200
    data = r.json()["data"]
    today = timezone.now().date().isoformat()
    today_entry = next((d for d in data if d["date"] == today), None)
    assert today_entry is not None
    assert today_entry["count"] == 1


@pytest.mark.django_db
def test_activity_requires_auth():
    c = APIClient()
    r = c.get("/api/v1/me/activity/")
    assert r.status_code == 401
