import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture
def instructor(db):
    return User.objects.create_user(
        first_name="Test", email="test@example.com", age=25, city="Test",
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


# --- avatar uploads are capped at 2 MB (RAM-32) -----------------------------


def png_bytes(size):
    # The extension is what the server checks, so the payload just has to be
    # large enough to trip the size limit.
    return b"\x89PNG\r\n\x1a\n" + b"0" * (size - 8)


@pytest.mark.django_db
def test_avatar_over_2mb_is_rejected(instructor, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/upload/",
        {
            "file": SimpleUploadedFile(
                "me.png", png_bytes(3 * 1024 * 1024), content_type="image/png"
            ),
            "purpose": "avatar",
        },
        format="multipart",
    )
    assert r.status_code == 400
    assert "2MB" in r.json()["error"]


@pytest.mark.django_db
def test_avatar_under_2mb_is_accepted(instructor, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/upload/",
        {
            "file": SimpleUploadedFile("me.png", png_bytes(1024 * 1024), content_type="image/png"),
            "purpose": "avatar",
        },
        format="multipart",
    )
    assert r.status_code == 200, r.content
    assert r.json()["data"]["url"].startswith("/media/avatars/")


@pytest.mark.django_db
def test_lesson_upload_still_allows_more_than_2mb(instructor, tmp_path, settings):
    """Tightening the photo cap must not break lesson attachments."""
    settings.MEDIA_ROOT = tmp_path
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/upload/",
        {"file": SimpleUploadedFile("lecture.pdf", b"%PDF" + b"0" * (3 * 1024 * 1024))},
        format="multipart",
    )
    assert r.status_code == 200, r.content
    assert r.json()["data"]["url"].startswith("/media/lessons/")


@pytest.mark.django_db
def test_avatar_rejects_non_image_extension(instructor, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/upload/",
        {
            "file": SimpleUploadedFile("resume.pdf", b"%PDF-1.4", content_type="application/pdf"),
            "purpose": "avatar",
        },
        format="multipart",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_unknown_upload_purpose_is_rejected(instructor, tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path
    c = APIClient()
    c.force_authenticate(instructor)
    r = c.post(
        "/api/v1/upload/",
        {
            "file": SimpleUploadedFile("me.png", png_bytes(64), content_type="image/png"),
            "purpose": "sneaky",
        },
        format="multipart",
    )
    assert r.status_code == 400
