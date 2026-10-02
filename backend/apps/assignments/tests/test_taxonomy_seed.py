"""The flat exam-board taxonomy seeded by 0008 is what the instructor picker
and the learner catalog browse by, so both halves are asserted here: the govt
boards exist and are offered, and the old IT / Non-IT tree is hidden but not
destroyed (older assignments and packs may still reference those rows).
"""

import pytest

from apps.assignments.models import Category
from apps.assignments.services import boards_payload

EXPECTED_BOARDS = {
    "SSC",
    "IBPS",
    "Railways",
    "UPSC",
    "SBI",
    "RBI",
    "LIC",
    "CTET",
    "NET / UGC",
    "State PSC",
    "Defence",
}
LEGACY = {"IT", "Non-IT"}


@pytest.mark.django_db
def test_seeded_boards_are_offered():
    offered = {b["name"] for b in boards_payload()}
    assert EXPECTED_BOARDS <= offered


@pytest.mark.django_db
def test_boards_are_ordered_by_position():
    positions = [b["position"] for b in boards_payload()]
    assert positions == sorted(positions)


@pytest.mark.django_db
def test_boards_payload_counts_are_integers():
    for board in boards_payload():
        assert isinstance(board["assignments_count"], int)


@pytest.mark.django_db
def test_legacy_it_tree_is_hidden_not_deleted():
    legacy = Category.objects.filter(name__in=LEGACY)
    assert legacy.exists(), "legacy rows must be kept for existing foreign keys"
    assert not legacy.filter(is_active=True).exists()


@pytest.mark.django_db
def test_legacy_categories_are_not_offered_as_boards():
    offered = {b["name"] for b in boards_payload()}
    assert not (offered & LEGACY)
