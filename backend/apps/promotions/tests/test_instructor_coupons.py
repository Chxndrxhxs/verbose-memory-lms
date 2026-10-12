from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.promotions.models import Coupon
from apps.users.models import User


def make_user(mobile, **extra):
    extra.setdefault("role", "learner")
    extra.setdefault("is_mobile_verified", True)
    extra.setdefault("first_name", "Test")
    extra.setdefault("email", "test@example.com")
    extra.setdefault("age", 25)
    extra.setdefault("city", "Test")
    return User.objects.create_user(username=mobile, mobile=mobile, **extra)


@pytest.fixture
def instructor(db):
    return make_user("9333333333", role="instructor")


@pytest.fixture
def other_instructor(db):
    return make_user("9333333334", role="instructor")


@pytest.fixture
def learner(db):
    return make_user("9111111111")


@pytest.fixture
def admin(db):
    return User.objects.create_user(
        first_name="Test",
        email="test@example.com",
        age=25,
        city="Test",
        username="9000000000",
        mobile="9000000000",
        role="admin",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def course(instructor):
    return Course.objects.create(
        instructor=instructor,
        title="Django Basics",
        category="Engineering",
        price=1000,
        status="published",
    )


@pytest.fixture
def other_course(other_instructor):
    return Course.objects.create(
        instructor=other_instructor,
        title="Someone Else's Course",
        category="Engineering",
        price=1000,
        status="published",
    )


def auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def coupon_payload(course, **extra):
    return {
        "code": "teach10",
        "discount_type": "percent",
        "discount_value": 10,
        "applies_to": "course",
        "course": course.id,
        **extra,
    }


@pytest.mark.django_db
def test_instructor_creates_time_bounded_coupon(instructor, course):
    window_end = timezone.now() + timedelta(days=7)
    res = auth(instructor).post(
        "/api/v1/instructor/coupons",
        coupon_payload(course, valid_to=window_end.isoformat()),
        format="json",
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["code"] == "TEACH10"
    assert data["applies_to"] == "course"
    assert data["course"] == course.id
    assert data["valid_to"] is not None
    coupon = Coupon.objects.get(id=data["id"])
    assert coupon.created_by_id == instructor.id


@pytest.mark.django_db
def test_instructor_cannot_create_storewide_coupon(instructor, course):
    res = auth(instructor).post(
        "/api/v1/instructor/coupons",
        {
            "code": "WIDE5",
            "discount_type": "percent",
            "discount_value": 5,
            "applies_to": "all",
        },
        format="json",
    )
    assert res.status_code == 400
    assert "your courses" in res.json()["error"]


@pytest.mark.django_db
def test_instructor_cannot_coupon_foreign_course(instructor, other_course):
    res = auth(instructor).post(
        "/api/v1/instructor/coupons",
        coupon_payload(other_course),
        format="json",
    )
    assert res.status_code == 403
    assert "own courses" in res.json()["error"]


@pytest.mark.django_db
def test_instructor_list_shows_only_own_coupons(instructor, course, admin):
    auth(instructor).post("/api/v1/instructor/coupons", coupon_payload(course), format="json")
    Coupon.objects.create(code="ADMINS20", discount_type="percent", discount_value=20)
    res = auth(instructor).get("/api/v1/instructor/coupons")
    assert res.status_code == 200
    codes = [c["code"] for c in res.json()["data"]]
    assert codes == ["TEACH10"]


@pytest.mark.django_db
def test_learner_denied_instructor_coupons(learner):
    assert auth(learner).get("/api/v1/instructor/coupons").status_code == 403


@pytest.mark.django_db
def test_instructor_updates_own_coupon(instructor, course):
    created = (
        auth(instructor)
        .post("/api/v1/instructor/coupons", coupon_payload(course), format="json")
        .json()["data"]
    )
    new_end = timezone.now() + timedelta(days=30)
    res = auth(instructor).patch(
        f"/api/v1/instructor/coupons/{created['id']}",
        {"valid_to": new_end.isoformat(), "discount_value": 15},
        format="json",
    )
    assert res.status_code == 200
    assert res.json()["data"]["discount_value"] == 15


@pytest.mark.django_db
def test_instructor_cannot_touch_foreign_coupon(instructor, admin):
    foreign = Coupon.objects.create(
        code="ADMINS20", discount_type="percent", discount_value=20, created_by=admin
    )
    client = auth(instructor)
    patch = client.patch(
        f"/api/v1/instructor/coupons/{foreign.id}",
        {"discount_value": 99},
        format="json",
    )
    assert patch.status_code == 403
    assert client.delete(f"/api/v1/instructor/coupons/{foreign.id}").status_code == 403


@pytest.mark.django_db
def test_instructor_deletes_own_coupon(instructor, course):
    created = (
        auth(instructor)
        .post("/api/v1/instructor/coupons", coupon_payload(course), format="json")
        .json()["data"]
    )
    res = auth(instructor).delete(f"/api/v1/instructor/coupons/{created['id']}")
    assert res.status_code == 200
    assert not Coupon.objects.filter(id=created["id"]).exists()
