import pytest
from rest_framework.test import APIClient

from apps.users.models import OTP, User


def verify_mobile(c: APIClient, mobile: str) -> dict:
    r = c.post("/api/v1/auth/send-otp", {"mobile": mobile}, format="json")
    assert r.status_code == 200
    code = r.json()["data"]["mock_code"]
    r = c.post("/api/v1/auth/verify-otp", {"mobile": mobile, "code": code}, format="json")
    assert r.status_code == 200
    return r.json()["data"]


@pytest.mark.django_db
def test_send_and_verify_otp_creates_user():
    c = APIClient()
    data = verify_mobile(c, "9876543210")
    assert data["is_new"] is True
    assert data["user"]["mobile"] == "9876543210"
    assert "tokens" not in data
    assert "access_token" in c.cookies
    assert "refresh_token" in c.cookies
    assert User.objects.filter(mobile="9876543210").exists()


@pytest.mark.django_db
def test_complete_profile_updates_name():
    c = APIClient()
    verify_mobile(c, "9000000000")
    # session auth via cookies set by verify
    r = c.patch(
        "/api/v1/auth/complete-profile",
        {"name": "Maya Chen", "email": "maya@test.com", "age": 25},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "Maya Chen"


@pytest.mark.django_db
def test_delete_account_removes_user():
    c = APIClient()
    verify_mobile(c, "9111111111")
    r = c.delete("/api/v1/users/me")
    assert r.status_code == 200
    assert not User.objects.filter(mobile="9111111111").exists()


@pytest.mark.django_db
def test_cookie_refresh_renews_access():
    c = APIClient()
    verify_mobile(c, "9222222222")
    r = c.post("/api/v1/auth/refresh")
    assert r.status_code == 200
    assert r.json()["data"]["refreshed"] is True


@pytest.mark.django_db
def test_refresh_without_cookie_is_401():
    c = APIClient()
    r = c.post("/api/v1/auth/refresh")
    assert r.status_code == 401


@pytest.mark.django_db
def test_wrong_otp_attempts_lock_code():
    c = APIClient()
    r = c.post("/api/v1/auth/send-otp", {"mobile": "9333333333"}, format="json")
    code = r.json()["data"]["mock_code"]
    wrong = "0000" if code != "0000" else "0001"
    for _ in range(OTP.MAX_ATTEMPTS):
        r = c.post(
            "/api/v1/auth/verify-otp",
            {"mobile": "9333333333", "code": wrong},
            format="json",
        )
        assert r.status_code == 400
    # correct code no longer works after max attempts
    r = c.post("/api/v1/auth/verify-otp", {"mobile": "9333333333", "code": code}, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_resend_invalidates_previous_code():
    c = APIClient()
    r = c.post("/api/v1/auth/send-otp", {"mobile": "9444444444"}, format="json")
    first = r.json()["data"]["mock_code"]
    r = c.post("/api/v1/auth/send-otp", {"mobile": "9444444444"}, format="json")
    assert r.status_code == 200
    r = c.post("/api/v1/auth/verify-otp", {"mobile": "9444444444", "code": first}, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_become_instructor_once_only():
    c = APIClient()
    verify_mobile(c, "9555555555")
    r = c.post("/api/v1/auth/become-instructor")
    assert r.status_code == 200
    assert r.json()["data"]["role"] == "instructor"
    r = c.post("/api/v1/auth/become-instructor")
    assert r.status_code == 400
