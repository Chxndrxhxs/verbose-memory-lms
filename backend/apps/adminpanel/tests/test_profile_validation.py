import pytest
from rest_framework import serializers
from rest_framework.test import APIClient

from apps.adminpanel.services import update_user
from apps.users.models import User
from core.validators import MAX_AGE, MIN_AGE, validate_person_name

ADMIN = "/api/v1/admin"

VALID_NAMES = [
    ("Maya", "Maya"),
    ("Maya Chen", "Maya Chen"),
    ("Anne-Marie", "Anne-Marie"),
    ("O'Brien", "O'Brien"),
    ("Maya-Chen Jr", "Maya-Chen Jr"),
    ("  Maya  ", "Maya"),
    ("a" * 60, "a" * 60),
]

INVALID_NAMES = [
    ("", "required"),
    ("   ", "required"),
    ("Maya3", "may only contain"),
    ("M3ya", "may only contain"),
    ("Maya_Chen", "may only contain"),
    ("Maya  Chen", "may only contain"),
    ("St. Louis", "may only contain"),
    ("Maya!", "may only contain"),
    ("<script>", "may only contain"),
    ("a" * 61, "60 characters or fewer"),
]


@pytest.mark.parametrize(("raw", "expected"), VALID_NAMES)
def test_person_name_accepts_letters_spaces_hyphens_apostrophes(raw, expected):
    assert validate_person_name(raw, "First name") == expected


@pytest.mark.parametrize(("raw", "fragment"), INVALID_NAMES)
def test_person_name_rejects_everything_else(raw, fragment):
    with pytest.raises(serializers.ValidationError) as exc:
        validate_person_name(raw, "First name")
    assert fragment in str(exc.value.detail)


def test_age_bounds_are_inclusive():
    assert (MIN_AGE, MAX_AGE) == (1, 100)


@pytest.mark.django_db
def test_name_split_populates_first_and_last():
    user = User.objects.create_user(username="7000000010", mobile="7000000010")
    update_user(user, {"name": "Maya Chen"})
    user.refresh_from_db()
    assert (user.first_name, user.last_name) == ("Maya", "Chen")


@pytest.mark.django_db
def test_single_token_name_leaves_last_name_empty():
    user = User.objects.create_user(username="7000000011", mobile="7000000011")
    update_user(user, {"name": "Maya"})
    user.refresh_from_db()
    assert (user.first_name, user.last_name) == ("Maya", "")


@pytest.mark.django_db
def test_extra_whitespace_between_tokens_is_collapsed():
    user = User.objects.create_user(username="7000000012", mobile="7000000012")
    update_user(user, {"name": "Maya  Chen"})
    user.refresh_from_db()
    assert (user.first_name, user.last_name) == ("Maya", "Chen")


@pytest.mark.django_db
def test_name_split_rejects_invalid_last_name():
    user = User.objects.create_user(username="7000000013", mobile="7000000013")
    with pytest.raises(serializers.ValidationError) as exc:
        update_user(user, {"name": "Maya Ch3n"})
    assert "Last name" in str(exc.value.detail)
    user.refresh_from_db()
    assert user.first_name == ""


@pytest.mark.django_db
def test_blank_name_is_rejected():
    user = User.objects.create_user(username="7000000014", mobile="7000000014")
    with pytest.raises(serializers.ValidationError) as exc:
        update_user(user, {"name": "   "})
    assert "First name is required" in str(exc.value.detail)


@pytest.mark.django_db
@pytest.mark.parametrize("raw", [101, 121, -1, 999])
def test_out_of_range_age_is_rejected(raw):
    user = User.objects.create_user(username="7000000015", mobile="7000000015")
    with pytest.raises(serializers.ValidationError) as exc:
        update_user(user, {"age": raw})
    assert f"between {MIN_AGE} and {MAX_AGE}" in str(exc.value.detail)


@pytest.mark.django_db
@pytest.mark.parametrize("raw", [MIN_AGE, 30, MAX_AGE, "24", "100"])
def test_in_range_age_is_accepted_and_coerced_to_int(raw):
    user = User.objects.create_user(username="7000000016", mobile="7000000016")
    update_user(user, {"age": raw})
    user.refresh_from_db()
    assert user.age == int(raw)
    assert isinstance(user.age, int)


@pytest.mark.django_db
def test_non_numeric_age_is_rejected():
    user = User.objects.create_user(username="7000000017", mobile="7000000017")
    with pytest.raises(serializers.ValidationError) as exc:
        update_user(user, {"age": "abc"})
    assert f"between {MIN_AGE} and {MAX_AGE}" in str(exc.value.detail)


@pytest.mark.django_db
def test_failed_update_does_not_partially_write():
    user = User.objects.create_user(username="7000000018", mobile="7000000018")
    with pytest.raises(serializers.ValidationError):
        update_user(user, {"name": "Maya Ch3n", "role": "instructor", "age": 400})
    user.refresh_from_db()
    assert user.first_name == ""
    assert user.role == User.Role.LEARNER
    assert user.age is None


@pytest.fixture
def admin() -> User:
    return User.objects.create_user(
        username="7000000099",
        mobile="7000000099",
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def target() -> User:
    return User.objects.create_user(username="7000000098", mobile="7000000098")


def client_for(user: User) -> APIClient:
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.mark.django_db
def test_api_accepts_valid_profile(admin, target):
    c = client_for(admin)
    r = c.patch(
        f"{ADMIN}/users/{target.id}",
        {"name": "Maya Chen", "city": "New Delhi", "age": 24},
        format="json",
    )
    assert r.status_code == 200
    target.refresh_from_db()
    assert (target.first_name, target.last_name) == ("Maya", "Chen")
    assert target.city == "New Delhi"
    assert target.age == 24


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field", "value", "fragment"),
    [
        ("first_name", "Maya3", "may only contain"),
        ("last_name", "Ch3n", "may only contain"),
        ("city", "Chennai1", "may only contain"),
        ("city", "", "required"),
        ("age", 101, "between 1 and 100"),
        ("age", 121, "between 1 and 100"),
    ],
)
def test_api_rejects_invalid_fields(admin, target, field, value, fragment):
    c = client_for(admin)
    r = c.patch(f"{ADMIN}/users/{target.id}", {field: value}, format="json")
    assert r.status_code == 400
    assert fragment in str(r.json())
    target.refresh_from_db()
    assert getattr(target, field) in ("", None)


@pytest.mark.django_db
@pytest.mark.parametrize("boundary", [MIN_AGE, MAX_AGE])
def test_api_accepts_age_boundaries(admin, target, boundary):
    c = client_for(admin)
    r = c.patch(f"{ADMIN}/users/{target.id}", {"age": boundary}, format="json")
    assert r.status_code == 200
    target.refresh_from_db()
    assert target.age == boundary


@pytest.mark.django_db
def test_api_rejects_invalid_full_name(admin, target):
    c = client_for(admin)
    r = c.patch(f"{ADMIN}/users/{target.id}", {"name": "Maya Ch3n"}, format="json")
    assert r.status_code == 400
    assert "Last name" in str(r.json())
    target.refresh_from_db()
    assert target.first_name == ""


@pytest.mark.django_db
def test_non_admin_cannot_bypass_validation(target):
    c = client_for(target)
    r = c.patch(f"{ADMIN}/users/{target.id}", {"age": 4}, format="json")
    assert r.status_code == 403


# --- admin cannot clear a user's age (RAM-42) -------------------------------


@pytest.mark.django_db
def test_api_rejects_blank_age(admin, target):
    target.age = 30
    target.save(update_fields=["age"])
    c = client_for(admin)
    r = c.patch(f"{ADMIN}/users/{target.id}", {"age": ""}, format="json")
    assert r.status_code == 400
    assert "required" in str(r.json()).lower()
    target.refresh_from_db()
    assert target.age == 30


@pytest.mark.django_db
def test_api_rejects_null_age(admin, target):
    target.age = 30
    target.save(update_fields=["age"])
    c = client_for(admin)
    r = c.patch(f"{ADMIN}/users/{target.id}", {"age": None}, format="json")
    assert r.status_code == 400
    target.refresh_from_db()
    assert target.age == 30


@pytest.mark.django_db
def test_update_user_rejects_blank_age(target):
    target.age = 30
    target.save(update_fields=["age"])
    with pytest.raises(serializers.ValidationError) as exc:
        update_user(target, {"age": ""})
    assert "required" in str(exc.value.detail).lower()
    target.refresh_from_db()
    assert target.age == 30


# --- admin cannot blank out an email (RAM-31, admin path) ------------------


@pytest.mark.django_db
@pytest.mark.parametrize("value", ["", "   ", "not-an-email"])
def test_api_rejects_invalid_email(admin, target, value):
    target.email = "real@example.com"
    target.save(update_fields=["email"])
    c = client_for(admin)
    r = c.patch(f"{ADMIN}/users/{target.id}", {"email": value}, format="json")
    assert r.status_code == 400
    target.refresh_from_db()
    assert target.email == "real@example.com"
