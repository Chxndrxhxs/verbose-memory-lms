import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.payments.models import Payment
from apps.users.models import User

ADMIN = "/api/v1/admin"


def make_admin(mobile="7000000001", **extra) -> User:
    return User.objects.create_user(
        username=mobile,
        mobile=mobile,
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
        **extra,
    )


def auth_client(user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def make_course(instructor: User, title="Django Basics", status=Course.Status.PUBLISHED) -> Course:
    return Course.objects.create(
        instructor=instructor,
        title=title,
        category="Engineering",
        price=0,
        status=status,
    )


@pytest.fixture
def learner() -> User:
    return User.objects.create_user(username="9000000001", mobile="9000000001")


@pytest.fixture
def instructor() -> User:
    return User.objects.create_user(
        username="8000000001", mobile="8000000001", role=User.Role.INSTRUCTOR
    )


@pytest.fixture
def admin() -> User:
    return make_admin()


@pytest.mark.django_db
def test_non_admin_is_rejected(learner):
    c = auth_client(learner)
    r = c.get(f"{ADMIN}/dashboard")
    assert r.status_code == 403
    r = c.get(f"{ADMIN}/users")
    assert r.status_code == 403


def test_anonymous_is_rejected():
    r = APIClient().get(f"{ADMIN}/users")
    assert r.status_code in (401, 403)


@pytest.mark.django_db
def test_dashboard_stats(admin, learner, instructor):
    course = make_course(instructor)
    Enrollment.objects.create(learner=learner, course=course)
    c = auth_client(admin)
    r = c.get(f"{ADMIN}/dashboard")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["users"]["total"] == 3
    assert data["users"]["learners"] == 1
    assert data["users"]["instructors"] == 1
    assert data["courses"]["total"] == 1
    assert data["enrollments"]["total"] == 1


@pytest.mark.django_db
def test_admin_lists_and_filters_users(admin, learner):
    c = auth_client(admin)
    r = c.get(f"{ADMIN}/users")
    assert r.status_code == 200
    names = [u["mobile"] for u in r.json()["data"]]
    assert "9000000001" in names
    r = c.get(f"{ADMIN}/users?q=9000")
    assert all("9000" in u["mobile"] for u in r.json()["data"])
    r = c.get(f"{ADMIN}/users?role=learner")
    assert all(u["role"] == "learner" for u in r.json()["data"])


@pytest.mark.django_db
def test_admin_updates_and_deletes_user(admin, learner):
    c = auth_client(admin)
    r = c.patch(
        f"{ADMIN}/users/{learner.id}",
        {"name": "Maya Chen", "role": "instructor", "city": "Chennai"},
        format="json",
    )
    assert r.status_code == 200
    learner.refresh_from_db()
    assert learner.get_full_name() == "Maya Chen"
    assert learner.role == "instructor"
    assert learner.city == "Chennai"

    r = c.delete(f"{ADMIN}/users/{learner.id}")
    assert r.status_code == 200
    assert not User.objects.filter(id=learner.id).exists()


@pytest.mark.django_db
def test_admin_course_crud_and_status(admin, instructor):
    course = make_course(instructor, status=Course.Status.DRAFT)
    c = auth_client(admin)
    course_id = course.id

    r = c.get(f"{ADMIN}/courses")
    assert r.status_code == 200
    assert any(x["id"] == course_id for x in r.json()["data"])

    r = c.get(f"{ADMIN}/courses/{course_id}")
    assert r.status_code == 200
    assert r.json()["data"]["course"]["id"] == course_id

    r = c.patch(
        f"{ADMIN}/courses/{course_id}",
        {"price": "499", "category": "Design", "pricing_type": "one_time"},
        format="json",
    )
    assert r.status_code == 200
    course.refresh_from_db()
    assert str(course.price) == "499.00"
    assert course.category == "Design"

    r = c.post(f"{ADMIN}/courses/{course_id}/status", {"status": "published"}, format="json")
    assert r.status_code == 200
    course.refresh_from_db()
    assert course.status == Course.Status.PUBLISHED

    r = c.delete(f"{ADMIN}/courses/{course_id}")
    assert r.status_code == 200
    assert not Course.objects.filter(id=course_id).exists()


@pytest.mark.django_db
def test_admin_enrollment_and_payment_views(admin, learner, instructor):
    course = make_course(instructor)
    enrollment = Enrollment.objects.create(learner=learner, course=course)
    payment = Payment.objects.create(
        user=learner,
        course=course,
        razorpay_order_id="order_abc",
        amount=49900,
        status=Payment.Status.PAID,
    )
    c = auth_client(admin)

    r = c.get(f"{ADMIN}/enrollments")
    assert r.status_code == 200
    assert any(e["id"] == enrollment.id for e in r.json()["data"])
    entry = next(e for e in r.json()["data"] if e["id"] == enrollment.id)
    assert entry["learner_name"] == learner.username

    r = c.delete(f"{ADMIN}/enrollments/{enrollment.id}")
    assert r.status_code == 200
    assert not Enrollment.objects.filter(id=enrollment.id).exists()

    r = c.get(f"{ADMIN}/payments")
    assert r.status_code == 200
    assert any(p["id"] == payment.id for p in r.json()["data"])


@pytest.mark.django_db
def test_admin_user_detail_includes_relations(admin, learner, instructor):
    course = make_course(instructor)
    Enrollment.objects.create(learner=learner, course=course)
    c = auth_client(admin)
    r = c.get(f"{ADMIN}/users/{learner.id}")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["user"]["mobile"] == learner.mobile
    assert len(data["enrollments"]) == 1
