import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, Lesson, Section
from apps.enrollments.models import ActivityEvent, Enrollment
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="quiz_learner",
        mobile="9666666660",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="quiz_instructor",
        mobile="9777777770",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def quiz_lesson(instructor):
    course = Course.objects.create(
        instructor=instructor,
        title="T",
        category="x",
        price=0,
        status="published",
    )
    section = Section.objects.create(course=course, title="S1", order=0)
    lesson = Lesson.objects.create(
        section=section,
        title="Q1",
        kind="quiz",
        order=0,
        quiz_data=[{"id": "q1", "question": "Q?", "options": ["a", "b"], "correct": 0}],
    )
    text = Lesson.objects.create(section=section, title="L1", kind="text", order=1)
    return course, lesson, text


def attempt(c, course_id, lesson_id, score, total):
    return c.post(
        f"/api/v1/courses/{course_id}/lessons/quiz-attempt",
        {"lesson_id": lesson_id, "score": score, "total": total},
        format="json",
    )


@pytest.mark.django_db
def test_quiz_attempt_logged_with_attempt_number(learner, quiz_lesson):
    course, lesson, _ = quiz_lesson
    Enrollment.objects.create(learner=learner, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    r = attempt(c, course.id, lesson.id, 1, 2)
    assert r.status_code == 200
    assert r.json()["data"] == {
        "score": 1,
        "total": 2,
        "passed": False,
        "attempt": 1,
        "best": 1,
    }
    r = attempt(c, course.id, lesson.id, 2, 2)
    assert r.json()["data"]["attempt"] == 2
    assert r.json()["data"]["best"] == 2
    assert r.json()["data"]["passed"] is True
    assert (
        ActivityEvent.objects.filter(learner=learner, verb=ActivityEvent.Verb.QUIZ_ATTEMPT).count()
        == 2
    )


@pytest.mark.django_db
def test_quiz_attempt_requires_enrollment(learner, quiz_lesson):
    course, lesson, _ = quiz_lesson
    c = APIClient()
    c.force_authenticate(user=learner)
    r = attempt(c, course.id, lesson.id, 1, 1)
    assert r.status_code == 404


@pytest.mark.django_db
def test_quiz_attempt_rejects_non_quiz_and_bad_scores(learner, quiz_lesson):
    course, lesson, text = quiz_lesson
    Enrollment.objects.create(learner=learner, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    r = attempt(c, course.id, text.id, 1, 1)
    assert r.status_code == 400
    r = attempt(c, course.id, lesson.id, 5, 2)
    assert r.status_code == 400
    r = attempt(c, course.id, lesson.id, 1, 0)
    assert r.status_code == 400
