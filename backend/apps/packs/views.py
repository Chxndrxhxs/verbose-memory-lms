import logging

from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.assignments.models import Assignment, AssignmentQuestion
from apps.assignments.permissions import IsInstructor
from apps.assignments.services import AttemptDenied, begin_attempt, take_structure
from apps.assignments.views import _attempt_brief, ok
from apps.users.permissions import RequireCompleteProfile

from .models import PackPurchase, QuestionPack
from .serializers import PackQuestionsSerializer, PackWriteSerializer
from .services import (
    MODULE_CODES,
    PackDenied,
    build_exam_instances,
    consume_pack_attempt,
    grant_pack_purchase,
    pack_admin_payload,
    pack_detail_payload,
    pack_list_item,
    unpublish_instances,
)

logger = logging.getLogger(__name__)


def _can_manage(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (getattr(user, "role", "") in ("admin", "instructor") or user.is_staff)
    )


def _owns(user, pack: QuestionPack) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (pack.owner_id == user.id or getattr(user, "role", "") == "admin" or user.is_staff)
    )


# ---------------------------------------------------------------------------
# Learner: store
# ---------------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def pack_list(request):
    qs = (
        QuestionPack.objects.filter(status=QuestionPack.Status.PUBLISHED)
        .select_related("board", "inter_category", "owner", "inter_category__sub_category")
        .prefetch_related("purchases")
    )
    q = request.query_params.get("q", "").strip()
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
    for param, field in (
        ("board", "board_id"),
        ("category", "inter_category__sub_category__category_id"),
        ("sub_category", "inter_category__sub_category_id"),
        ("inter_category", "inter_category_id"),
    ):
        value = request.query_params.get(param)
        if value and value.isdigit():
            qs = qs.filter(**{field: value})
    price = request.query_params.get("price", "").strip().lower()
    if price == "free":
        qs = qs.filter(price=0)
    elif price == "paid":
        qs = qs.exclude(price=0)
    qs = qs.order_by("-created_at")
    return ok([pack_list_item(p, request.user) for p in qs[:100]])


@api_view(["GET"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def pack_detail(request, pack_id: int):
    try:
        pack = QuestionPack.objects.select_related(
            "inter_category__sub_category__category", "owner"
        ).get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if pack.status != QuestionPack.Status.PUBLISHED and not _owns(request.user, pack):
        return Response({"data": None, "error": "Pack not found"}, status=404)
    return ok(pack_detail_payload(pack, request.user))


@api_view(["GET"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def my_packs(request):
    purchases = (
        PackPurchase.objects.filter(learner=request.user)
        .select_related("pack", "pack__inter_category", "pack__owner")
        .order_by("-purchased_at")
    )
    items = []
    for purchase in purchases:
        item = pack_list_item(purchase.pack, request.user)
        item["purchased_at"] = purchase.purchased_at.isoformat()
        items.append(item)
    return ok(items)


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def pack_start(request, pack_id: int):
    module = str(request.data.get("module", "")).strip().lower()
    if module not in MODULE_CODES:
        return Response(
            {"data": None, "error": "module must be one of practice, mock"},
            status=400,
        )
    try:
        pack = QuestionPack.objects.get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if pack.status != QuestionPack.Status.PUBLISHED:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if module not in (pack.allowed_modules or []):
        return Response(
            {"data": None, "error": f"This pack cannot be taken as {module}"}, status=400
        )
    assignment = (
        Assignment.objects.filter(
            pack=pack, models__code=module, status=Assignment.Status.PUBLISHED
        )
        .distinct()
        .first()
    )
    if assignment is None:
        return Response(
            {"data": None, "error": "Exam is not ready yet; please try again shortly"},
            status=409,
        )
    model = assignment.models.filter(code=module, is_published=True).first()
    if model is None:
        return Response({"data": None, "error": "Model is not available"}, status=400)
    try:
        consume_pack_attempt(request.user, pack, assignment, model.id)
    except PackDenied as exc:
        return Response({"data": None, "error": exc.payload}, status=exc.status_code)
    try:
        attempt = begin_attempt(request.user, assignment, model.id)
    except AttemptDenied as exc:
        return Response({"data": None, "error": str(exc)}, status=exc.status_code)
    return ok({"attempt": _attempt_brief(attempt), "structure": take_structure(attempt)})


# ---------------------------------------------------------------------------
# Instructor / admin: builder
# ---------------------------------------------------------------------------


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def admin_packs(request):
    if request.method == "GET":
        qs = QuestionPack.objects.select_related("owner").order_by("-created_at")
        if getattr(request.user, "role", "") == "instructor" and not request.user.is_staff:
            qs = qs.filter(owner=request.user)
        return ok([pack_list_item(p) for p in qs[:200]])
    serializer = PackWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    pack = serializer.save(owner=request.user)
    if not pack.allowed_modules:
        pack.allowed_modules = ["mock"]
        pack.save(update_fields=["allowed_modules"])
    return ok(pack_admin_payload(pack))


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def admin_pack_detail(request, pack_id: int):
    try:
        pack = QuestionPack.objects.get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if not _owns(request.user, pack):
        return Response({"data": None, "error": "Not your pack"}, status=403)
    if request.method == "DELETE":
        pack.delete()
        return ok({"deleted": True})
    if request.method == "PATCH":
        serializer = PackWriteSerializer(pack, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        pack.refresh_from_db()
    return ok(pack_admin_payload(pack))


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def admin_pack_questions(request, pack_id: int):
    """Bulk-replace snapshot questions (bank import / upload / generate output)."""
    try:
        pack = QuestionPack.objects.get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if not _owns(request.user, pack):
        return Response({"data": None, "error": "Not your pack"}, status=403)
    if pack.status == QuestionPack.Status.PUBLISHED:
        return Response(
            {"data": None, "error": "Unpublish the pack before editing questions"},
            status=409,
        )
    serializer = PackQuestionsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    pack.questions.all().delete()
    for position, q in enumerate(serializer.validated_data["questions"]):
        options = [
            o if isinstance(o, str) else {"text": o.get("text", ""), "image": o.get("image", "")}
            for o in (q.get("options") or [])
        ]
        pack.questions.create(
            question=q.get("question", ""),
            question_image=q.get("question_image", ""),
            options=options,
            correct_answer=int(q.get("correct_answer", 0)),
            explanation=q.get("explanation", ""),
            marks=q.get("marks", 1),
            difficulty=q.get("difficulty") or "medium",
            topic=q.get("topic", ""),
            position=position,
            source=q.get("source", {}) if isinstance(q.get("source"), dict) else {},
        )
    pack.question_count = pack.questions.count()
    pack.version += 1
    pack.save(update_fields=["question_count", "version", "updated_at"])
    return ok(pack_admin_payload(pack))


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def admin_pack_publish(request, pack_id: int):
    try:
        pack = QuestionPack.objects.get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if not _owns(request.user, pack):
        return Response({"data": None, "error": "Not your pack"}, status=403)
    if pack.questions.count() == 0:
        return Response(
            {"data": None, "error": "Add at least one question before publishing"},
            status=400,
        )
    if not [m for m in (pack.allowed_modules or []) if m in MODULE_CODES]:
        return Response({"data": None, "error": "Enable at least one exam module"}, status=400)
    pack.status = QuestionPack.Status.PUBLISHED
    pack.save(update_fields=["status", "updated_at"])
    build_exam_instances(pack)
    return ok(pack_admin_payload(pack))


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def admin_pack_unpublish(request, pack_id: int):
    try:
        pack = QuestionPack.objects.get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if not _owns(request.user, pack):
        return Response({"data": None, "error": "Not your pack"}, status=403)
    pack.status = QuestionPack.Status.DRAFT
    pack.save(update_fields=["status", "updated_at"])
    unpublish_instances(pack)
    return ok({"status": pack.status})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def admin_pack_purchases(request, pack_id: int):
    try:
        pack = QuestionPack.objects.get(id=pack_id)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if not _owns(request.user, pack):
        return Response({"data": None, "error": "Not your pack"}, status=403)
    qs = (
        PackPurchase.objects.filter(pack=pack)
        .select_related("learner")
        .order_by("-purchased_at")[:200]
    )
    return ok(
        [
            {
                "learner": getattr(p.learner, "name", "") or p.learner.username,
                "attempts_used": p.attempts_used,
                "purchased_at": p.purchased_at.isoformat(),
            }
            for p in qs
        ]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def question_bank_topics(request):
    """Distinct question categories (topics) for the bank filter dropdown."""
    qs = AssignmentQuestion.objects.filter(assignment__pack__isnull=True).exclude(topic__exact="")
    if getattr(request.user, "role", "") == "instructor" and not request.user.is_staff:
        qs = qs.filter(assignment__created_by=request.user)
    topics = sorted({row["topic"].strip() for row in qs.values("topic") if row["topic"].strip()})
    return ok(topics)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsInstructor, RequireCompleteProfile])
def question_bank(request):
    """Browse existing saved questions to import into a pack."""
    qs = AssignmentQuestion.objects.filter(assignment__pack__isnull=True).select_related(
        "assignment"
    )
    if getattr(request.user, "role", "") == "instructor" and not request.user.is_staff:
        qs = qs.filter(assignment__created_by=request.user)
    q = request.query_params.get("q", "").strip()
    if q:
        qs = qs.filter(Q(question__icontains=q) | Q(topic__icontains=q))
    topic = request.query_params.get("topic", "").strip()
    if topic:
        qs = qs.filter(topic__icontains=topic)
    difficulty = request.query_params.get("difficulty", "").strip().lower()
    if difficulty in ("easy", "medium", "hard"):
        qs = qs.filter(difficulty=difficulty)
    qs = qs.order_by("-id")
    items = []
    for item in qs[:100]:
        items.append(
            {
                "id": item.id,
                "question": item.question,
                "question_image": item.question_image,
                "options": item.options,
                "correct_answer": item.correct_answer,
                "explanation": item.explanation,
                "marks": str(item.marks),
                "difficulty": item.difficulty,
                "topic": item.topic,
                "assignment_id": item.assignment_id,
                "assignment_title": item.assignment.title,
            }
        )
    return ok(items)


@api_view(["POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def claim_free_pack(request, pack_id: int):
    """Own a free pack without going through Razorpay."""
    try:
        pack = QuestionPack.objects.get(id=pack_id, status=QuestionPack.Status.PUBLISHED)
    except QuestionPack.DoesNotExist:
        return Response({"data": None, "error": "Pack not found"}, status=404)
    if pack.price > 0:
        return Response({"data": None, "error": "This pack is paid"}, status=400)
    purchase = grant_pack_purchase(request.user, pack)
    return ok({"owned": True, "pack_id": pack.id, "purchase_id": purchase.id})
