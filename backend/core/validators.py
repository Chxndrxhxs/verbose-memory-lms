import re

from rest_framework import serializers

MIN_AGE = 0
MAX_AGE = 100

AGE_MSG = f"Please enter a valid age between {MIN_AGE} and {MAX_AGE}."

# An exam paper's total is a few hundred marks at most; anything wildly beyond
# that is a typo (RAM-44). Mirrors MAX_TOTAL_MARKS in
# packages/shared/src/validation.ts.
MIN_TOTAL_MARKS = 1
MAX_TOTAL_MARKS = 1000

NAME_RE = re.compile(r"^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$")


def validate_person_name(value: str, label: str) -> str:
    """Shared name/city rule: letters, spaces, hyphens and apostrophes only.

    Admins, instructors and learners all submit through this so a value that is
    rejected in one profile form is rejected in all of them.
    """
    text = (value or "").strip()
    if not text:
        raise serializers.ValidationError(f"{label} is required.")
    if len(text) > 60:
        raise serializers.ValidationError(f"{label} must be 60 characters or fewer.")
    if not NAME_RE.match(text):
        raise serializers.ValidationError(
            f"{label} may only contain letters, spaces, hyphens and apostrophes."
        )
    return text


def validate_person_age(value, *, required: bool = False) -> int | None:
    """Age has to sit in a believable range, and a profile is not allowed to
    clear the field once it has been set. ``required`` turns the blank case
    into an error for the admin form (RAM-42).
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            raise serializers.ValidationError("Age is required.")
        return None
    if isinstance(value, str):
        try:
            value = int(value.strip())
        except ValueError:
            raise serializers.ValidationError(AGE_MSG) from None
    if value < MIN_AGE or value > MAX_AGE:
        raise serializers.ValidationError(AGE_MSG)
    return value


def validate_person_email(value: str, *, required: bool = True) -> str:
    email = (value or "").strip()
    if not email:
        if required:
            raise serializers.ValidationError("Valid email required")
        return email
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise serializers.ValidationError("Valid email required")
    return email
