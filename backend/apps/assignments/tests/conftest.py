import pytest
from rest_framework.test import APIClient

from apps.assignments.models import Assignment, Category, InterCategory, SubCategory
from apps.assignments.services import replace_assignment_structure
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="as_learner",
        mobile="9600000001",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="as_instructor",
        mobile="9700000001",
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


@pytest.fixture
def inter_category(db, instructor):
    cat = Category.objects.create(name="Science", created_by=instructor)
    sub = SubCategory.objects.create(name="Physics", category=cat, created_by=instructor)
    return InterCategory.objects.create(name="JEE", sub_category=sub, created_by=instructor)


def make_question(text, idx, topic="Dynamics"):
    return {
        "question": text,
        "options": ["A", "B", "C", "D"],
        "correct_answer": idx % 4,
        "explanation": "",
        "marks": 1,
        "topic": topic,
    }


@pytest.fixture
def assignment_factory(db, inter_category, instructor):
    def _factory(title="Physics Assignment", count=3):
        assignment = Assignment.objects.create(
            title=title,
            inter_category=inter_category,
            created_by=instructor,
            status="draft",
        )
        models_payload = [
            {
                "code": "Model 1",
                "name": "Model 1",
                "is_published": True,
                "execution_mode": "sequential",
                "steps": [
                    {
                        "kind": "test",
                        "name": "Practice Test",
                        "duration_seconds": 600,
                        "questions": [make_question(f"Q{i}", i) for i in range(count)],
                    }
                ],
            },
            {
                "code": "Model 2",
                "name": "Model 2",
                "is_published": True,
                "execution_mode": "sequential",
                "steps": [
                    {
                        "kind": "test",
                        "name": "Test A",
                        "duration_seconds": 300,
                        "questions": [make_question(f"QA{i}", i) for i in range(count)],
                    },
                    {
                        "kind": "test",
                        "name": "Test B",
                        "duration_seconds": 200,
                        "questions": [make_question(f"QB{i}", i + 1) for i in range(count)],
                    },
                ],
            },
        ]
        replace_assignment_structure(assignment, models_payload)
        return assignment

    return _factory
