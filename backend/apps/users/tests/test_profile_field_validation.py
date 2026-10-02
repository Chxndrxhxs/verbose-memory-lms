"""Validation that used to be missing on the learner/instructor profile form and
on the admin course form.

Covers RAM-27/30/31/33 (profile fields), RAM-24 (course title) and
RAM-20 (cover image URL).
"""

import pytest
from rest_framework import serializers

from apps.courses.serializers import (
    CourseListSerializer,
    validate_course_title,
    validate_cover_image_url,
)
from apps.users.serializers import CompleteProfileSerializer


class FakeUser:
    """Stands in for the model so serializer-level tests need no database."""

    def __init__(self):
        self.first_name = ""
        self.last_name = ""
        self.email = ""
        self.age = None
        self.city = ""
        self.avatar = ""
        self.saved = False

    def save(self):
        self.saved = True


# --- profile: name (RAM-30) -------------------------------------------------


@pytest.mark.parametrize(
    ("raw", "fragment"),
    [
        ("Ram1234!@#$", "may only contain"),
        ("Maya3", "may only contain"),
        ("Test_1", "may only contain"),
        ("<script>", "may only contain"),
        ("Maya123", "may only contain"),
        ("", "may not be blank"),
    ],
)
def test_profile_name_rejects_digits_and_symbols(raw, fragment):
    with pytest.raises(serializers.ValidationError) as exc:
        CompleteProfileSerializer(data={"name": raw}).is_valid(raise_exception=True)
    assert fragment in str(exc.value.detail)


@pytest.mark.parametrize("raw", ["Maya Chen", "Anne-Marie", "O'Brien"])
def test_profile_name_accepts_letters_spaces_hyphens_apostrophes(raw):
    assert CompleteProfileSerializer(data={"name": raw}).is_valid()


# --- profile: city (RAM-27, RAM-33) -----------------------------------------


@pytest.mark.parametrize("raw", ["Hyd1234&*(%$", "Delhi1234!@#$", "New York 99", "St. Louis"])
def test_profile_city_rejects_digits_and_symbols(raw):
    with pytest.raises(serializers.ValidationError) as exc:
        CompleteProfileSerializer(data={"name": "Maya Chen", "city": raw}).is_valid(
            raise_exception=True
        )
    assert "City may only contain" in str(exc.value.detail)


@pytest.mark.parametrize("raw", ["Bengaluru", "New York"])
def test_profile_city_accepts_letters_and_spaces(raw):
    assert CompleteProfileSerializer(data={"name": "Maya Chen", "city": raw}).is_valid()


def test_blank_city_is_allowed():
    assert CompleteProfileSerializer(data={"name": "Maya Chen", "city": ""}).is_valid()


# --- profile: email (RAM-31) ------------------------------------------------


def test_blank_email_is_rejected():
    with pytest.raises(serializers.ValidationError) as exc:
        CompleteProfileSerializer(data={"email": ""}).is_valid(raise_exception=True)
    assert "Valid email required" in str(exc.value.detail)


def test_cleared_email_is_not_persisted():
    user = FakeUser()
    user.email = "maya@mail.com"
    serializer = CompleteProfileSerializer(user, data={"email": ""}, partial=True)
    assert not serializer.is_valid()
    assert serializer.errors["email"] == ["Valid email required"]
    assert user.email == "maya@mail.com"


# --- profile: age (matches the admin rule) ----------------------------------


@pytest.mark.parametrize("raw", [101, 121, 999])
def test_profile_age_outside_range_is_rejected(raw):
    with pytest.raises(serializers.ValidationError) as exc:
        CompleteProfileSerializer(data={"name": "Maya Chen", "age": raw}).is_valid(
            raise_exception=True
        )
    assert "valid age between" in str(exc.value.detail)


@pytest.mark.parametrize("raw", [0, 5, 30, 100])
def test_profile_age_inside_range_is_accepted(raw):
    assert CompleteProfileSerializer(data={"name": "Maya Chen", "age": raw}).is_valid()


# --- profile: name split on save (RAM-30) -----------------------------------


def test_valid_profile_name_is_split_into_first_and_last():
    user = FakeUser()
    serializer = CompleteProfileSerializer(user, data={"name": "Maya Chen"}, partial=True)
    assert serializer.is_valid(), serializer.errors
    serializer.save()
    assert (user.first_name, user.last_name) == ("Maya", "Chen")
    assert user.saved


# --- profile: blank fields are not persisted (RAM-8, RAM-31) ----------------


@pytest.mark.parametrize("field", ["name", "email", "age"])
def test_blank_profile_field_is_rejected_on_update(field):
    """Clearing a field and saving used to persist an empty value."""
    user = FakeUser()
    serializer = CompleteProfileSerializer(user, data={field: ""}, partial=True)
    assert not serializer.is_valid()
    assert field in serializer.errors


@pytest.mark.parametrize("blank", ["", None])
def test_blank_age_is_rejected(blank):
    """Clearing age used to persist an empty value (RAM-8)."""
    user = FakeUser()
    serializer = CompleteProfileSerializer(user, data={"age": blank}, partial=True)
    assert not serializer.is_valid()
    assert "age" in serializer.errors
    assert user.saved is False


# --- profile: age must be believable (RAM-37) ------------------------------


@pytest.mark.parametrize("raw", [29788, 32767, 101, 999])
def test_absurd_age_is_rejected_and_not_persisted(raw):
    user = FakeUser()
    serializer = CompleteProfileSerializer(
        user, data={"name": "Maya Chen", "age": raw}, partial=True
    )
    assert not serializer.is_valid(), serializer.errors
    assert user.saved is False


# --- profile: name rules hold on update too (RAM-30) ------------------------


@pytest.mark.parametrize("raw", ["Maya3", "<script>", "Maya_Chen"])
def test_profile_name_rules_apply_on_update(raw):
    user = FakeUser()
    serializer = CompleteProfileSerializer(user, data={"name": raw}, partial=True)
    assert not serializer.is_valid()
    assert "name" in serializer.errors
    assert user.saved is False


# --- course title (RAM-24) --------------------------------------------------


@pytest.mark.parametrize(
    "raw",
    ["--------------------", "!!!!!!!!", "###", "   ", "-_-_-"],
)
def test_course_title_without_letter_or_digit_is_rejected(raw):
    with pytest.raises(serializers.ValidationError) as exc:
        validate_course_title(raw)
    assert "at least one letter or number" in str(exc.value.detail)


@pytest.mark.parametrize("raw", ["C++", ".NET", "React 18", "HTML5", "日本語"])
def test_course_title_with_symbols_but_readable_text_is_accepted(raw):
    assert validate_course_title(raw) == raw


def test_course_title_field_is_validated_by_the_serializer():
    with pytest.raises(serializers.ValidationError) as exc:
        CourseListSerializer(data={"title": "----------"}).is_valid(raise_exception=True)
    assert "title" in exc.value.detail


# --- cover image URL (RAM-20) -----------------------------------------------


@pytest.mark.parametrize(
    "raw",
    [
        "https://example.com/doc.pdf",
        "https://example.com/file.PDF",
        "https://example.com/archive.zip",
        "abc",
        "javascript:alert(1)",
        "ftp://example.com/cover.png",
    ],
)
def test_non_image_cover_url_is_rejected(raw):
    with pytest.raises(serializers.ValidationError) as exc:
        validate_cover_image_url(raw)
    assert "valid image URL" in str(exc.value.detail)


@pytest.mark.parametrize(
    "raw",
    [
        "https://example.com/cover.png",
        "https://example.com/cover.JPEG",
        "https://cdn.example.com/img/cover.webp",
        "https://example.com/cover.png?w=1600",
        "https://example.com/cover%20one.png",
    ],
)
def test_image_cover_url_is_accepted(raw):
    assert validate_cover_image_url(raw) == raw


def test_blank_cover_image_is_allowed():
    assert validate_cover_image_url("") == ""


def test_cover_image_field_is_validated_by_the_serializer():
    with pytest.raises(serializers.ValidationError) as exc:
        CourseListSerializer(data={"cover_image": "https://example.com/doc.pdf"}).is_valid(
            raise_exception=True
        )
    assert "cover_image" in exc.value.detail
