from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.packs.models import QuestionPack
from apps.payments.models import Payment
from apps.promotions.models import Coupon, CouponRedemption, Gift
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
def learner(db):
    return make_user("9111111111")


@pytest.fixture
def recipient(db):
    return make_user("9222222222", email="friend@example.com")


@pytest.fixture
def instructor(db):
    return make_user("9333333333", role="instructor")


@pytest.fixture
def admin(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
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
        title="Paid Course",
        category="x",
        price=1000,
        status="published",
    )


@pytest.fixture
def pack(instructor):
    return QuestionPack.objects.create(
        title="Pack", price="500.00", status="published", owner=instructor
    )


@pytest.fixture
def coupon(db):
    return Coupon.objects.create(code="SAVE20", discount_type="percent", discount_value=20)


def auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def mock_settings(settings):
    settings.ALLOW_MOCK_PAYMENTS = True


def verify(client, order_id, **item):
    return client.post(
        "/api/v1/payments/verify",
        {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_x",
            "razorpay_signature": "sig",
            **item,
        },
        format="json",
    )


# --- coupon validation ------------------------------------------------------


@pytest.mark.django_db
def test_validate_coupon_quote(learner, course, coupon):
    res = auth(learner).post(
        "/api/v1/coupons/validate", {"code": " save20 ", "course_id": course.id}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["code"] == "SAVE20"
    assert data["original_amount_paise"] == 100000
    assert data["discount_paise"] == 20000
    assert data["final_amount_paise"] == 80000


@pytest.mark.django_db
def test_validate_coupon_rejects_bad_codes(learner, course, coupon):
    c = auth(learner)
    assert (
        c.post("/api/v1/coupons/validate", {"code": "NOPE", "course_id": course.id}).status_code
        == 400
    )
    coupon.is_active = False
    coupon.save()
    r = c.post("/api/v1/coupons/validate", {"code": "SAVE20", "course_id": course.id})
    assert r.status_code == 400
    assert "Invalid or expired" in r.json()["error"]


@pytest.mark.django_db
def test_validate_coupon_scope_and_limits(learner, course, pack, db):
    scoped = Coupon.objects.create(
        code="COURSE5",
        discount_type="percent",
        discount_value=5,
        applies_to="course",
        course=course,
    )
    c = auth(learner)
    r = c.post("/api/v1/coupons/validate", {"code": "COURSE5", "pack_id": pack.id})
    assert r.status_code == 400
    assert "not valid for this pack" in r.json()["error"]

    Coupon.objects.create(
        code="ONCE",
        discount_type="percent",
        discount_value=5,
        usage_limit=1,
        usage_count=1,
    )
    r = c.post("/api/v1/coupons/validate", {"code": "ONCE", "course_id": course.id})
    assert "usage limit" in r.json()["error"]

    Coupon.objects.create(
        code="BIG",
        discount_type="percent",
        discount_value=5,
        min_order_paise=200000,
    )
    r = c.post("/api/v1/coupons/validate", {"code": "BIG", "course_id": course.id})
    assert "minimum order" in r.json()["error"]

    Coupon.objects.create(
        code="OLD",
        discount_type="percent",
        discount_value=5,
        valid_to=timezone.now() - timedelta(days=1),
    )
    r = c.post("/api/v1/coupons/validate", {"code": "OLD", "course_id": course.id})
    assert r.status_code == 400
    assert scoped.usage_count == 0


@pytest.mark.django_db
def test_flat_coupon_capped_at_price(learner, course, db):
    Coupon.objects.create(code="FLATBIG", discount_type="flat", discount_value=99999900)
    res = auth(learner).post(
        "/api/v1/coupons/validate", {"code": "FLATBIG", "course_id": course.id}
    )
    assert res.json()["data"]["final_amount_paise"] == 0


# --- coupons at checkout ----------------------------------------------------


@pytest.mark.django_db
def test_create_order_applies_coupon(learner, course, coupon, settings):
    mock_settings(settings)
    res = auth(learner).post(
        "/api/v1/payments/create-order",
        {"course_id": course.id, "coupon_code": "SAVE20"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["amount"] == 80000
    assert data["coupon"] == "SAVE20"
    payment = Payment.objects.get(razorpay_order_id=data["order_id"])
    assert payment.discount_paise == 20000
    assert payment.coupon == coupon

    verify_res = verify(auth(learner), data["order_id"], course_id=course.id)
    assert verify_res.status_code == 200
    assert Enrollment.objects.filter(learner=learner, course=course).exists()
    coupon.refresh_from_db()
    assert coupon.usage_count == 1
    assert CouponRedemption.objects.filter(coupon=coupon, user=learner).count() == 1


@pytest.mark.django_db
def test_verify_coupon_is_idempotent(learner, course, coupon, settings):
    mock_settings(settings)
    c = auth(learner)
    order_id = c.post(
        "/api/v1/payments/create-order", {"course_id": course.id, "coupon_code": "SAVE20"}
    ).json()["data"]["order_id"]
    assert verify(c, order_id, course_id=course.id).status_code == 200
    assert verify(c, order_id, course_id=course.id).status_code == 200
    coupon.refresh_from_db()
    assert coupon.usage_count == 1
    assert CouponRedemption.objects.filter(payment__razorpay_order_id=order_id).count() == 1


@pytest.mark.django_db
def test_full_discount_enrolls_free(learner, course, db, settings):
    mock_settings(settings)
    Coupon.objects.create(code="FREE100", discount_type="percent", discount_value=100)
    c = auth(learner)
    res = c.post(
        "/api/v1/payments/create-order", {"course_id": course.id, "coupon_code": "FREE100"}
    )
    assert res.status_code == 200
    assert res.json()["data"]["free"] is True
    assert Enrollment.objects.filter(learner=learner, course=course).exists()
    assert CouponRedemption.objects.filter(user=learner).count() == 1


@pytest.mark.django_db
def test_coupon_per_user_limit_enforced(learner, course, coupon, settings):
    mock_settings(settings)
    Coupon.objects.create(code="FREE100", discount_type="percent", discount_value=100)
    c = auth(learner)
    c.post("/api/v1/payments/create-order", {"course_id": course.id, "coupon_code": "FREE100"})
    other = Course.objects.create(
        instructor=course.instructor,
        title="Other",
        category="x",
        price=1000,
        status="published",
    )
    r = c.post("/api/v1/coupons/validate", {"code": "FREE100", "course_id": other.id})
    assert r.status_code == 400
    assert "already used" in r.json()["error"]


@pytest.mark.django_db
def test_pack_order_with_coupon(learner, pack, coupon, settings):
    mock_settings(settings)
    res = auth(learner).post(
        "/api/v1/payments/create-order", {"pack_id": pack.id, "coupon_code": "SAVE20"}
    )
    assert res.status_code == 200
    assert res.json()["data"]["amount"] == 40000  # 50000 - 20%


# --- gifts ------------------------------------------------------------------


@pytest.mark.django_db
def test_gift_flow_auto_enrols_existing_recipient(learner, recipient, course, settings):
    mock_settings(settings)
    giver = auth(learner)
    res = giver.post(
        "/api/v1/gifts",
        {
            "course_id": course.id,
            "recipient_email": "friend@example.com",
            "recipient_name": "Friend",
        },
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["mock"] is True
    gift = Gift.objects.get(code=data["gift"]["code"])
    assert gift.status == Gift.Status.PENDING

    verify_res = verify(giver, data["order_id"], course_id=course.id)
    assert verify_res.status_code == 200
    assert verify_res.json()["data"]["gift_code"] == gift.code
    gift.refresh_from_db()
    assert gift.status == Gift.Status.CLAIMED
    # recipient enrolled, giver not
    assert Enrollment.objects.filter(learner=recipient, course=course).exists()
    assert not Enrollment.objects.filter(learner=learner, course=course).exists()


@pytest.mark.django_db
def test_gift_pending_until_claim(learner, course, settings):
    mock_settings(settings)
    giver = auth(learner)
    res = giver.post(
        "/api/v1/gifts", {"course_id": course.id, "recipient_email": "newbie@example.com"}
    )
    order_id = res.json()["data"]["order_id"]
    assert verify(giver, order_id, course_id=course.id).status_code == 200
    gift = Gift.objects.get(code=res.json()["data"]["gift"]["code"])
    assert gift.status == Gift.Status.PAID

    newcomer = make_user("9444444444", email="newbie@example.com")
    claim = auth(newcomer).post("/api/v1/gifts/claim", {"code": gift.code})
    assert claim.status_code == 200
    assert Enrollment.objects.filter(learner=newcomer, course=course).exists()
    # double claim fails
    again = auth(newcomer).post("/api/v1/gifts/claim", {"code": gift.code})
    assert again.status_code == 400
    assert "already been claimed" in again.json()["error"]


@pytest.mark.django_db
def test_gift_rejects_self_and_owned(learner, course, settings):
    mock_settings(settings)
    learner.email = "me@example.com"
    learner.save()
    c = auth(learner)
    r = c.post("/api/v1/gifts", {"course_id": course.id, "recipient_email": "me@example.com"})
    assert r.status_code == 400
    assert "yourself" in r.json()["error"]

    Enrollment.objects.create(learner=learner, course=course)
    other = make_user("9555555555", email="owned@example.com")
    Enrollment.objects.create(learner=other, course=course)
    r = c.post("/api/v1/gifts", {"course_id": course.id, "recipient_email": "owned@example.com"})
    assert r.status_code == 400
    assert "already owns" in r.json()["error"]


@pytest.mark.django_db
def test_gift_with_coupon_discount(learner, course, coupon, settings):
    mock_settings(settings)
    res = auth(learner).post(
        "/api/v1/gifts",
        {"course_id": course.id, "recipient_email": "x@example.com", "coupon_code": "SAVE20"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["amount"] == 80000


@pytest.mark.django_db
def test_my_gifts(learner, recipient, course, settings):
    mock_settings(settings)
    auth(learner).post(
        "/api/v1/gifts", {"course_id": course.id, "recipient_email": "friend@example.com"}
    )
    mine = auth(learner).get("/api/v1/gifts/mine").json()["data"]
    assert len(mine["given"]) == 1
    assert mine["claimable"] == []


# --- admin ------------------------------------------------------------------


@pytest.mark.django_db
def test_admin_coupon_crud(admin, learner):
    c = auth(admin)
    created = c.post(
        "/api/v1/admin/coupons",
        {"code": " admin10 ", "discount_type": "percent", "discount_value": 10},
    )
    assert created.status_code == 201
    assert created.json()["data"]["code"] == "ADMIN10"
    coupon_id = created.json()["data"]["id"]

    listed = c.get("/api/v1/admin/coupons")
    assert any(x["code"] == "ADMIN10" for x in listed.json()["data"])

    patched = c.patch(f"/api/v1/admin/coupons/{coupon_id}", {"is_active": False})
    assert patched.json()["data"]["is_active"] is False

    bad = c.post(
        "/api/v1/admin/coupons",
        {"code": "BAD", "discount_type": "percent", "discount_value": 150},
    )
    assert bad.status_code == 400

    assert c.delete(f"/api/v1/admin/coupons/{coupon_id}").status_code == 200
    assert not Coupon.objects.filter(id=coupon_id).exists()

    denied = auth(learner).get("/api/v1/admin/coupons")
    assert denied.status_code == 403
