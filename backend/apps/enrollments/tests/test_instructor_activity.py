import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, Lesson, Section
from apps.enrollments.models import ActivityEvent
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="iact_inst",
        mobile="9000000001",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="iact_learn",
        mobile="9000000002",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def other_instructor(db):
    return User.objects.create_user(
        username="iact_other",
        mobile="9000000003",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor_course(instructor):
    c = Course.objects.create(
        instructor=instructor, title="My Course", category="x", price=0, status="published"
    )
    s = Section.objects.create(course=c, title="S1", order=0)
    lesson = Lesson.objects.create(section=s, title="L1", kind="text", order=0)
    return c, lesson


@pytest.fixture
def other_course(other_instructor):
    c = Course.objects.create(
        instructor=other_instructor, title="Other", category="x", price=0, status="published"
    )
    s = Section.objects.create(course=c, title="S1", order=0)
    Lesson.objects.create(section=s, title="L1", kind="text", order=0)
    return c


@pytest.mark.django_db
def test_requires_auth():
    c = APIClient()
    r = c.get("/api/v1/instructor/activity/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_learner_forbidden(instructor_course, learner):
    c = APIClient()
    c.force_authenticate(learner)
    r = c.get("/api/v1/instructor/activity/")
    assert r.status_code == 403


@pytest.mark.django_db
def test_instructor_sees_own_events(instructor, instructor_course, learner):
    course, lesson = instructor_course
    c = APIClient()
    c2 = APIClient()
    c2.force_authenticate(learner)
    c2.post(f"/api/v1/courses/{course.id}/enroll")
    c2.post(
        f"/api/v1/courses/{course.id}/lessons/complete",
        {"lesson_id": lesson.id},
        format="json",
    )

    c.force_authenticate(instructor)
    r = c.get("/api/v1/instructor/activity/")
    assert r.status_code == 200
    verbs = [e["verb"] for e in r.json()["data"]]
    assert "enrolled" in verbs
    assert "completed_lesson" in verbs
    entry = next(e for e in r.json()["data"] if e["verb"] == "completed_lesson")
    assert entry["learner"] is not None
    assert entry["course_title"] == "My Course"


@pytest.mark.django_db
def test_other_instructor_not_visible(instructor, other_course, learner):
    c = APIClient()
    c2 = APIClient()
    c2.force_authenticate(learner)
    c2.post(f"/api/v1/courses/{other_course.id}/enroll")

    c.force_authenticate(instructor)
    r = c.get("/api/v1/instructor/activity/")
    assert r.status_code == 200
    titles = [e["course_title"] for e in r.json()["data"]]
    assert "Other" not in titles


@pytest.mark.django_db
def test_verb_and_course_filter(instructor, instructor_course, learner):
    course, lesson = instructor_course
    c = APIClient()
    c2 = APIClient()
    c2.force_authenticate(learner)
    c2.post(f"/api/v1/courses/{course.id}/enroll")
    c2.post(
        f"/api/v1/courses/{course.id}/lessons/complete",
        {"lesson_id": lesson.id},
        format="json",
    )

    c.force_authenticate(instructor)
    r = c.get("/api/v1/instructor/activity/?verb=enrolled")
    assert all(e["verb"] == "enrolled" for e in r.json()["data"])

    r = c.get(f"/api/v1/instructor/activity/?course_id={course.id}")
    assert len(r.json()["data"]) >= 1

    r = c.get("/api/v1/instructor/activity/?verb=invalid")
    assert r.status_code == 400


@pytest.mark.django_db
def test_pagination(instructor, instructor_course, learner):
    course, lesson = instructor_course
    c = APIClient()
    c2 = APIClient()
    c2.force_authenticate(learner)
    c2.post(f"/api/v1/courses/{course.id}/enroll")
    for _ in range(3):
        ActivityEvent.objects.create(learner=learner, course=course, verb="completed_lesson")

    c.force_authenticate(instructor)
    r = c.get("/api/v1/instructor/activity/?page=1")
    assert r.status_code == 200
    assert "meta" in r.json()
    assert "page" in r.json()["meta"]
