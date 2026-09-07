import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, Lesson, Section
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="lb_instructor",
        mobile="9000000051",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="lb_learner",
        mobile="9000000061",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def course(instructor):
    course = Course.objects.create(
        instructor=instructor,
        title="Leaderboard course",
        category="Science",
        price=0,
        status="published",
    )
    section = Section.objects.create(course=course, title="S1", order=0)
    Lesson.objects.create(section=section, title="L1", kind="text", order=0)
    Lesson.objects.create(
        section=section,
        title="Q1",
        kind="quiz",
        order=1,
        quiz_data=[{"id": "q1", "question": "Q?", "options": ["a", "b"], "correct": 0}],
    )
    return course


def lb(client, params=""):
    return client.get(f"/api/v1/leaderboard/{params}")


def find(entries, learner_id):
    return next((e for e in entries if e["learner"]["id"] == learner_id), None)


@pytest.mark.django_db
def test_quiet_learner_appears_with_zero_rr(instructor, learner, course):
    c = APIClient()
    c.force_authenticate(instructor)
    r = lb(c)
    assert r.status_code == 200
    entry = find(r.json()["data"], learner.id)
    assert entry is not None
    assert entry["rr"] == 0
    assert entry["tier"] == "Iron"
    assert entry["stats"] == {
        "quiz_accuracy": 0.0,
        "completion_rate": 0.0,
        "certificates": 0,
        "streak": 0,
        "lessons_completed": 0,
    }


@pytest.mark.django_db
def test_rr_pipeline_enroll_quiz_cert(instructor, learner, course):
    lc = APIClient()
    lc.force_authenticate(learner)
    r = lc.post(f"/api/v1/courses/{course.id}/enroll")
    assert r.status_code == 200

    lesson_text = Lesson.objects.get(section__course=course, kind="text")
    lesson_quiz = Lesson.objects.get(section__course=course, kind="quiz")

    q = lc.post(
        f"/api/v1/courses/{course.id}/lessons/quiz-attempt",
        {"lesson_id": lesson_quiz.id, "score": 4, "total": 5},
        format="json",
    )
    assert q.status_code == 200
    for lid in (lesson_text.id, lesson_quiz.id):
        r = lc.post(
            f"/api/v1/courses/{course.id}/lessons/complete", {"lesson_id": lid}, format="json"
        )
        assert r.status_code == 200, r.content

    r = lb(lc, "?season=alltime")
    assert r.status_code == 200
    body = r.json()
    entry = find(body["data"], learner.id)
    assert entry is not None
    assert entry["stats"]["quiz_accuracy"] == 0.8
    assert entry["stats"]["completion_rate"] == 1.0
    assert entry["stats"]["certificates"] == 1
    assert entry["stats"]["lessons_completed"] == 2
    assert entry["stats"]["streak"] >= 1
    assert 660 <= entry["rr"] <= 665  # 0.8*400 + 1.0*300 + 0.2*200 + ~0.03*100
    assert entry["tier"] == "Platinum"
    total_breakdown = sum(entry["breakdown"].values())
    assert abs(total_breakdown - entry["rr"]) <= 5
    assert body["me"] is not None and body["me"]["learner"]["id"] == learner.id
    assert body["me"]["rank"] == entry["rank"]


@pytest.mark.django_db
def test_ordering_by_quiz_accuracy(instructor, learner, course):
    lc = APIClient()
    lc.force_authenticate(learner)
    lc.post(f"/api/v1/courses/{course.id}/enroll")
    lesson_quiz = Lesson.objects.get(section__course=course, kind="quiz")
    lc.post(
        f"/api/v1/courses/{course.id}/lessons/quiz-attempt",
        {"lesson_id": lesson_quiz.id, "score": 3, "total": 5},
        format="json",
    )

    second = User.objects.create_user(
        username="lb_learner2", mobile="9000000062", role="learner", is_mobile_verified=True
    )
    c2 = APIClient()
    c2.force_authenticate(second)
    c2.post(f"/api/v1/courses/{course.id}/enroll")
    c2.post(
        f"/api/v1/courses/{course.id}/lessons/quiz-attempt",
        {"lesson_id": lesson_quiz.id, "score": 5, "total": 5},
        format="json",
    )

    r = lb(lc, "?season=alltime&ordering=-quiz_accuracy")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data[0]["learner"]["id"] == second.id
    assert data[0]["stats"]["quiz_accuracy"] == 1.0
    assert data[1]["learner"]["id"] == learner.id
