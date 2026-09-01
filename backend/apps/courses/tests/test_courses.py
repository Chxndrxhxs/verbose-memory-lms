import pytest
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="i1",
        mobile="9000000001",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.mark.django_db
def test_list_courses_only_published_for_anonymous():
    instr = User.objects.create_user(
        username="i0",
        mobile="9000000000",
        role="instructor",
        is_mobile_verified=True,
    )
    Course.objects.create(
        instructor=instr,
        title="Public",
        category="x",
        price=0,
        status="published",
    )
    Course.objects.create(
        instructor=instr,
        title="Hidden",
        category="x",
        price=0,
        status="draft",
    )
    c = APIClient()
    r = c.get("/api/v1/courses/")
    assert r.status_code == 200
    payload = r.json()["data"]
    titles = [
        x["title"] for x in (payload.get("results") if isinstance(payload, dict) else payload)
    ]
    assert "Public" in titles
    assert "Hidden" not in titles


@pytest.mark.django_db
def test_only_instructor_can_create_course():
    c = APIClient()
    r = c.post("/api/v1/courses/", {"title": "X", "category": "y", "price": 0}, format="json")
    assert r.status_code == 401


@pytest.mark.django_db
def test_instructor_creates_and_publishes(instructor):
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/courses/",
        {"title": "New", "category": "Design", "price": 0},
        format="json",
    )
    assert r.status_code == 201
    payload = r.json()["data"]
    if isinstance(payload, dict) and "results" in payload:
        payload = payload["results"]
    if isinstance(payload, list):
        assert len(payload) >= 1
        return
    cid = payload["id"]
    r = c.post(f"/api/v1/courses/{cid}/publish/")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "published"
