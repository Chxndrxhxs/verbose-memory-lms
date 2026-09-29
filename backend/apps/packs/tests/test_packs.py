import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.assignments.models import Assignment, AssignmentQuestion
from apps.packs.models import PackPurchase, QuestionPack
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="pack_learner",
        mobile="9611111111",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="pack_instructor",
        mobile="9622222222",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def learner_client(learner):
    client = APIClient()
    client.force_authenticate(user=learner)
    return client


@pytest.fixture
def instructor_client(instructor):
    client = APIClient()
    client.force_authenticate(user=instructor)
    return client


def make_questions(n=4):
    return [
        {
            "question": f"Q{i}",
            "options": ["A", "B", "C", "D"],
            "correct_answer": i % 4,
            "explanation": f"Because {i}",
            "marks": 1,
            "difficulty": "easy" if i % 2 == 0 else "medium",
            "topic": "Aptitude",
        }
        for i in range(n)
    ]


@pytest.fixture
def published_pack(instructor_client):
    r = instructor_client.post(
        "/api/v1/admin/packs/",
        {
            "title": "100 Aptitude Questions",
            "description": "Practice aptitude",
            "price": "99.00",
            "allowed_modules": ["mock", "practice"],
            "max_attempts": 2,
            "test_size": 2,
            "test_duration_seconds": 600,
        },
        format="json",
    )
    assert r.status_code == 200, r.content
    pack_id = r.json()["data"]["id"]
    r = instructor_client.put(
        f"/api/v1/admin/packs/{pack_id}/questions",
        {"questions": make_questions()},
        format="json",
    )
    assert r.status_code == 200, r.content
    r = instructor_client.post(f"/api/v1/admin/packs/{pack_id}/publish")
    assert r.status_code == 200, r.content
    return QuestionPack.objects.get(id=pack_id)


@pytest.mark.django_db
def test_publish_builds_one_instance_per_module(published_pack):
    instances = published_pack.exam_instances.order_by("id")
    assert {m.code for a in instances for m in a.models.all()} == {"mock", "practice"}
    mock = published_pack.exam_instances.filter(models__code="mock").distinct().get()
    assert mock.questions.count() == 4
    assert mock.status == Assignment.Status.PUBLISHED


@pytest.mark.django_db
def test_instances_hidden_from_catalog(published_pack, learner_client):
    r = learner_client.get("/api/v1/assignments/")
    assert r.status_code == 200
    assert r.json()["data"] == []
    instance = published_pack.exam_instances.first()
    r = learner_client.get(f"/api/v1/assignments/{instance.id}/")
    assert r.status_code == 404
    r = learner_client.get(f"/api/v1/assignments/models/{instance.id}/")
    assert r.status_code == 404


@pytest.mark.django_db
def test_owner_can_read_instance_detail_for_take_screen(published_pack, learner_client, learner):
    PackPurchase.objects.create(learner=learner, pack=published_pack)
    instance = published_pack.exam_instances.filter(models__code="mock").distinct().get()
    r = learner_client.get(f"/api/v1/assignments/{instance.id}/")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["security"]["block_tab_switch"] is True
    assert "models" not in data


@pytest.mark.django_db
def test_paid_pack_start_requires_purchase(published_pack, learner_client):
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "purchase_required"
    assert r.json()["error"]["pack_id"] == published_pack.id


@pytest.mark.django_db
def test_free_pack_claim_and_start(instructor_client, learner_client):
    r = instructor_client.post(
        "/api/v1/admin/packs/",
        {"title": "Free Pack", "allowed_modules": ["mock", "practice"]},
        format="json",
    )
    pack_id = r.json()["data"]["id"]
    instructor_client.put(
        f"/api/v1/admin/packs/{pack_id}/questions", {"questions": make_questions(2)}, format="json"
    )
    instructor_client.post(f"/api/v1/admin/packs/{pack_id}/publish")

    r = learner_client.post(f"/api/v1/packs/{pack_id}/claim")
    assert r.status_code == 200
    assert r.json()["data"]["owned"] is True

    r = learner_client.post(f"/api/v1/packs/{pack_id}/start", {"module": "practice"})
    assert r.status_code == 200, r.content
    data = r.json()["data"]
    # practice: week-long server expiry, explanations served inline
    assert data["attempt"]["seconds_remaining"] > 6 * 24 * 3600
    assert all("explanation" in q for step in data["structure"] for q in step["questions"])


@pytest.mark.django_db
def test_mock_start_has_real_duration_and_hides_explanations(
    published_pack, learner_client, learner
):
    PackPurchase.objects.create(learner=learner, pack=published_pack)
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.status_code == 200, r.content
    data = r.json()["data"]
    assert data["attempt"]["seconds_remaining"] <= 2 * 600 + 5
    assert all("explanation" not in q for step in data["structure"] for q in step["questions"])


@pytest.mark.django_db
def test_shared_pool_exhausts_across_modules(published_pack, learner_client, learner):
    PackPurchase.objects.create(learner=learner, pack=published_pack)
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.status_code == 200
    attempt_id = r.json()["data"]["attempt"]["id"]
    instance = published_pack.exam_instances.filter(models__code="mock").distinct().get()
    learner_client.post(
        f"/api/v1/assignments/{instance.id}/submit",
        {"attempt_id": attempt_id, "answers": {}},
        format="json",
    )
    # second attempt in the other module consumes the last pool slot
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "practice"})
    assert r.status_code == 200
    # pool (max_attempts=2) now exhausted
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "attempts_exhausted"


@pytest.mark.django_db
def test_resume_does_not_consume_pool(published_pack, learner_client, learner):
    PackPurchase.objects.create(learner=learner, pack=published_pack)
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    first_id = r.json()["data"]["attempt"]["id"]
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.json()["data"]["attempt"]["id"] == first_id
    assert PackPurchase.objects.get(learner=learner, pack=published_pack).attempts_used == 1


@pytest.mark.django_db
def test_paid_pack_order_and_verify_grants_ownership(published_pack, learner_client, learner):
    from unittest.mock import patch

    with (
        override_settings(DEBUG=True, ALLOW_MOCK_PAYMENTS=True),
        patch("apps.payments.views.get_razorpay_client", return_value=None),
    ):
        r = learner_client.post("/api/v1/payments/create-order", {"pack_id": published_pack.id})
        assert r.status_code == 200, r.content
        assert r.json()["data"]["mock"] is True
        order_id = r.json()["data"]["order_id"]
        r = learner_client.post(
            "/api/v1/payments/verify",
            {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_mock_1",
                "razorpay_signature": "mock_signature",
                "pack_id": published_pack.id,
            },
        )
        assert r.status_code == 200, r.content
        assert "purchase_id" in r.json()["data"]
    assert PackPurchase.objects.filter(learner=learner, pack=published_pack).exists()
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_pack_questions_are_snapshots(instructor_client, instructor, learner):
    assignment = Assignment.objects.create(
        title="Source", created_by=instructor, status="published"
    )
    step = assignment.models.create(code="mock", name="Mock Test")
    from apps.assignments.models import AssignmentModelStep

    leaf = AssignmentModelStep.objects.create(model=step, kind="test", name="T1")
    AssignmentQuestion.objects.create(
        assignment=assignment,
        step=leaf,
        question="Original?",
        options=["A", "B"],
        correct_answer=0,
    )
    r = instructor_client.post("/api/v1/admin/packs/", {"title": "Snap"}, format="json")
    pack_id = r.json()["data"]["id"]
    r = instructor_client.get("/api/v1/admin/packs/question-bank/?q=Original")
    assert r.status_code == 200
    bank_item = r.json()["data"][0]
    instructor_client.put(
        f"/api/v1/admin/packs/{pack_id}/questions", {"questions": [bank_item]}, format="json"
    )
    instructor_client.post(f"/api/v1/admin/packs/{pack_id}/publish")
    # editing the source later must not mutate the sold pack
    AssignmentQuestion.objects.filter(assignment=assignment).update(question="Edited?")
    pack = QuestionPack.objects.get(id=pack_id)
    assert pack.questions.get().question == "Original?"
    instance = pack.exam_instances.filter(models__code="mock").distinct().get()
    assert instance.questions.get().question == "Original?"


@pytest.mark.django_db
def test_question_bank_topics_lists_categories(instructor_client, instructor):
    assignment = Assignment.objects.create(
        title="Source", created_by=instructor, status="published"
    )
    step = assignment.models.create(code="mock", name="Mock Test")
    from apps.assignments.models import AssignmentModelStep

    leaf = AssignmentModelStep.objects.create(model=step, kind="test", name="T1")
    for topic in ("Percentage", "General Knowledge", "Percentage"):
        AssignmentQuestion.objects.create(
            assignment=assignment,
            step=leaf,
            question=f"{topic} Q?",
            options=["A", "B"],
            correct_answer=0,
            topic=topic,
        )
    r = instructor_client.get("/api/v1/admin/packs/question-bank-topics/")
    assert r.status_code == 200
    assert r.json()["data"] == ["General Knowledge", "Percentage"]
    r = instructor_client.get("/api/v1/admin/packs/question-bank/?topic=percent")
    assert r.status_code == 200
    assert {item["topic"] for item in r.json()["data"]} == {"Percentage"}


@pytest.mark.django_db
def test_unpublish_takes_instances_offline(published_pack, instructor_client, learner_client):
    instructor_client.post(f"/api/v1/admin/packs/{published_pack.id}/unpublish")
    r = learner_client.post(f"/api/v1/packs/{published_pack.id}/start", {"module": "mock"})
    assert r.status_code == 404
