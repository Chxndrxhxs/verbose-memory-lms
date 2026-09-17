import pytest


@pytest.mark.django_db
def test_create_update_assignment(instructor_client, inter_category):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Mechanics Test",
            "description": "For JEE prep",
            "inter_category": inter_category.id,
            "status": "draft",
        },
        format="json",
    )
    assert r.status_code == 201
    assignment = r.json()["data"]
    assert assignment["title"] == "Mechanics Test"
    assert assignment["status"] == "draft"
    assert assignment["security"]["block_tab_switch"] is True
    assert assignment["models_preview"] == []

    r = instructor_client.patch(
        f"/api/v1/admin/assignments/{assignment['id']}/",
        {"passing_percentage": "60", "negative_marking": False},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["data"]["passing_percentage"] == "60.00"


@pytest.mark.django_db
def test_structure_replace_and_payload(assignment_factory, instructor_client):
    assignment = assignment_factory(title="With Models")
    r = instructor_client.get(f"/api/v1/admin/assignments/{assignment.id}/")
    payload = r.json()["data"]
    assert len(payload["models"]) == 2
    model1 = payload["models"][0]
    assert model1["total_questions"] == 3
    assert model1["duration_seconds"] == 600
    sets = [s for s in model1["steps"]]
    assert len(sets[0]["questions"]) == 3
    # computed (not raw) durations appear on steps
    assert sets[0]["duration_seconds"] == 600


@pytest.mark.django_db
def test_structure_requires_valid_payload(instructor_client, inter_category):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {"title": "X", "inter_category": inter_category.id},
        format="json",
    )
    assignment_id = r.json()["data"]["id"]
    r = instructor_client.put(
        f"/api/v1/admin/assignments/{assignment_id}/structure",
        {"models": [{"name": "M", "code": "M", "steps": [{"kind": "bad"}]}]},
        format="json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_publish_requires_questions(assignment_factory, instructor_client):
    assignment = assignment_factory(title="Ready")
    r = instructor_client.post(f"/api/v1/admin/assignments/{assignment.id}/publish")
    assert r.status_code == 200
    assignment.refresh_from_db()
    assert assignment.status == "published"
    assert assignment.published_at is not None


@pytest.mark.django_db
def test_publish_blocked_when_no_published_models(instructor_client, inter_category):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {"title": "No Models", "inter_category": inter_category.id},
        format="json",
    )
    assignment_id = r.json()["data"]["id"]
    r = instructor_client.post(f"/api/v1/admin/assignments/{assignment_id}/publish")
    assert r.status_code == 400


@pytest.mark.django_db
def test_duplicate_copies_structure(assignment_factory, instructor_client):
    assignment = assignment_factory(title="Original")
    r = instructor_client.post(f"/api/v1/admin/assignments/{assignment.id}/duplicate")
    assert r.status_code == 200
    clone_id = r.json()["data"]["id"]
    assert clone_id != assignment.id
    r = instructor_client.get(f"/api/v1/admin/assignments/{clone_id}/")
    payload = r.json()["data"]
    assert payload["title"] == "Original (copy)"
    assert len(payload["models"]) == 2
    assert payload["models"][0]["total_questions"] == 3


@pytest.mark.django_db
def test_generate_questions_endpoint(instructor_client):
    r = instructor_client.post(
        "/api/v1/admin/assignments/generate-questions",
        {"numberOfQuestions": 5, "difficulty": "hard", "marksPerQuestion": 2},
        format="json",
    )
    assert r.status_code == 200
    items = r.json()["data"]
    assert len(items) == 5
    assert len(items[0]["options"]) == 4
    assert items[0]["marks"] == 2


@pytest.mark.django_db
def test_learner_forbidden_on_admin(learner_client):
    assert learner_client.get("/api/v1/admin/assignments/").status_code == 403
    assert (
        learner_client.post(
            "/api/v1/admin/assignments/generate-questions", {}, format="json"
        ).status_code
        == 403
    )
