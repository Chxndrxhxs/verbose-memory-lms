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


def attempt(c, course_id, lesson_id, answers):
    return c.post(
        f"/api/v1/courses/{course_id}/lessons/quiz-attempt",
        {"lesson_id": lesson_id, "answers": answers},
        format="json",
    )


@pytest.mark.django_db
def test_quiz_attempt_graded_server_side(learner, quiz_lesson):
    course, lesson, _ = quiz_lesson
    Enrollment.objects.create(learner=learner, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    # correct answer is option 0 — forged score is ignored, answers are graded
    r = attempt(c, course.id, lesson.id, {"0": 1})
    assert r.status_code == 200
    assert r.json()["data"] == {
        "score": 0,
        "total": 1,
        "passed": False,
        "attempt": 1,
        "best": 0,
    }
    r = attempt(c, course.id, lesson.id, {"0": 0})
    assert r.json()["data"]["score"] == 1
    assert r.json()["data"]["passed"] is True
    assert r.json()["data"]["attempt"] == 2
    assert r.json()["data"]["best"] == 1
    assert (
        ActivityEvent.objects.filter(learner=learner, verb=ActivityEvent.Verb.QUIZ_ATTEMPT).count()
        == 2
    )


@pytest.mark.django_db
def test_quiz_attempt_rejects_missing_answers(learner, quiz_lesson):
    course, lesson, _ = quiz_lesson
    Enrollment.objects.create(learner=learner, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    r = c.post(
        f"/api/v1/courses/{course.id}/lessons/quiz-attempt",
        {"lesson_id": lesson.id, "score": 2, "total": 2},
        format="json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_quiz_attempt_attempt_numbers_track_best(learner, quiz_lesson):
    course, lesson, _ = quiz_lesson
    Enrollment.objects.create(learner=learner, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    r = attempt(c, course.id, lesson.id, {"0": 1})
    assert r.status_code == 200
    assert r.json()["data"]["attempt"] == 1
    assert r.json()["data"]["best"] == 0
    r = attempt(c, course.id, lesson.id, {"0": 0})
    assert r.json()["data"]["attempt"] == 2
    assert r.json()["data"]["best"] == 1
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
    r = attempt(c, course.id, lesson.id, {"0": 0})
    assert r.status_code == 404


@pytest.mark.django_db
def test_quiz_attempt_rejects_non_quiz_lessons(learner, quiz_lesson):
    course, lesson, text = quiz_lesson
    Enrollment.objects.create(learner=learner, course=course)
    c = APIClient()
    c.force_authenticate(user=learner)
    r = attempt(c, course.id, text.id, {"0": 0})
    assert r.status_code == 400
