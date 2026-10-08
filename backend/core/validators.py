import re

from rest_framework import serializers

MIN_AGE = 1
MAX_AGE = 100

AGE_MSG = f"Please enter a valid age between {MIN_AGE} and {MAX_AGE}."

# An exam paper's total is a few hundred marks at most; anything wildly beyond
# that is a typo (RAM-44). Mirrors MAX_TOTAL_MARKS in
# packages/shared/src/validation.ts.
MIN_TOTAL_MARKS = 1
MAX_TOTAL_MARKS = 1000

NAME_RE = re.compile(r"^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$")

# Hierarchy rows (category / sub-category / inter-category) share one
# naming rule with profile names.
CATEGORY_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9& ]*(?:[ '\-&][A-Za-z0-9& ]*)*$")


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


def validate_category_name(value: str) -> str:
    """Taxonomy rows are typed into admin forms and rendered in dropdowns
    everywhere, so they follow the name rule (plus digits and '&' for
    names like "Class 10 & 12").
    """
    text = (value or "").strip()
    if not text:
        raise serializers.ValidationError("Name is required.")
    if len(text) > 60:
        raise serializers.ValidationError("Name must be 60 characters or fewer.")
    if not CATEGORY_NAME_RE.match(text):
        raise serializers.ValidationError(
            "Name may only contain letters, digits, spaces, hyphens and '&'."
        )
    return text


# A title is a short human phrase. "Has a letter" alone lets keyboard
# smash like "qwertyuiop !@#$%12345" through, so titles also reject
# runs of 3+ symbols. Mirrors isValidTitle() in
# packages/shared/src/validation.ts.
TITLE_SYMBOL_RUN_RE = re.compile(r"[^\w\s]{3,}", re.UNICODE)


def validate_title(value: str, label: str = "Title") -> str:
    text = (value or "").strip()
    if not re.search(r"[^\W_]", text, re.UNICODE):
        raise serializers.ValidationError(f"{label} must contain at least one letter or number.")
    if TITLE_SYMBOL_RUN_RE.search(text):
        raise serializers.ValidationError(f"{label} must not contain a run of symbols.")
    return text


def validate_text_block(value: str, label: str, max_len: int) -> str:
    """Free-text blocks (subtitles, descriptions, instructions).

    Long enough for real content, but control characters are stripped and a
    block with no letters at all is keyboard smash, not content.
    """
    text = (value or "").strip()
    if not text:
        return text
    text = "".join(ch for ch in text if ch == "\n" or ch >= " ")
    if len(text) > max_len:
        raise serializers.ValidationError(f"{label} must be {max_len} characters or fewer.")
    if not re.search(r"[^\W_]", text, re.UNICODE):
        raise serializers.ValidationError(f"{label} must contain at least one letter.")
    return text


def validate_step_name(value: str) -> str:
    return validate_text_block(value, "Step name", 120)


def validate_question_text(value: str) -> str:
    return validate_text_block(value, "Question", 2000)


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
