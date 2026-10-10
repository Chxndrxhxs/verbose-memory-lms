import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course, WishlistItem
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="wi0",
        mobile="9100000000",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.fixture
def learner(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="wi1",
        mobile="9100000001",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def other(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
        username="wi2",
        mobile="9100000002",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def course(instructor):
    return Course.objects.create(
        instructor=instructor,
        title="Wishlisted Course",
        category="Design",
        price=999,
        status="published",
    )


def auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_wishlist_requires_auth(course):
    assert APIClient().get("/api/v1/courses/wishlist/").status_code == 401


@pytest.mark.django_db
def test_add_course_to_wishlist(learner, course):
    c = auth(learner)
    r = c.post(f"/api/v1/courses/{course.id}/wishlist_item/")
    assert r.status_code == 200
    assert r.json()["data"]["wishlisted"] is True
    assert WishlistItem.objects.filter(learner=learner, course=course).count() == 1

    listing = c.get("/api/v1/courses/wishlist/")
    assert listing.status_code == 200
    items = listing.json()["data"]
    assert [i["course"]["id"] for i in items] == [course.id]


@pytest.mark.django_db
def test_adding_twice_is_idempotent(learner, course):
    c = auth(learner)
    c.post(f"/api/v1/courses/{course.id}/wishlist_item/")
    r = c.post(f"/api/v1/courses/{course.id}/wishlist_item/")
    assert r.status_code == 200
    assert r.json()["data"]["wishlisted"] is True
    assert WishlistItem.objects.filter(learner=learner, course=course).count() == 1


@pytest.mark.django_db
def test_remove_from_wishlist(learner, course):
    c = auth(learner)
    c.post(f"/api/v1/courses/{course.id}/wishlist_item/")
    r = c.delete(f"/api/v1/courses/{course.id}/wishlist_item/")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["wishlisted"] is False
    assert data["removed"] is True
    assert not WishlistItem.objects.filter(learner=learner, course=course).exists()
    assert c.get("/api/v1/courses/wishlist/").json()["data"] == []


@pytest.mark.django_db
def test_removing_something_absent_is_a_no_op(learner, course):
    r = auth(learner).delete(f"/api/v1/courses/{course.id}/wishlist_item/")
    assert r.status_code == 200
    assert r.json()["data"]["removed"] is False


@pytest.mark.django_db
def test_draft_courses_cannot_be_wishlisted(learner, instructor):
    draft = Course.objects.create(
        instructor=instructor, title="Hidden", category="Design", price=0, status="draft"
    )
    r = auth(learner).post(f"/api/v1/courses/{draft.id}/wishlist_item/")
    assert r.status_code == 404


@pytest.mark.django_db
def test_wishlist_is_per_learner(learner, other, course):
    auth(learner).post(f"/api/v1/courses/{course.id}/wishlist_item/")
    assert auth(other).get("/api/v1/courses/wishlist/").json()["data"] == []
    ids = [i["course"]["id"] for i in auth(learner).get("/api/v1/courses/wishlist/").json()["data"]]
    assert ids == [course.id]
