from datetime import timedelta

import pytest
from django.utils import timezone

from apps.assignments.models import Assignment, AssignmentAttempt, AssignmentResult
from apps.assignments.services import grade_expired_attempts, start_attempt, submit_attempt
from apps.enrollments.models import ActivityEvent


def publish(assignment):
    assignment.status = Assignment.Status.PUBLISHED
    assignment.save(update_fields=["status"])


def first_step_id(assignment, model_code):
    model = assignment.models.get(code=model_code)
    return model.steps.get().id


def step_questions(assignment, model_code):
    model = assignment.models.get(code=model_code)
    return list(model.steps.get().questions.order_by("id"))


@pytest.mark.django_db
def test_start_returns_structure_without_correct_answers(learner_client, assignment_factory):
    assignment = assignment_factory(title="Exam")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    r = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id}, format="json"
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["attempt"]["status"] == "in_progress"
    assert data["attempt"]["seconds_remaining"] > 0
    assert data["attempt"]["total_questions"] == 3
    step = data["structure"][0]
    assert step["kind"] == "test"
    assert "correct_answer" not in step["questions"][0]
    assert "explanation" not in step["questions"][0]


@pytest.mark.django_db
def test_start_rejects_draft(learner_client, assignment_factory):
    assignment = assignment_factory(title="Hidden")
    model = assignment.models.get(code="Model 1")
    r = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id}, format="json"
    )
    assert r.status_code == 404


@pytest.mark.django_db
def test_save_answers_then_restore_on_refresh(learner_client, assignment_factory):
    assignment = assignment_factory(title="Savable")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    start = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id}, format="json"
    )
    attempt_id = start.json()["data"]["attempt"]["id"]
    qs = step_questions(assignment, "Model 1")
    step_id = first_step_id(assignment, "Model 1")
    answers = {str(step_id): {str(qs[0].id): 1, str(qs[1].id): 0}}

    save = learner_client.post(
        f"/api/v1/assignments/attempts/{attempt_id}/save", {"answers": answers}, format="json"
    )
    assert save.status_code == 200
    assert save.json()["data"]["saved"] is True

    detail = learner_client.get(f"/api/v1/assignments/attempts/{attempt_id}/")
    assert detail.status_code == 200
    data = detail.json()["data"]
    assert data["attempt"]["status"] == "in_progress"
    assert data["answers"] == answers

    remainder = {str(step_id): {str(qs[2].id): 2}}
    save2 = learner_client.post(
        f"/api/v1/assignments/attempts/{attempt_id}/save",
        {"answers": remainder},
        format="json",
    )
    assert save2.status_code == 200
    detail2 = learner_client.get(f"/api/v1/assignments/attempts/{attempt_id}/")
    assert detail2.json()["data"]["answers"] == remainder


@pytest.mark.django_db
def test_save_answers_rejected_for_other_learner(learner_client, assignment_factory, db):
    from rest_framework.test import APIClient

    from apps.users.models import User

    assignment = assignment_factory(title="Mine")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    start = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id}, format="json"
    )
    attempt_id = start.json()["data"]["attempt"]["id"]
    intruder = User.objects.create_user(
        username="as_intruder",
        mobile="9600000002",
        role="learner",
        is_mobile_verified=True,
    )
    other_client = APIClient()
    other_client.force_authenticate(user=intruder)
    r = other_client.post(
        f"/api/v1/assignments/attempts/{attempt_id}/save",
        {"answers": {}},
        format="json",
    )
    assert r.status_code == 404


@pytest.mark.django_db
def test_submit_scores_with_negative_marking(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Graded")
    assignment.status = Assignment.Status.PUBLISHED
    assignment.negative_marking = True
    assignment.negative_marks_per_wrong = "0.25"
    assignment.passing_percentage = "90"
    assignment.save(
        update_fields=[
            "status",
            "negative_marking",
            "negative_marks_per_wrong",
            "passing_percentage",
        ]
    )

    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    step_id = first_step_id(assignment, "Model 1")
    qs = step_questions(assignment, "Model 1")

    answers = {
        str(step_id): {
            str(qs[0].id): 0,  # correct (correct_answer = 0 % 4)
            str(qs[1].id): 9,  # wrong
        }
    }
    finished = submit_attempt(attempt, answers)

    assert finished.status == AssignmentAttempt.Status.COMPLETED
    assert finished.total_questions == 3
    assert finished.answered == 2
    assert finished.correct == 1
    assert finished.wrong == 1
    assert finished.unanswered == 1
    assert float(finished.positive_marks) == 1.0
    assert float(finished.negative_marks) == 0.25
    assert float(finished.final_score) == 0.75
    assert finished.passed is False
    assert finished.transcript["steps"][0]["correct"] == 1
    assert AssignmentResult.objects.count() == 1


@pytest.mark.django_db
def test_submit_uses_current_answers(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Graded2")
    assignment.status = Assignment.Status.PUBLISHED
    assignment.negative_marking = True
    assignment.save(update_fields=["status", "negative_marking"])

    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    step_id = first_step_id(assignment, "Model 1")
    qs = step_questions(assignment, "Model 1")
    answers = {str(step_id): {str(qs[0].id): 0, str(qs[1].id): 99, str(qs[2].id): 2}}
    finished = submit_attempt(attempt, answers)
    assert finished.correct == 2
    assert finished.transcript["steps"][0]["attempted"] == 3


@pytest.mark.django_db
def test_randomized_options_graded_against_snapshot(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Rand")
    assignment.status = Assignment.Status.PUBLISHED
    assignment.randomize_options = True
    assignment.save(update_fields=["status", "randomize_options"])

    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    snapshot = attempt.questions_snapshot

    step_id = first_step_id(assignment, "Model 1")
    qs = step_questions(assignment, "Model 1")
    answers = {
        str(step_id): {str(q.id): snapshot[str(step_id)][str(q.id)]["correct_answer"] for q in qs}
    }
    finished = submit_attempt(attempt, answers)
    assert finished.correct == 3
    assert finished.answered == 3
    assert float(finished.final_score) == 3.0


@pytest.mark.django_db
def test_expired_attempt_auto_submitted(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Expirable")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    attempt.expires_at = timezone.now() - timedelta(seconds=60)
    attempt.save(update_fields=["expires_at"])

    assert grade_expired_attempts() == 1
    attempt.refresh_from_db()
    assert attempt.status == AssignmentAttempt.Status.EXPIRED
    assert attempt.is_auto_submitted is True
    assert attempt.ended_at == attempt.expires_at
    assert AssignmentResult.objects.count() == 1

    r = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/submit",
        {"attempt_id": attempt.id, "answers": {}},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["data"]["attempt"]["status"] == "expired"


@pytest.mark.django_db
def test_max_attempts_enforced(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Limited")
    assignment.status = Assignment.Status.PUBLISHED
    assignment.max_attempts = 1
    assignment.save(update_fields=["status", "max_attempts"])
    model = assignment.models.get(code="Model 1")

    attempt = start_attempt(learner, assignment, model)
    submit_attempt(attempt, {})
    assert attempt.status == AssignmentAttempt.Status.COMPLETED

    r = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id}, format="json"
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_resume_returns_structure(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Resumable")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    r = learner_client.get(f"/api/v1/assignments/attempts/{attempt.id}/")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["attempt"]["id"] == attempt.id
    assert len(data["structure"]) == 1


@pytest.mark.django_db
def test_transcript_after_submission(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Transcripts")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    step_id = first_step_id(assignment, "Model 1")
    qs = step_questions(assignment, "Model 1")
    answers = {str(step_id): {str(q.id): q.correct_answer for q in qs}}
    submit_attempt(attempt, answers)

    r = learner_client.get(f"/api/v1/assignments/transcripts/{assignment.id}/")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["transcript"]["model"] == "Model 1"
    assert data["attempt"]["status"] == "completed"
    assert "review" not in data  # results.show_correct_answers defaults False


@pytest.mark.django_db
def test_activity_event_logged_on_submit(learner, learner_client, assignment_factory):
    assignment = assignment_factory(title="Logged")
    publish(assignment)
    model = assignment.models.get(code="Model 1")
    attempt = start_attempt(learner, assignment, model)
    r = learner_client.post(
        f"/api/v1/assignments/{assignment.id}/submit",
        {"attempt_id": attempt.id, "answers": {}},
        format="json",
    )
    assert r.status_code == 200
    assert (
        ActivityEvent.objects.filter(
            learner=learner, verb=ActivityEvent.Verb.ASSIGNMENT_SUBMITTED
        ).count()
        == 1
    )
