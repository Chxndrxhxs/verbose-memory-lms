import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="ov_instructor",
        mobile="9666666666",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="ov_learner",
        mobile="9777777777",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.mark.django_db
def test_instructor_overview_returns_totals(instructor, learner):
    course = Course.objects.create(
        instructor=instructor,
        title="T",
        category="x",
        price=100,
        status="published",
    )
    draft = Course.objects.create(
        instructor=instructor,
        title="D",
        category="x",
        price=0,
        status="draft",
    )
    Enrollment.objects.create(learner=learner, course=course)
    # A course can go back to draft after learners enrolled; those
    # enrollments must not reach the published-catalogue stats.
    Enrollment.objects.create(learner=learner, course=draft)
    c = APIClient()
    c.force_authenticate(user=instructor)
    r = c.get("/api/v1/instructor/overview")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total_courses"] == 2
    assert data["drafts"] == 1
    assert data["published_courses"] == 1
    assert data["total_students"] == 1
    assert data["top_course"]["title"] == "T"
    assert [x["title"] for x in data["courses"]] == ["T"]
    assert len(data["recent_enrollments"]) == 2


@pytest.mark.django_db
def test_instructor_overview_empty_for_new_instructor(instructor):
    c = APIClient()
    c.force_authenticate(user=instructor)
    r = c.get("/api/v1/instructor/overview")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total_courses"] == 0
    assert data["top_course"] is None
    assert data["recent_enrollments"] == []


@pytest.mark.django_db
def test_instructor_overview_requires_auth():
    c = APIClient()
    r = c.get("/api/v1/instructor/overview")
    assert r.status_code == 401
