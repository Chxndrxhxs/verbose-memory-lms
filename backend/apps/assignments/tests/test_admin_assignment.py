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


# --- exam board is required to publish (RAM-34) -----------------------------


@pytest.mark.django_db
def test_publish_blocked_when_no_board_selected(assignment_factory, instructor_client):
    assignment = assignment_factory(title="No Board", assign_board=False)
    r = instructor_client.post(f"/api/v1/admin/assignments/{assignment.id}/publish")
    assert r.status_code == 400
    assert "exam board" in str(r.json()).lower()
    assignment.refresh_from_db()
    assert assignment.status == "draft"


@pytest.mark.django_db
def test_publish_succeeds_with_board_and_questions(assignment_factory, instructor_client):
    assignment = assignment_factory(title="With Board")
    r = instructor_client.post(f"/api/v1/admin/assignments/{assignment.id}/publish")
    assert r.status_code == 200
    assignment.refresh_from_db()
    assert assignment.status == "published"


@pytest.mark.django_db
def test_serializer_rejects_publishing_without_a_board(instructor_client, board):
    """The write serializer guards direct API calls, not just the publish view."""
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Direct publish",
            "board": None,
            "status": "published",
        },
        format="json",
    )
    assert r.status_code == 400
    assert "board" in str(r.json())


@pytest.mark.django_db
def test_draft_without_a_board_is_still_saved(instructor_client, board):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Work in progress",
            "board": None,
            "status": "draft",
        },
        format="json",
    )
    assert r.status_code == 201


@pytest.mark.django_db
def test_assignment_can_be_saved_with_a_board(instructor_client, board):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "SSC CGL Quant",
            "board": board.id,
            "status": "draft",
        },
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["data"]["board"]["id"] == board.id


@pytest.mark.django_db
def test_boards_endpoint_lists_seeded_boards(instructor_client):
    r = instructor_client.get("/api/v1/assignments/boards/")
    assert r.status_code == 200
    names = {b["name"] for b in r.json()["data"]}
    assert {"SSC", "IBPS", "UPSC", "Railways"} <= names


# --- total marks must be believable (RAM-44) --------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize("total", [999999, 1_000_001, 99999999, -5])
def test_out_of_range_total_marks_is_rejected(total, instructor_client, board):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Marks test",
            "board": board.id,
            "status": "draft",
            "draft_data": {"totalMarks": total},
        },
        format="json",
    )
    assert r.status_code == 400
    assert "between 1 and 1000" in str(r.json())


@pytest.mark.django_db
@pytest.mark.parametrize("total", [0, "not-a-number", True])
def test_non_numeric_total_marks_is_rejected(total, instructor_client, board):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Marks test",
            "board": board.id,
            "status": "draft",
            "draft_data": {"totalMarks": total},
        },
        format="json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize("total", [1, 100, 500, 1000])
def test_realistic_total_marks_is_accepted(total, instructor_client, board):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Marks test",
            "board": board.id,
            "status": "draft",
            "draft_data": {"totalMarks": total},
        },
        format="json",
    )
    assert r.status_code == 201


@pytest.mark.django_db
def test_draft_without_total_marks_is_still_saved(instructor_client, board):
    """totalMarks is optional — the wizard auto-sums it from questions."""
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {
            "title": "Auto sum",
            "board": board.id,
            "status": "draft",
            "draft_data": {"title": "Auto sum"},
        },
        format="json",
    )
    assert r.status_code == 201


# --- title needs a readable character (RAM-35) ------------------------------


@pytest.mark.parametrize("title", ["!@#$%^&*()", "-----", "***"])
def test_assignment_title_without_letter_or_digit_is_rejected(
    title, instructor_client, inter_category
):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {"title": title, "inter_category": inter_category.id, "status": "draft"},
        format="json",
    )
    assert r.status_code == 400
    assert "at least one letter or number" in str(r.json())


@pytest.mark.parametrize(
    "title",
    ["qwertyuiop !@#$%12345", "junk !@#$%12345", "asdf !!! ###", "a b c !@#$%^&*()"],
)
def test_assignment_title_that_is_keyboard_smash_is_rejected(
    title, instructor_client, inter_category
):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {"title": title, "inter_category": inter_category.id, "status": "draft"},
        format="json",
    )
    assert r.status_code == 400


@pytest.mark.parametrize(
    "title", ["C++ Basics", "Physics 2026", "日本語 Test", "Class 10 & 12", "A/B Testing"]
)
def test_assignment_title_with_readable_text_is_accepted(title, instructor_client, inter_category):
    r = instructor_client.post(
        "/api/v1/admin/assignments/",
        {"title": title, "inter_category": inter_category.id, "status": "draft"},
        format="json",
    )
    assert r.status_code == 201
