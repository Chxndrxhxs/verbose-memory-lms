import re

from rest_framework import serializers

MIN_AGE = 5
MAX_AGE = 120

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


def validate_person_age(value) -> int | None:
    if value is None:
        return None
    if value < MIN_AGE or value > MAX_AGE:
        raise serializers.ValidationError(
            f"Please enter a valid age between {MIN_AGE} and {MAX_AGE}."
        )
    return value
