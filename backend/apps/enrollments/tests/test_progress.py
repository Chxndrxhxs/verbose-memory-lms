import pytest

from apps.courses.models import Course, Lesson, Section
from apps.courses.services import replace_curriculum
from apps.enrollments.services import enroll, mark_lesson_done
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="prog_instructor",
        mobile="9888888888",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="prog_learner",
        mobile="9899999999",
        role="learner",
        is_mobile_verified=True,
    )


def _make_course(instructor, lesson_titles):
    course = Course.objects.create(instructor=instructor, title="Progress", category="x", price=0)
    section = Section.objects.create(course=course, title="Ch 1", order=0)
    lessons = [
        Lesson.objects.create(section=section, title=t, kind="video", order=i)
        for i, t in enumerate(lesson_titles)
    ]
    return course, lessons


@pytest.mark.django_db
def test_shrinking_curriculum_prunes_and_caps_progress(instructor, learner):
    course, lessons = _make_course(instructor, ["A", "B", "C", "D"])
    enrollment = enroll(learner, course)
    for lesson in lessons:
        mark_lesson_done(learner, course, lesson)
    enrollment.refresh_from_db()
    assert enrollment.progress == 100

    # Three of four lessons are gone; the stale completions must be
    # pruned and progress must never exceed 100%.
    replace_curriculum(course, [{"title": "Ch 1", "lessons": [{"title": "A"}]}])
    enrollment.refresh_from_db()
    assert len(enrollment.completed_lessons) == 1
    assert enrollment.progress == 100


@pytest.mark.django_db
def test_empty_curriculum_clears_progress(instructor, learner):
    course, lessons = _make_course(instructor, ["A", "B"])
    enrollment = enroll(learner, course)
    for lesson in lessons:
        mark_lesson_done(learner, course, lesson)

    replace_curriculum(course, [])
    enrollment.refresh_from_db()
    assert enrollment.completed_lessons == []
    assert enrollment.progress == 0


@pytest.mark.django_db
def test_completing_again_stays_capped(instructor, learner):
    course, lessons = _make_course(instructor, ["A", "B"])
    enrollment = enroll(learner, course)
    for lesson in lessons:
        mark_lesson_done(learner, course, lesson)

    mark_lesson_done(learner, course, lessons[0])
    enrollment.refresh_from_db()
    assert enrollment.progress == 100
    assert len(enrollment.completed_lessons) == 2
