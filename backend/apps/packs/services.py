import logging
from collections import Counter

from django.db import transaction
from django.db.models import F

from apps.assignments.models import (
    Assignment,
    AssignmentAttempt,
    AssignmentModelStep,
)
from apps.assignments.services import (
    format_duration_hms,
    model_duration_seconds,
    module_defaults,
    replace_assignment_structure,
)

from .models import PackPurchase, QuestionPack

logger = logging.getLogger(__name__)

MODULE_CODES = ("practice", "mock")


class PackDenied(Exception):
    """Raised when a pack attempt may not start. Carries a JSON payload + status."""

    def __init__(self, payload: dict, status_code: int = 403):
        super().__init__(payload.get("code", "denied"))
        self.payload = payload
        self.status_code = status_code


def purchase_required_pack(pack: QuestionPack) -> dict:
    return {
        "code": "purchase_required",
        "pack_id": pack.id,
        "price": str(pack.price),
    }


# ---------------------------------------------------------------------------
# Payloads
# ---------------------------------------------------------------------------


def pack_list_item(pack: QuestionPack, learner=None) -> dict:
    data = {
        "id": pack.id,
        "title": pack.title,
        "description": pack.description,
        "cover": pack.cover,
        "price": str(pack.price),
        "original_price": str(pack.original_price),
        "is_free": pack.price == 0,
        "status": pack.status,
        "question_count": pack.question_count,
        "allowed_modules": list(pack.allowed_modules or []),
        "max_attempts": pack.max_attempts,
        "owner_name": getattr(pack.owner, "name", "") or "",
        "inter_category": _category_chain(pack),
        "board": ({"id": pack.board.id, "name": pack.board.name} if pack.board_id else None),
        "created_at": pack.created_at.isoformat(),
    }
    data.update(_ownership(pack, learner))
    return data


def pack_detail_payload(pack: QuestionPack, learner=None, include_questions=False) -> dict:
    data = pack_list_item(pack, learner)
    questions = list(pack.questions.order_by("position", "id"))
    data["topics"] = Counter(q.topic for q in questions if q.topic).most_common(8)
    data["difficulty_mix"] = dict(Counter(q.difficulty or "medium" for q in questions))
    data["total_marks"] = str(sum(float(q.marks) for q in questions))
    data["modules"] = [
        {
            "code": code,
            "label": module_defaults(code)["label"],
            "proctored": module_defaults(code)["proctored"],
            "untimed": module_defaults(code)["untimed"],
        }
        for code in (pack.allowed_modules or [])
        if code in MODULE_CODES
    ]
    if include_questions:
        data["questions"] = [
            {
                "id": q.id,
                "question": q.question,
                "question_image": q.question_image,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "marks": str(q.marks),
                "difficulty": q.difficulty,
                "topic": q.topic,
                "position": q.position,
            }
            for q in questions
        ]
    return data


def _category_chain(pack: QuestionPack) -> dict | None:
    inter = pack.inter_category
    if inter is None:
        return None
    sub = inter.sub_category
    return {
        "id": inter.id,
        "name": inter.name,
        "sub_category": {"id": sub.id, "name": sub.name},
        "category": {"id": sub.category.id, "name": sub.category.name},
    }


def _ownership(pack: QuestionPack, learner) -> dict:
    """Ownership + remaining shared attempts for the catalog/store UI."""
    info = {"owned": False, "attempts_used": 0, "attempts_left": None}
    if learner is None or not getattr(learner, "is_authenticated", False):
        return info
    purchase = PackPurchase.objects.filter(learner=learner, pack=pack).first()
    if purchase is None:
        return info
    info["owned"] = True
    info["attempts_used"] = purchase.attempts_used
    if pack.max_attempts > 0:
        info["attempts_left"] = max(0, pack.max_attempts - purchase.attempts_used)
    return info


# ---------------------------------------------------------------------------
# Attempt pool (shared across modules)
# ---------------------------------------------------------------------------


@transaction.atomic
def consume_pack_attempt(user, pack: QuestionPack, assignment, model_id) -> PackPurchase:
    """Grant (free packs) or require (paid packs) ownership, then consume one
    attempt from the shared pool. Resuming an in-progress attempt is free."""
    purchase = PackPurchase.objects.select_for_update().filter(learner=user, pack=pack).first()
    if purchase is None:
        if pack.price > 0:
            raise PackDenied(purchase_required_pack(pack), 403)
        purchase = PackPurchase.objects.create(learner=user, pack=pack, version=pack.version)
    in_progress = AssignmentAttempt.objects.filter(
        learner=user,
        assignment=assignment,
        model_id=model_id,
        status=AssignmentAttempt.Status.IN_PROGRESS,
    ).exists()
    if in_progress:
        return purchase
    if pack.max_attempts > 0 and purchase.attempts_used >= pack.max_attempts:
        raise PackDenied({"code": "attempts_exhausted", "pack_id": pack.id}, 403)
    PackPurchase.objects.filter(id=purchase.id).update(attempts_used=F("attempts_used") + 1)
    purchase.refresh_from_db()
    return purchase


def grant_pack_purchase(user, pack: QuestionPack, payment=None) -> PackPurchase:
    """Record ownership after a successful payment (or free grant)."""
    purchase, _ = PackPurchase.objects.get_or_create(
        learner=user, pack=pack, defaults={"version": pack.version, "payment": payment}
    )
    if payment is not None and purchase.payment_id is None:
        purchase.payment = payment
        purchase.save(update_fields=["payment"])
    return purchase


# ---------------------------------------------------------------------------
# Exam instances: one hidden Assignment per allowed module
# ---------------------------------------------------------------------------


def build_exam_instances(pack: QuestionPack) -> list[Assignment]:
    """(Re)build the hidden exam instances for every allowed module."""
    questions = list(pack.questions.order_by("position", "id"))
    instances = []
    wanted = [m for m in (pack.allowed_modules or []) if m in MODULE_CODES]
    # Drop instances for modules no longer allowed.
    stale = Assignment.objects.filter(pack=pack).exclude(models__code__in=wanted).distinct()
    logger.info("Removing %s stale pack instances for pack %s", stale.count(), pack.id)
    stale.delete()
    for module in wanted:
        assignment = Assignment.objects.filter(pack=pack, models__code=module).distinct().first()
        defaults = module_defaults(module)
        if assignment is None:
            assignment = Assignment(pack=pack, created_by=pack.owner)
        assignment.title = f"{pack.title} · {defaults['label']}"
        assignment.description = pack.description
        assignment.inter_category = pack.inter_category
        assignment.board = pack.board
        assignment.status = Assignment.Status.PUBLISHED
        assignment.negative_marking = defaults["negative_marking"]
        assignment.security = dict(defaults["security"])
        assignment.results = dict(defaults["results"])
        assignment.passing_percentage = pack.passing_percentage
        assignment.max_attempts = 0  # pool is enforced on the purchase
        assignment.save()
        replace_assignment_structure(assignment, [_model_dict(pack, module, questions)])
        instances.append(assignment)
    pack.question_count = len(questions)
    pack.save(update_fields=["question_count", "updated_at"])
    return instances


def _question_dict(q) -> dict:
    return {
        "question": q.question,
        "question_image": q.question_image,
        "options": list(q.options),
        "correct_answer": int(q.correct_answer),
        "explanation": q.explanation,
        "marks": float(q.marks),
        "difficulty": q.difficulty or "medium",
        "topic": q.topic,
    }


def _chunk(items: list, size: int) -> list[list]:
    size = max(1, size)
    return [items[i : i + size] for i in range(0, len(items), size)]


def _model_dict(pack: QuestionPack, module: str, questions: list) -> dict:
    defaults = module_defaults(module)
    if module == "practice":
        steps = [
            {
                "kind": AssignmentModelStep.Kind.TEST,
                "name": "Practice set",
                "description": "Untimed practice with inline explanations.",
                "duration_seconds": 0,
                "questions": [_question_dict(q) for q in questions],
            }
        ]
    else:  # mock: one timed section per category (Testbook-style sections)
        steps = [
            {
                "kind": AssignmentModelStep.Kind.TEST,
                "name": f"Test {index + 1}",
                "description": "",
                "duration_seconds": pack.test_duration_seconds,
                "questions": [_question_dict(q) for q in chunk],
            }
            for index, chunk in enumerate(_chunk(questions, pack.test_size))
        ] or [
            {
                "kind": AssignmentModelStep.Kind.TEST,
                "name": "Test 1",
                "description": "",
                "duration_seconds": pack.test_duration_seconds,
                "questions": [],
            }
        ]
    return {
        "code": module,
        "name": defaults["label"],
        "description": f"{pack.title} in {defaults['label']} format.",
        "execution_mode": pack.execution_mode or "sequential",
        "is_published": True,
        "steps": steps,
    }


def unpublish_instances(pack: QuestionPack) -> None:
    """Take instances offline without deleting learner history."""
    Assignment.objects.filter(pack=pack).update(status=Assignment.Status.DRAFT)


def pack_admin_payload(pack: QuestionPack) -> dict:
    data = pack_detail_payload(pack, include_questions=True)
    data["test_size"] = pack.test_size
    data["test_duration_seconds"] = pack.test_duration_seconds
    data["set_size"] = pack.set_size
    data["set_duration_seconds"] = pack.set_duration_seconds
    data["execution_mode"] = pack.execution_mode
    data["passing_percentage"] = str(pack.passing_percentage)
    data["negative_marking"] = pack.negative_marking
    data["version"] = pack.version
    data["updated_at"] = pack.updated_at.isoformat()
    instances = (
        Assignment.objects.filter(pack=pack)
        .prefetch_related("models", "models__steps")
        .order_by("id")
    )
    data["instances"] = []
    longest = 0
    for a in instances:
        models = []
        for m in a.models.all():
            duration = model_duration_seconds(m)
            longest = max(longest, duration)
            models.append({"id": m.id, "code": m.code, "duration_seconds": duration})
        data["instances"].append(
            {"id": a.id, "title": a.title, "status": a.status, "models": models}
        )
    data["duration_label"] = format_duration_hms(longest)
    return data
