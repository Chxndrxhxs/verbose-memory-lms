import pytest
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture
def incomplete_learner(db):
    return User.objects.create_user(
        username="incomplete",
        mobile="9876543001",
        role="learner",
        is_mobile_verified=True,
    )


@pytest.fixture
def complete_learner(db):
    return User.objects.create_user(
        username="complete",
        mobile="9876543002",
        role="learner",
        is_mobile_verified=True,
        first_name="Ada",
        email="ada@example.com",
        age=25,
        city="Chennai",
    )


@pytest.mark.django_db
def test_incomplete_learner_is_blocked(incomplete_learner):
    c = APIClient()
    c.force_authenticate(user=incomplete_learner)
    r = c.get("/api/v1/courses/")
    assert r.status_code == 403


@pytest.mark.django_db
def test_complete_learner_is_allowed(complete_learner):
    c = APIClient()
    c.force_authenticate(user=complete_learner)
    r = c.get("/api/v1/courses/")
    assert r.status_code == 200


@pytest.mark.django_db
def test_incomplete_learner_can_complete_profile(incomplete_learner):
    c = APIClient()
    c.force_authenticate(user=incomplete_learner)
    r = c.patch(
        "/api/v1/auth/complete-profile",
        {"name": "Ada Lovelace", "email": "ada@example.com", "age": 25, "city": "Chennai"},
        format="json",
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["profile_complete"] is True
    incomplete_learner.refresh_from_db()
    assert incomplete_learner.profile_complete is True


@pytest.mark.django_db
def test_incomplete_learner_keeps_auth_flow_access(incomplete_learner):
    c = APIClient()
    c.force_authenticate(user=incomplete_learner)
    assert c.get("/api/v1/users/me").status_code == 200
    assert c.post("/api/v1/auth/logout").status_code == 200
    assert c.post("/api/v1/auth/refresh").status_code in (200, 401)


@pytest.mark.django_db
def test_incomplete_user_can_upload_avatar(incomplete_learner, tmp_path):
    c = APIClient()
    c.force_authenticate(user=incomplete_learner)
    f = tmp_path / "a.png"
    f.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 64)
    r = c.post(
        "/api/v1/upload/",
        {"file": f.open("rb"), "purpose": "avatar"},
        format="multipart",
    )
    assert r.status_code == 200


@pytest.mark.django_db
def test_admin_is_exempt(db):
    admin = User.objects.create_user(
        username="gated-admin",
        mobile="9876543003",
        role="admin",
        is_staff=True,
    )
    c = APIClient()
    c.force_authenticate(user=admin)
    assert c.get("/api/v1/courses/").status_code == 200
