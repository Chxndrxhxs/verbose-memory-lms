import pytest
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.mark.django_db
def test_send_and_verify_otp_creates_user():
    c = APIClient()
    r = c.post("/api/v1/auth/send-otp", {"mobile": "9876543210"}, format="json")
    assert r.status_code == 200
    code = r.json()["data"]["mock_code"]
    r = c.post("/api/v1/auth/verify-otp", {"mobile": "9876543210", "code": code}, format="json")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["is_new"] is True
    assert data["user"]["mobile"] == "9876543210"
    assert "access" in data["tokens"]
    assert User.objects.filter(mobile="9876543210").exists()


@pytest.mark.django_db
def test_complete_profile_updates_name():
    c = APIClient()
    r = c.post("/api/v1/auth/send-otp", {"mobile": "9000000000"}, format="json")
    code = r.json()["data"]["mock_code"]
    r = c.post("/api/v1/auth/verify-otp", {"mobile": "9000000000", "code": code}, format="json")
    access = r.json()["data"]["tokens"]["access"]
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    r = c.patch(
        "/api/v1/auth/complete-profile",
        {"name": "Maya Chen", "email": "maya@test.com", "age": 25},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "Maya Chen"
