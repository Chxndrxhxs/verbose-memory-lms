import pytest

from apps.assignments import llm
from apps.assignments.extraction import split_answer_key, split_markdown_pages


def test_gemini_model_url_strips_openai_suffix(settings):
    settings.LLM_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
    settings.LLM_MODEL = "gemini-2.0-flash"
    assert (
        llm._gemini_model_url() == "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash:generateContent"
    )


def test_gemini_text_joins_parts():
    content = {
        "candidates": [{"content": {"parts": [{"text": '{"questions": ['}, {"text": "]}"}]}}]
    }
    assert llm._gemini_text(content) == '{"questions": []}'


def test_normalise_question_keeps_image_ref_options():
    raw = {
        "question": "Which figure shows X?",
        "question_image_ref": 1,
        "options": [{"text": "Figure 1", "image_ref": 1}, "Figure 2"],
        "correct_answer": 0,
        "has_answer": False,
    }
    question = llm._normalise_question(raw, {})
    assert question["options"][0] == {"text": "Figure 1", "image_ref": 1}
    assert question["has_answer"] is False
    assert question["needs_review"] is False


def test_extract_page_questions_resolves_image_refs(monkeypatch, tmp_path):
    raw = {
        "question": "Which figure shows X?",
        "question_image_ref": 2,
        "options": [{"text": "Figure 1", "image_ref": 1}, "Figure 2"],
        "correct_answer": 1,
        "has_answer": True,
    }
    monkeypatch.setattr(llm, "_gemini_request", lambda payload: {})
    monkeypatch.setattr(llm, "_gemini_text", lambda content: "unused")
    monkeypatch.setattr(llm, "_parse_questions", lambda content: [raw])
    first = tmp_path / "p01_img00.png"
    second = tmp_path / "p01_img01.png"
    first.write_bytes(b"fake-image-1")
    second.write_bytes(b"fake-image-2")
    images = [
        {"url": "media/assignment_images/doc/p01_img00.png", "path": str(first)},
        {"url": "media/assignment_images/doc/p01_img01.png", "path": str(second)},
    ]
    questions = llm.extract_page_questions("1. Which figure shows X?", 1, images, {})
    assert len(questions) == 1
    assert questions[0]["question_image"] == "media/assignment_images/doc/p01_img01.png"
    assert questions[0]["options"][0] == {
        "text": "Figure 1",
        "image": "media/assignment_images/doc/p01_img00.png",
    }
    assert questions[0]["source_page"] == 1


@pytest.mark.django_db
def test_extract_view_needs_gemini_key(instructor_client):
    r = instructor_client.post(
        "/api/v1/admin/assignments/extract-questions",
        {"source_document": "media/paper.pdf"},
        format="json",
    )
    assert r.status_code == 400
    assert r.json()["data"] is None


def test_generate_from_topic_uses_llm_knowledge(monkeypatch, settings):
    from apps.assignments import services

    settings.LLM_API_KEY = "test-key"
    seen: list[str] = []

    def fake_topic(topic, config):
        seen.append(topic)
        count = max(1, int(config.get("numberOfQuestions", 1)))
        return [
            {
                "question": f"What is {topic} ({i + 1})?",
                "question_image": "",
                "options": ["A", "B", "C", "D"],
                "correct_answer": 1,
                "explanation": "Because.",
                "marks": 2,
                "difficulty": "hard",
                "topic": topic,
                "has_answer": True,
                "needs_review": False,
            }
            for i in range(count)
        ]

    monkeypatch.setattr(services, "generate_questions_from_topic", fake_topic)
    questions = services.generate_questions_from_document(
        {
            "numberOfQuestions": 3,
            "difficulty": "hard",
            "marksPerQuestion": 2,
            "numberOfOptions": 4,
            "topicDistribution": {"Percentage": 2, "Profit": 1},
        }
    )
    assert len(questions) == 3
    assert {q["topic"] for q in questions} == {"Percentage", "Profit"}
    assert seen == ["Percentage", "Profit"]


def test_generate_from_topic_needs_key(instructor_client, settings):
    settings.LLM_API_KEY = ""
    r = instructor_client.post(
        "/api/v1/admin/assignments/generate-questions",
        {"numberOfQuestions": 2, "topicDistribution": {"Percentage": 2}},
        format="json",
    )
    assert r.status_code == 400
    assert "Gemini" in r.json()["error"]


def test_generate_without_topics_or_document_stays_offline(instructor_client, settings):
    settings.LLM_API_KEY = ""
    r = instructor_client.post(
        "/api/v1/admin/assignments/generate-questions",
        {"numberOfQuestions": 3},
        format="json",
    )
    assert r.status_code == 200
    assert len(r.json()["data"]) == 3


def test_regenerate_prefers_llm_for_known_topic(monkeypatch, settings):
    from apps.assignments import services

    settings.LLM_API_KEY = "test-key"
    monkeypatch.setattr(
        services,
        "generate_questions_from_topic",
        lambda topic, config: [
            {
                "question": f"Fresh {topic}?",
                "question_image": "",
                "options": ["A", "B"],
                "correct_answer": 0,
                "explanation": "x",
                "marks": 1,
                "difficulty": "medium",
                "topic": topic,
                "has_answer": True,
                "needs_review": False,
            }
        ],
    )
    question = services.regenerate_question({"topic": "Percentage", "options": ["A", "B"]})
    assert question["question"] == "Fresh Percentage?"


def test_llm_topic_prompt_asks_for_topic_knowledge(monkeypatch, settings):
    import json as json_lib

    import httpx

    settings.LLM_API_KEY = "test-key"
    settings.LLM_BASE_URL = "https://example.test/v1"
    settings.LLM_MODEL = "test-model"
    captured: dict = {}

    def fake_post(url, json, headers, timeout):
        captured["prompt"] = json["messages"][0]["content"]
        request = httpx.Request("POST", url)
        return httpx.Response(
            200,
            request=request,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json_lib.dumps(
                                {
                                    "questions": [
                                        {
                                            "question": "Q?",
                                            "options": ["A", "B", "C"],
                                            "correct_answer": 2,
                                            "explanation": "",
                                            "marks": 1,
                                            "difficulty": "easy",
                                            "topic": "Percentage",
                                        }
                                    ]
                                }
                            )
                        }
                    }
                ]
            },
        )

    monkeypatch.setattr(llm.httpx, "post", fake_post)
    questions = llm.generate_questions_from_topic("Percentage", {"numberOfQuestions": 1})
    assert questions[0]["correct_answer"] == 2
    assert questions[0]["topic"] == "Percentage"
    assert "Percentage" in captured["prompt"]


@pytest.mark.django_db
def test_extract_view_rejects_missing_document(instructor_client, settings):
    settings.LLM_API_KEY = "test-key"
    r = instructor_client.post(
        "/api/v1/admin/assignments/extract-questions",
        {"source_document": "media/missing.pdf"},
        format="json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_extract_async_mode_returns_job(instructor_client, settings):
    settings.LLM_API_KEY = "test-key"
    r = instructor_client.post(
        "/api/v1/admin/assignments/extract-questions",
        {"source_document": "media/paper.pdf", "async_mode": True},
        format="json",
    )
    assert r.status_code == 202
    job_id = r.json()["data"]["job_id"]
    assert job_id
    poll = instructor_client.get(f"/api/v1/admin/assignments/extract-jobs/{job_id}")
    assert poll.status_code == 200
    assert poll.json()["data"]["job_id"] == job_id


def test_split_answer_key_separates_trailing_key():
    body, key = split_answer_key("Q1. What?\na) x\nb) y\n\nAnswer Key\n\n| 1 | b |\n")
    assert "Answer Key" not in body
    assert "1" in key and "b" in key


def test_split_markdown_pages_handles_printed_footers():
    markdown = "Page 1 of 2\nQ1...\nPage 2 of 2\nQ2..."
    chunks = split_markdown_pages(markdown)
    assert len(chunks) == 2
    assert "Q1" in chunks[0]
    assert "Q2" in chunks[1]


def test_document_file_id_keeps_subdirectory():
    from apps.assignments.extraction import document_file_id

    assert document_file_id("media/lessons/paper.pdf") == "lessons/paper.pdf"
    assert document_file_id("http://localhost:8000/media/lessons/paper.pdf") == "lessons/paper.pdf"


def test_save_assignment_fields_derives_file_id(db):
    from apps.assignments.models import Category, InterCategory, SubCategory
    from apps.assignments.services import save_assignment_fields
    from apps.users.models import User

    instructor = User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="file_id_probe", mobile="9811111111", role="instructor"
    )
    cat = Category.objects.create(name="FileIdCat", created_by=instructor)
    sub = SubCategory.objects.create(name="FileIdSub", category=cat, created_by=instructor)
    inter = InterCategory.objects.create(name="FileIdInter", sub_category=sub)
    assignment = save_assignment_fields(
        None,
        {"title": "File id", "inter_category": inter, "source_document": "media/lessons/p.pdf"},
        instructor,
    )
    assert assignment.source_document_file_id == "lessons/p.pdf"


def test_extract_jobs_enqueue_and_status(monkeypatch):
    from apps.assignments import extract_jobs

    monkeypatch.setattr(
        extract_jobs, "_run", lambda job_id, config: extract_jobs._finish(job_id, "done")
    )
    job = extract_jobs.enqueue({"source_document": "media/paper.pdf"})
    assert job["job_id"]
    stored = extract_jobs.get(job["job_id"])
    assert stored is not None
    assert stored["status"] in {"queued", "running", "done"}


def test_gemini_request_retries_then_succeeds(monkeypatch):
    import httpx

    calls = {"count": 0}

    def fake_post(url, json, headers, timeout):
        calls["count"] += 1
        request = httpx.Request("POST", url)
        if calls["count"] == 1:
            response = httpx.Response(429, request=request)
            raise httpx.HTTPStatusError("rate limited", request=request, response=response)
        return httpx.Response(200, request=request, json={"ok": True})

    monkeypatch.setattr(llm.httpx, "post", fake_post)
    monkeypatch.setattr(llm.time, "sleep", lambda seconds: None)
    assert llm._gemini_request({"contents": []}, max_retries=2) == {"ok": True}
    assert calls["count"] == 2


def test_gemini_request_raises_rate_limited_after_retries(monkeypatch):
    import httpx

    def fake_post(url, json, headers, timeout):
        request = httpx.Request("POST", url)
        response = httpx.Response(429, request=request)
        raise httpx.HTTPStatusError("rate limited", request=request, response=response)

    monkeypatch.setattr(llm.httpx, "post", fake_post)
    monkeypatch.setattr(llm.time, "sleep", lambda seconds: None)
    with pytest.raises(llm.GeminiRateLimitedError):
        llm._gemini_request({"contents": []}, max_retries=1)


def test_extract_document_questions_returns_resume_envelope(monkeypatch, settings):
    from apps.assignments import services

    settings.LLM_API_KEY = "test-key"
    monkeypatch.setattr(
        services,
        "extract_document_markdown",
        lambda url: "Q1?\na) x\nb) y\nPage 1 of 2\nQ2?\na) x\nb) y\nPage 2 of 2",
    )
    pages = [
        {"page": 1, "text": "Q1?", "images": []},
        {"page": 2, "text": "Q2?", "images": []},
    ]
    monkeypatch.setattr(services, "extract_document_pages", lambda url: pages)

    def fake_extract(markdown, page_number, images, config):
        if page_number == 2:
            raise llm.GeminiRateLimitedError("still limited")
        return [
            {
                "question": "Q1?",
                "question_image": "",
                "options": ["x", "y"],
                "correct_answer": 0,
                "explanation": "",
                "marks": 1,
                "difficulty": "medium",
                "topic": "",
                "has_answer": False,
                "needs_review": True,
                "source_page": 1,
            }
        ]

    monkeypatch.setattr(services, "extract_page_questions", fake_extract)
    result = services.extract_document_questions({"source_document": "media/paper.pdf"})
    assert result["rate_limited"] is True
    assert result["done_pages"] == [1]
    assert result["pending_pages"] == [2]
    assert len(result["questions"]) == 1

    resumed = services.extract_document_questions(
        {"source_document": "media/paper.pdf", "pending_pages": [2]}
    )
    assert resumed["pending_pages"] == [2]
    assert resumed["done_pages"] == []
