from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.assignments.models import (
    Assignment,
    AssignmentAttempt,
    AssignmentModel,
    AssignmentModelStep,
    AssignmentQuestion,
    Category,
    InterCategory,
    SubCategory,
)
from apps.assignments.services import (
    compute_outcome,
    model_duration_seconds,
    start_attempt,
    submit_attempt,
)
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="assignment_learner",
        mobile="9123456781",
        role=User.Role.LEARNER,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="assignment_instructor",
        mobile="9123456782",
        role=User.Role.INSTRUCTOR,
    )


@pytest.fixture
def assignment(instructor):
    return Assignment.objects.create(
        title="Python foundations",
        status=Assignment.Status.PUBLISHED,
        created_by=instructor,
        negative_marking=True,
        negative_marks_per_wrong="0.25",
    )


def make_model(assignment, duration=60):
    model = AssignmentModel.objects.create(assignment=assignment, code="A", name="Model A")
    step = AssignmentModelStep.objects.create(model=model, name="Test 1", duration_seconds=duration)
    question = AssignmentQuestion.objects.create(
        assignment=assignment,
        step=step,
        question="Which answer is correct?",
        options=["Correct", "Wrong"],
        correct_answer=0,
        marks="2.00",
    )
    return model, step, question


@pytest.mark.django_db
def test_hierarchy_cascades_and_catalog_only_returns_active_nodes(instructor, learner, assignment):
    category = Category.objects.create(name="Technology", created_by=instructor)
    subcategory = SubCategory.objects.create(
        category=category, name="Python", created_by=instructor
    )
    intercategory = InterCategory.objects.create(
        sub_category=subcategory, name="Basics", created_by=instructor
    )
    assignment.inter_category = intercategory
    assignment.save()

    client = APIClient()
    client.force_authenticate(learner)
    response = client.get("/api/v1/assignments/categories/")

    assert response.status_code == 200
    assert response.json()["data"][0]["subcategories"][0]["intercategories"][0]["name"] == "Basics"
    subcategory.is_active = False
    subcategory.save()
    assert client.get("/api/v1/assignments/categories/").json()["data"][0]["subcategories"] == []


@pytest.mark.django_db
def test_nested_model_duration_does_not_double_count_child_steps(assignment):
    model = AssignmentModel.objects.create(assignment=assignment, code="A", name="Sequential")
    parent = AssignmentModelStep.objects.create(model=model, name="Section", duration_seconds=999)
    AssignmentModelStep.objects.create(model=model, parent=parent, name="One", duration_seconds=60)
    AssignmentModelStep.objects.create(model=model, parent=parent, name="Two", duration_seconds=120)

    assert model_duration_seconds(model) == 180
    model.execution_mode = AssignmentModel.ExecutionMode.PARALLEL
    model.save()
    assert model_duration_seconds(model) == 120


@pytest.mark.django_db
def test_scoring_uses_snapshot_and_applies_negative_marking(assignment, learner):
    model, step, question = make_model(assignment)
    attempt = start_attempt(learner, assignment, model)

    compute_outcome(attempt, {str(step.id): {str(question.id): 1}})

    assert attempt.correct == 0
    assert attempt.wrong == 1
    assert str(attempt.final_score) == "-0.25"
    assert str(attempt.max_score) == "2.0"
    assert attempt.percentage == 0


@pytest.mark.django_db
def test_expired_attempt_is_auto_submitted_and_cannot_be_reopened(assignment, learner):
    model, step, question = make_model(assignment)
    attempt = start_attempt(learner, assignment, model)
    attempt.expires_at = timezone.now() - timedelta(seconds=1)
    attempt.save(update_fields=["expires_at"])

    finished = submit_attempt(attempt, {str(step.id): {str(question.id): 0}})

    assert finished.status == AssignmentAttempt.Status.EXPIRED
    assert finished.is_auto_submitted is True
    assert finished.ended_at == finished.expires_at
    assert submit_attempt(finished, {}).id == finished.id
    assert finished.result.transcript["time_taken_seconds"] >= 0


@pytest.mark.django_db
def test_start_validates_window_and_reuses_active_attempt(assignment, learner):
    model, _, _ = make_model(assignment)
    client = APIClient()
    client.force_authenticate(learner)

    assignment.start_date = timezone.now() + timedelta(minutes=10)
    assignment.save(update_fields=["start_date"])
    response = client.post(f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id})
    assert response.status_code == 403

    assignment.start_date = None
    assignment.save(update_fields=["start_date"])
    first = client.post(f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id})
    second = client.post(f"/api/v1/assignments/{assignment.id}/start", {"model_id": model.id})
    assert first.status_code == 200
    assert second.json()["data"]["attempt"]["id"] == first.json()["data"]["attempt"]["id"]


@pytest.mark.django_db
def test_catalog_detail_does_not_expose_answers(assignment, learner):
    model, _, _ = make_model(assignment)
    client = APIClient()
    client.force_authenticate(learner)

    response = client.get(f"/api/v1/assignments/{assignment.id}/")

    assert response.status_code == 200
    assert "models" not in response.json()["data"]
    assert response.json()["data"]["models_preview"][0]["id"] == model.id
