import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.packs.models import QuestionPack
from apps.payments.models import Payment
from apps.users.models import User


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="pay_learner",
        mobile="9333333333",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
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


def _paid_course(instructor, price=100):
    return Course.objects.create(
        instructor=instructor,
        title="Paid",
        category="x",
        price=price,
        status="published",
    )


@pytest.mark.django_db
def test_verify_is_idempotent_and_checks_amount(learner, instructor, settings):
    settings.ALLOW_MOCK_PAYMENTS = True
    course = _paid_course(instructor)
    client = APIClient()
    client.force_authenticate(user=learner)
    order = client.post("/api/v1/payments/create-order", {"course_id": course.id})
    assert order.status_code == 200
    order_id = order.json()["data"]["order_id"]
    payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": "pay_1",
        "razorpay_signature": "sig",
        "course_id": course.id,
    }
    first = client.post("/api/v1/payments/verify", payload, format="json")
    assert first.status_code == 200
    assert first.json()["data"]["verified"] is True
    assert first.json()["data"]["mock"] is True
    second = client.post("/api/v1/payments/verify", payload, format="json")
    assert second.status_code == 200
    assert Enrollment.objects.filter(learner=learner, course=course).count() == 1

    tampered = _paid_course(instructor, price=999)
    bad = Payment.objects.create(
        user=learner,
        course=tampered,
        razorpay_order_id="order_mock_tampered",
        amount=1,
        currency="INR",
        status=Payment.Status.CREATED,
    )
    r = client.post(
        "/api/v1/payments/verify",
        {
            "razorpay_order_id": bad.razorpay_order_id,
            "razorpay_payment_id": "pay_2",
            "razorpay_signature": "sig",
            "course_id": tampered.id,
        },
        format="json",
    )
    assert r.status_code == 400
    assert r.json()["error"] == "Amount mismatch"
    bad.refresh_from_db()
    assert bad.status == Payment.Status.FAILED


@pytest.mark.django_db
def test_verify_rejects_item_mismatch_before_paid(learner, instructor, settings):
    settings.ALLOW_MOCK_PAYMENTS = True
    course = _paid_course(instructor)
    other = _paid_course(instructor)
    client = APIClient()
    client.force_authenticate(user=learner)
    order = client.post("/api/v1/payments/create-order", {"course_id": course.id})
    order_id = order.json()["data"]["order_id"]
    r = client.post(
        "/api/v1/payments/verify",
        {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_3",
            "razorpay_signature": "sig",
            "course_id": other.id,
        },
        format="json",
    )
    assert r.status_code == 400
    assert r.json()["error"] == "Course mismatch"
    assert Payment.objects.get(razorpay_order_id=order_id).status == Payment.Status.CREATED


@pytest.mark.django_db
def test_verify_rejects_mock_when_flag_off(learner, instructor, settings):
    settings.ALLOW_MOCK_PAYMENTS = False
    course = _paid_course(instructor)
    payment = Payment.objects.create(
        user=learner,
        course=course,
        razorpay_order_id="order_mock_disabled",
        amount=int(course.price * 100),
        currency="INR",
        status=Payment.Status.CREATED,
    )
    client = APIClient()
    client.force_authenticate(user=learner)
    r = client.post(
        "/api/v1/payments/verify",
        {
            "razorpay_order_id": payment.razorpay_order_id,
            "razorpay_payment_id": "pay_4",
            "razorpay_signature": "sig",
            "course_id": course.id,
        },
        format="json",
    )
    assert r.status_code == 400
    assert r.json()["error"] == "Mock payments are disabled"


@pytest.mark.django_db
def test_verify_pack_purchase_idempotent(learner, instructor, settings):
    settings.ALLOW_MOCK_PAYMENTS = True
    pack = QuestionPack.objects.create(
        title="Pack", price="50.00", status="published", owner=instructor
    )
    client = APIClient()
    client.force_authenticate(user=learner)
    order = client.post("/api/v1/payments/create-order", {"pack_id": pack.id})
    assert order.status_code == 200
    payload = {
        "razorpay_order_id": order.json()["data"]["order_id"],
        "razorpay_payment_id": "pay_pack",
        "razorpay_signature": "sig",
        "pack_id": pack.id,
    }
    assert client.post("/api/v1/payments/verify", payload, format="json").status_code == 200
    assert client.post("/api/v1/payments/verify", payload, format="json").status_code == 200
