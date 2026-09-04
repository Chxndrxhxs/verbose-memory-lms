import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        username="pay_learner",
        mobile="9333333333",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="pay_instructor",
        mobile="9444444444",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def free_course(instructor):
    return Course.objects.create(
        instructor=instructor,
        title="Free",
        category="x",
        price=0,
        status="published",
    )


@pytest.mark.django_db
def test_free_course_enrolls_without_payment(learner, free_course):
    client = APIClient()
    client.force_authenticate(user=learner)
    res = client.post("/api/v1/payments/create-order", {"course_id": free_course.id})
    assert res.status_code == 200
    assert res.data["data"]["free"] is True


@pytest.mark.django_db
def test_create_order_requires_course_id(learner):
    client = APIClient()
    client.force_authenticate(user=learner)
    res = client.post("/api/v1/payments/create-order", {})
    assert res.status_code == 400
