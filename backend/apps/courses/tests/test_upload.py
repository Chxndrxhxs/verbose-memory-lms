import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        username="u1",
        mobile="9000000099",
        role="instructor",
        is_mobile_verified=True,
    )


@pytest.mark.django_db
def test_upload_pdf_returns_url(instructor, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    c = APIClient()
    c.force_authenticate(instructor)
    pdf_bytes = b"%PDF-1.4\n%fake\n%%EOF"
    r = c.post(
        "/api/v1/upload/",
        {"file": SimpleUploadedFile("guide.pdf", pdf_bytes, content_type="application/pdf")},
        format="multipart",
    )
    assert r.status_code == 200, r.content
    data = r.json()["data"]
    assert data["url"].startswith("/media/lessons/")
    assert data["url"].endswith(".pdf")
    assert data["size"] == len(pdf_bytes)


@pytest.mark.django_db
def test_upload_rejects_unsupported_ext(instructor):
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/upload/",
        {"file": SimpleUploadedFile("hack.exe", b"MZ", content_type="application/octet-stream")},
        format="multipart",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_upload_requires_auth():
    c = APIClient()
    r = c.post(
        "/api/v1/upload/",
        {"file": SimpleUploadedFile("a.pdf", b"%PDF")},
        format="multipart",
    )
    assert r.status_code == 401
