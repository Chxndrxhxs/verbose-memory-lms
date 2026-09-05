import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, Lesson, Section
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="scope_inst", mobile="9100000001", role="instructor", is_mobile_verified=True
    )


@pytest.fixture
def other_instructor(db):
    return User.objects.create_user(
        username="scope_other", mobile="9100000002", role="instructor", is_mobile_verified=True
    )


@pytest.fixture
def learner_a(db):
    return User.objects.create_user(
        username="scope_a",
        mobile="9100000011",
        role="learner",
        is_mobile_verified=True,
        city="Hyderabad",
    )


@pytest.fixture
def learner_b(db):
    return User.objects.create_user(
        username="scope_b",
        mobile="9100000012",
        role="learner",
        is_mobile_verified=True,
        city="Mumbai",
    )


@pytest.fixture
def course_mine(instructor):
    c = Course.objects.create(
        instructor=instructor, title="Mine", category="Engineering", price=0, status="published"
    )
    s = Section.objects.create(course=c, title="S1", order=0)
    Lesson.objects.create(section=s, title="L1", kind="text", order=0)
    return c


@pytest.fixture
def course_other(other_instructor):
    c = Course.objects.create(
        instructor=other_instructor, title="Other", category="Business", price=0, status="published"
    )
    s = Section.objects.create(course=c, title="S1", order=0)
    Lesson.objects.create(section=s, title="L1", kind="text", order=0)
    return c


def _enroll(client, course, learner):
    c2 = APIClient()
    c2.force_authenticate(learner)
    c2.post(f"/api/v1/courses/{course.id}/enroll")
    return c2


@pytest.mark.django_db
def test_global_returns_all(instructor, course_mine, course_other, learner_a, learner_b):
    _enroll(APIClient(), course_mine, learner_a)
    _enroll(APIClient(), course_other, learner_b)
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.get("/api/v1/leaderboard/")
    assert r.status_code == 200
    assert r.json()["meta"]["total"] >= 2


@pytest.mark.django_db
def test_my_students_only_own(instructor, course_mine, course_other, learner_a, learner_b):
    _enroll(APIClient(), course_mine, learner_a)
    _enroll(APIClient(), course_other, learner_b)
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.get("/api/v1/leaderboard/?my_students=1")
    assert r.status_code == 200
    ids = [e["learner"]["id"] for e in r.json()["data"]]
    assert learner_a.id in ids
    assert learner_b.id not in ids
    assert r.json()["meta"]["scope"] == "my_students"


@pytest.mark.django_db
def test_my_students_learner_forbidden(learner_a):
    c = APIClient()
    c.force_authenticate(learner_a)
    r = c.get("/api/v1/leaderboard/?my_students=1")
    assert r.status_code == 403


@pytest.mark.django_db
def test_my_students_empty_instructor(instructor):
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.get("/api/v1/leaderboard/?my_students=1")
    assert r.status_code == 200
    assert r.json()["meta"]["total"] == 0
    assert r.json()["data"] == []


@pytest.mark.django_db
def test_my_students_filters_still_apply(instructor, course_mine, learner_a, learner_b):
    _enroll(APIClient(), course_mine, learner_a)
    _enroll(APIClient(), course_mine, learner_b)
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.get("/api/v1/leaderboard/?my_students=1&city=Hyderabad")
    assert r.status_code == 200
    cities = [e["learner"]["city"] for e in r.json()["data"]]
    assert all(v == "Hyderabad" for v in cities)
