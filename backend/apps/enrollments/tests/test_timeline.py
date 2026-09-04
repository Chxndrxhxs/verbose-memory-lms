import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, Lesson, Section
from apps.enrollments.models import ActivityEvent, Enrollment
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="timeline_learner",
        mobile="9888888888",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="timeline_instructor",
        mobile="9999999999",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def course_with_lesson(instructor):
    course = Course.objects.create(
        instructor=instructor,
        title="T",
        category="x",
        price=0,
        status="published",
    )
    section = Section.objects.create(course=course, title="S1", order=0)
    lesson = Lesson.objects.create(section=section, title="L1", kind="text", order=0)
    return course, lesson


@pytest.mark.django_db
def test_enroll_and_complete_log_events(learner, course_with_lesson):
    course, lesson = course_with_lesson
    c = APIClient()
    c.force_authenticate(user=learner)
    r = c.post(f"/api/v1/courses/{course.id}/enroll")
    assert r.status_code == 200
    assert ActivityEvent.objects.filter(
        learner=learner, verb=ActivityEvent.Verb.ENROLLED, course=course
    ).exists()
    r = c.post(
        f"/api/v1/courses/{course.id}/lessons/complete",
        {"lesson_id": lesson.id},
        format="json",
    )
    assert r.status_code == 200
    assert ActivityEvent.objects.filter(
        learner=learner,
        verb=ActivityEvent.Verb.COMPLETED_LESSON,
        lesson=lesson,
    ).exists()


@pytest.mark.django_db
def test_reenroll_does_not_duplicate_enrolled_event(learner, course_with_lesson):
    course, _ = course_with_lesson
    c = APIClient()
    c.force_authenticate(user=learner)
    c.post(f"/api/v1/courses/{course.id}/enroll")
    c.post(f"/api/v1/courses/{course.id}/enroll")
    assert (
        ActivityEvent.objects.filter(
            learner=learner, verb=ActivityEvent.Verb.ENROLLED, course=course
        ).count()
        == 1
    )


@pytest.mark.django_db
def test_timeline_returns_own_events_only(learner, instructor, course_with_lesson):
    course, lesson = course_with_lesson
    other = User.objects.create_user(username="timeline_other", mobile="9777777770", role="learner")
    Enrollment.objects.create(learner=other, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    c.post(f"/api/v1/courses/{course.id}/enroll")
    c.post(
        f"/api/v1/courses/{course.id}/lessons/complete",
        {"lesson_id": lesson.id},
        format="json",
    )
    r = c.get("/api/v1/me/timeline")
    assert r.status_code == 200
    verbs = [e["verb"] for e in r.json()["data"]]
    assert "enrolled" in verbs
    assert "completed_lesson" in verbs
    entry = next(e for e in r.json()["data"] if e["verb"] == "completed_lesson")
    assert entry["course_title"] == "T"
    assert entry["lesson_title"] == "L1"
    # filter by verb
    r = c.get("/api/v1/me/timeline?verb=enrolled")
    assert [e["verb"] for e in r.json()["data"]] == ["enrolled"]


@pytest.mark.django_db
def test_timeline_requires_auth(course_with_lesson):
    c = APIClient()
    r = c.get("/api/v1/me/timeline")
    assert r.status_code == 401
