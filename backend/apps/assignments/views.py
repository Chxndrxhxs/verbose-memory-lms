import logging

from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.enrollments.models import ActivityEvent
from apps.enrollments.services import log_event
from core.pagination import EnvelopePagination, paginate_queryset_view

from .models import (
    Assignment,
    AssignmentAttempt,
    AssignmentModel,
    Category,
    InterCategory,
    SubCategory,
)
from .permissions import IsInstructor
from .serializers import (
    AssignmentWriteSerializer,
    AttemptSerializer,
    StructurePayloadSerializer,
)
from .services import (
    assignment_payload,
    category_tree_payload,
    collect_leaf_steps,
    generate_questions_from_document,
    grade_expired_attempts,
    model_preview,
    regenerate_options,
    regenerate_question,
    replace_assignment_structure,
    save_assignment_fields,
    save_attempt_answers,
    start_attempt,
    submit_attempt,
    take_structure,
)

logger = logging.getLogger(__name__)


def ok(data):
    return Response({"data": data, "error": None})


def paginate_data_list(request, data):
    """Envelope-paginate an in-memory list when ?page is present."""
    if request.query_params.get("page") is None:
        return None
    paginator = EnvelopePagination()
    page = paginator.paginate_queryset(list(data), request)
    if page is None:
        return None
    return paginator.get_paginated_response(list(page))


# ---------------------------------------------------------------------------
# Learner: catalog
# ---------------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def catalog_tree(request):
    return ok(category_tree_payload())


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def published_list(request):
    qs = Assignment.objects.filter(status=Assignment.Status.PUBLISHED).select_related(
        "inter_category", "inter_category__sub_category", "inter_category__sub_category__category"
    )
    q = request.query_params.get("q", "").strip()
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
    for param, field in (
        ("category", "inter_category__sub_category__category_id"),
        ("sub_category", "inter_category__sub_category_id"),
        ("inter_category", "inter_category_id"),
        ("difficulty", "difficulty"),
    ):
        value = request.query_params.get(param)
        if value and value.isdigit():
            qs = qs.filter(**{field: value})
    items = [assignment_payload(a, include_models=False) for a in qs[:100]]
    paged = paginate_data_list(request, items)
    if paged is not None:
        return paged
    return ok(items)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def detail(request, assignment_id: int):
    try:
        assignment = Assignment.objects.select_related(
            "inter_category__sub_category__category", "created_by", "course"
        ).get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    allowed = assignment.status == Assignment.Status.PUBLISHED or _can_manage(request.user)
    if not allowed:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    # A catalog page must never disclose the answer key before an attempt starts.
    return ok(assignment_payload(assignment, include_models=False))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def model_choices(request, assignment_id: int):
    try:
        assignment = Assignment.objects.get(id=assignment_id, status=Assignment.Status.PUBLISHED)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    return ok([model_preview(m) for m in assignment.models.filter(is_published=True)])


# ---------------------------------------------------------------------------
# Learner: attempts
# ---------------------------------------------------------------------------


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start(request, assignment_id: int):
    model_id = request.data.get("model_id")
    try:
        model_id = int(model_id)
    except (TypeError, ValueError):
        return Response(
            {"data": None, "error": "model_id is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        assignment = Assignment.objects.get(id=assignment_id, status=Assignment.Status.PUBLISHED)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )

    now = timezone.now()
    if assignment.start_date and now < assignment.start_date:
        return Response(
            {"data": None, "error": "This assignment is not open yet"},
            status=status.HTTP_403_FORBIDDEN,
        )
    if assignment.end_date and now > assignment.end_date:
        return Response(
            {"data": None, "error": "This assignment is no longer available"},
            status=status.HTTP_403_FORBIDDEN,
        )

    grade_expired_attempts()
    existing = AssignmentAttempt.objects.filter(
        learner=request.user,
        assignment=assignment,
        model_id=model_id,
        status=AssignmentAttempt.Status.IN_PROGRESS,
    ).first()
    if existing:
        return ok({"attempt": _attempt_brief(existing), "structure": take_structure(existing)})

    if assignment.max_attempts > 0:
        used = AssignmentAttempt.objects.filter(
            learner=request.user,
            assignment=assignment,
            status__in=[AssignmentAttempt.Status.COMPLETED, AssignmentAttempt.Status.EXPIRED],
        ).count()
        if used >= assignment.max_attempts:
            return Response(
                {"data": None, "error": "Maximum attempts reached"},
                status=status.HTTP_403_FORBIDDEN,
            )

    if not assignment.models.filter(id=model_id, is_published=True).exists():
        return Response(
            {"data": None, "error": "Model is not available"}, status=status.HTTP_400_BAD_REQUEST
        )

    model = AssignmentModel.objects.get(id=model_id)
    attempt = start_attempt(request.user, assignment, model)
    return ok({"attempt": _attempt_brief(attempt), "structure": take_structure(attempt)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit(request, assignment_id: int):
    attempt_id = request.data.get("attempt_id")
    try:
        attempt = AssignmentAttempt.objects.get(id=attempt_id, assignment_id=assignment_id)
    except (AssignmentAttempt.DoesNotExist, TypeError, ValueError):
        return Response(
            {"data": None, "error": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND
        )
    if attempt.learner_id != request.user.id:
        return Response(
            {"data": None, "error": "Not your attempt"}, status=status.HTTP_403_FORBIDDEN
        )

    answers = request.data.get("answers") or {}
    finished = submit_attempt(attempt, answers)
    log_event(
        request.user,
        ActivityEvent.Verb.ASSIGNMENT_SUBMITTED,
        course=finished.assignment.course,
        meta={
            "assignment_id": finished.assignment_id,
            "attempt_id": finished.id,
            "model": finished.model.code,
            "final_score": str(finished.final_score),
            "passed": finished.passed,
            "auto_submitted": finished.is_auto_submitted,
        },
    )
    return ok(result_payload(finished))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_attempts(request):
    qs = (
        AssignmentAttempt.objects.filter(learner=request.user)
        .select_related("assignment", "model")
        .order_by("-created_at")
    )
    paged = paginate_queryset_view(request, qs, AttemptSerializer)
    if paged is not None:
        return paged
    return ok(AttemptSerializer(qs[:50], many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_answer(request, attempt_id: int):
    try:
        attempt = AssignmentAttempt.objects.get(
            id=attempt_id,
            learner=request.user,
            status=AssignmentAttempt.Status.IN_PROGRESS,
        )
    except AssignmentAttempt.DoesNotExist:
        return Response(
            {"data": None, "error": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND
        )
    grade_expired_attempts()
    attempt.refresh_from_db()
    if attempt.status != AssignmentAttempt.Status.IN_PROGRESS:
        return Response(
            {"data": None, "error": "Attempt is no longer in progress"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    answers = request.data.get("answers") or {}
    saved = save_attempt_answers(attempt, answers)
    return ok({"saved": True, "saved_at": saved.updated_at.isoformat()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attempt_detail(request, attempt_id: int):
    try:
        attempt = AssignmentAttempt.objects.select_related("assignment", "model").get(id=attempt_id)
    except AssignmentAttempt.DoesNotExist:
        return Response(
            {"data": None, "error": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND
        )
    if attempt.learner_id != request.user.id and not _can_manage(request.user):
        return Response(
            {"data": None, "error": "Not your attempt"}, status=status.HTTP_403_FORBIDDEN
        )

    grade_expired_attempts()
    attempt = AssignmentAttempt.objects.get(id=attempt.id)
    if attempt.status == AssignmentAttempt.Status.IN_PROGRESS:
        return ok(
            {
                "attempt": _attempt_brief(attempt),
                "structure": take_structure(attempt),
                "answers": attempt.answers or {},
            }
        )
    return ok(result_payload(attempt))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transcript(request, assignment_id: int):
    qs = AssignmentAttempt.objects.filter(
        learner=request.user,
        assignment_id=assignment_id,
        status__in=[AssignmentAttempt.Status.COMPLETED, AssignmentAttempt.Status.EXPIRED],
    ).select_related("model", "result")
    attempt_id = request.query_params.get("attempt_id")
    if attempt_id and attempt_id.isdigit():
        qs = qs.filter(id=int(attempt_id))
    attempt = qs.order_by("-ended_at").first()
    if attempt is None:
        return Response(
            {"data": None, "error": "No attempt found"}, status=status.HTTP_404_NOT_FOUND
        )
    return ok(result_payload(attempt))


def _attempt_brief(attempt: AssignmentAttempt) -> dict:
    return {
        "id": attempt.id,
        "assignment": attempt.assignment_id,
        "model_id": attempt.model_id,
        "model_code": attempt.model.code,
        "model_name": attempt.model.name,
        "status": attempt.status,
        "started_at": attempt.started_at.isoformat(),
        "expires_at": attempt.expires_at.isoformat(),
        "seconds_remaining": max(0, int((attempt.expires_at - timezone.now()).total_seconds())),
        "total_questions": attempt.total_questions,
    }


def result_payload(attempt: AssignmentAttempt) -> dict:
    assignment = attempt.assignment
    show_answers = (assignment.results or {}).get("show_correct_answers", False)
    data = {
        "attempt": AttemptSerializer(attempt).data,
        "transcript": attempt.transcript,
    }
    if show_answers:
        review = _answer_review(attempt)
        data["review"] = review
    return data


def _answer_review(attempt: AssignmentAttempt) -> list[dict]:
    """Per-question review using the snapshot the learner answered against."""
    snapshot = attempt.questions_snapshot or {}
    answers = attempt.answers or {}
    reviews = []
    for step in attempt.model.steps.all():
        _append_review(reviews, step, snapshot, answers)
    return reviews


def _append_review(reviews: list, step, snapshot: dict, answers: dict) -> None:
    children = list(step.children.all())
    if children:
        for child in children:
            _append_review(reviews, child, snapshot, answers)
        return
    step_snap = snapshot.get(str(step.id), {})
    step_answers = answers.get(str(step.id), {})
    for q in step.questions.order_by("position", "id"):
        meta = step_snap.get(str(q.id)) or {
            "options": list(q.options),
            "correct_answer": int(q.correct_answer),
            "marks": float(q.marks),
        }
        selected = step_answers.get(str(q.id))
        if selected is None:
            is_correct = None
        else:
            is_correct = int(selected) == meta["correct_answer"]
        reviews.append(
            {
                "step_id": step.id,
                "step_name": step.name,
                "question_id": q.id,
                "question": q.question,
                "question_image": q.question_image,
                "options": meta["options"],
                "selected": selected,
                "correct_answer": meta["correct_answer"],
                "is_correct": is_correct,
                "marks_awarded": meta["marks"]
                if is_correct
                else (-meta["marks"] if is_correct is False else 0),
                "explanation": q.explanation,
            }
        )


def _can_manage(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (getattr(user, "role", "") in ("admin", "instructor") or user.is_staff)
    )


# ---------------------------------------------------------------------------
# Instructor/admin: assignment management
# ---------------------------------------------------------------------------


@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def admin_list(request):
    if request.method == "POST":
        serializer = AssignmentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = save_assignment_fields(None, serializer.validated_data, request.user)
        return Response(
            {"data": assignment_payload(assignment, include_models=False), "error": None},
            status=status.HTTP_201_CREATED,
        )

    qs = Assignment.objects.select_related(
        "inter_category", "inter_category__sub_category", "inter_category__sub_category__category"
    )
    q = (request.query_params.get("q") or request.query_params.get("search") or "").strip()
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
    st = request.query_params.get("status")
    if st in dict(Assignment.Status.choices):
        qs = qs.filter(status=st)
    qs = qs.order_by("-updated_at")
    data = [assignment_payload(a, include_models=False) for a in qs[:200]]
    return ok(data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsInstructor])
def admin_detail(request, assignment_id: int):
    try:
        assignment = Assignment.objects.select_related("created_by", "course").get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "DELETE":
        assignment.delete()
        return ok({"message": "Assignment deleted"})

    if request.method == "PATCH":
        serializer = AssignmentWriteSerializer(instance=assignment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for key, value in serializer.validated_data.items():
            setattr(assignment, key, value)
        assignment.save(update_fields=list(serializer.validated_data.keys()) + ["updated_at"])
        return ok(assignment_payload(assignment))

    return ok(assignment_payload(assignment))


@api_view(["PUT"])
@permission_classes([IsInstructor])
def admin_structure(request, assignment_id: int):
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    serializer = StructurePayloadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    replace_assignment_structure(assignment, serializer.validated_data["models"])
    return ok(assignment_payload(assignment))


@api_view(["POST"])
@permission_classes([IsInstructor])
def admin_publish(request, assignment_id: int):
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    published = assignment.models.filter(is_published=True)
    if not published.exists():
        return Response(
            {"data": None, "error": "Publish at least one model first"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    for model in published:
        questions = sum(len(step.questions.all()) for step in collect_leaf_steps(model))
        if questions == 0:
            return Response(
                {"data": None, "error": f"{model.name} has no questions"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    assignment.status = Assignment.Status.PUBLISHED
    assignment.published_at = timezone.now()
    assignment.save(update_fields=["status", "published_at", "updated_at"])
    return ok({"status": assignment.status})


@api_view(["POST"])
@permission_classes([IsInstructor])
def admin_unpublish(request, assignment_id: int):
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    assignment.status = Assignment.Status.DRAFT
    assignment.save(update_fields=["status", "updated_at"])
    return ok({"status": assignment.status})


@api_view(["POST"])
@permission_classes([IsInstructor])
def admin_duplicate(request, assignment_id: int):
    try:
        assignment = Assignment.objects.select_related("created_by").get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response(
            {"data": None, "error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND
        )
    clone = save_assignment_fields(
        None,
        {
            "title": f"{assignment.title} (copy)",
            "description": assignment.description,
            "instructions": assignment.instructions,
            "difficulty": assignment.difficulty,
            "inter_category_id": assignment.inter_category_id,
            "course_id": assignment.course_id,
            "access_type": assignment.access_type,
            "security": assignment.security,
            "results": assignment.results,
            "marks_per_correct": assignment.marks_per_correct,
            "negative_marking": assignment.negative_marking,
            "negative_marks_per_wrong": assignment.negative_marks_per_wrong,
            "marks_unanswered": assignment.marks_unanswered,
            "passing_percentage": assignment.passing_percentage,
            "max_attempts": assignment.max_attempts,
            "randomize_questions": assignment.randomize_questions,
            "randomize_options": assignment.randomize_options,
        },
        request.user,
    )
    canonical = assignment_payload(assignment, include_models=True)["models"]
    replace_assignment_structure(clone, canonical)
    return ok({"id": clone.id, "title": clone.title})


@api_view(["POST", "PUT"])
@permission_classes([IsInstructor])
def admin_generate_questions(request):
    return ok(generate_questions_from_document(request.data))


@api_view(["POST"])
@permission_classes([IsInstructor])
def admin_regenerate_question(request):
    source = request.data.get("question") or request.data
    return ok(regenerate_question(source))


@api_view(["POST"])
@permission_classes([IsInstructor])
def admin_regenerate_options(request):
    source = request.data.get("question") or request.data
    return ok(regenerate_options(source))


@api_view(["GET"])
@permission_classes([IsInstructor])
def admin_attempts(request, assignment_id: int):
    qs = (
        AssignmentAttempt.objects.filter(assignment_id=assignment_id)
        .select_related("learner", "model")
        .order_by("-created_at")
    )
    paged = paginate_queryset_view(request, qs, AttemptSerializer)
    if paged is not None:
        return paged
    return ok(AttemptSerializer(qs[:200], many=True).data)


# ---------------------------------------------------------------------------
# Hierarchy management (admin)
# ---------------------------------------------------------------------------


def _page_status(data):
    data["is_active"] = data.get("is_active", True)
    data["position"] = data.get("position", 0)
    return data


@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def categories(request):
    if request.method == "POST":
        payload = _page_status(request.data)
        cat = Category.objects.create(created_by=request.user, **payload)
        return ok(_category(cat))
    qs = Category.objects.prefetch_related("subcategories__intercategories").order_by(
        "position", "name"
    )
    return ok(_category(q) for q in qs)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsInstructor])
def category_detail(request, category_id: int):
    try:
        cat = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {"data": None, "error": "Category not found"}, status=status.HTTP_404_NOT_FOUND
        )
    if request.method == "DELETE":
        cat.delete()
        return ok({"message": "Category deleted"})
    if request.method == "PATCH":
        payload = {k: v for k, v in request.data.items() if k in ("name", "is_active", "position")}
        for key, value in payload.items():
            setattr(cat, key, value)
        cat.save()
        return ok(_category(cat))
    return ok(_category(cat))


@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def sub_categories(request):
    if request.method == "POST":
        payload = _page_status(request.data)
        try:
            cat = Category.objects.get(id=payload["category_id"])
        except Category.DoesNotExist:
            return Response(
                {"data": None, "error": "Category not found"}, status=status.HTTP_400_BAD_REQUEST
            )
        create_payload = dict(payload)
        create_payload.pop("category_id", None)
        sub = SubCategory.objects.create(category=cat, created_by=request.user, **create_payload)
        return ok(_sub_category(sub))
    category_id = request.query_params.get("category_id")
    qs = SubCategory.objects.select_related("category").order_by("position", "name")
    if category_id and category_id.isdigit():
        qs = qs.filter(category_id=category_id)
    return ok(_sub_category(q) for q in qs)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsInstructor])
def sub_category_detail(request, sub_category_id: int):
    try:
        sub = SubCategory.objects.select_related("category").get(id=sub_category_id)
    except SubCategory.DoesNotExist:
        return Response(
            {"data": None, "error": "Sub category not found"}, status=status.HTTP_404_NOT_FOUND
        )
    if request.method == "DELETE":
        sub.delete()
        return ok({"message": "Sub category deleted"})
    if request.method == "PATCH":
        payload = {
            k: v
            for k, v in request.data.items()
            if k in ("name", "is_active", "position", "category_id")
        }
        if "category_id" in payload:
            try:
                payload["category"] = Category.objects.get(id=payload.pop("category_id"))
            except Category.DoesNotExist:
                return Response(
                    {"data": None, "error": "Category not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        for key, value in payload.items():
            setattr(sub, key, value)
        sub.save()
        return ok(_sub_category(sub))
    return ok(_sub_category(sub))


@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def inter_categories(request):
    if request.method == "POST":
        payload = _page_status(request.data)
        try:
            sub = SubCategory.objects.get(id=payload["sub_category_id"])
        except SubCategory.DoesNotExist:
            return Response(
                {"data": None, "error": "Sub category not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        create_payload = dict(payload)
        create_payload.pop("sub_category_id", None)
        inter = InterCategory.objects.create(
            sub_category=sub, created_by=request.user, **create_payload
        )
        return ok(_inter_category(inter))
    sub_category_id = request.query_params.get("sub_category_id")
    qs = InterCategory.objects.select_related("sub_category__category").order_by("position", "name")
    if sub_category_id and sub_category_id.isdigit():
        qs = qs.filter(sub_category_id=sub_category_id)
    return ok(_inter_category(q) for q in qs)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsInstructor])
def inter_category_detail(request, inter_category_id: int):
    try:
        inter = InterCategory.objects.select_related("sub_category__category").get(
            id=inter_category_id
        )
    except InterCategory.DoesNotExist:
        return Response(
            {"data": None, "error": "Inter category not found"}, status=status.HTTP_404_NOT_FOUND
        )
    if request.method == "DELETE":
        inter.delete()
        return ok({"message": "Inter category deleted"})
    if request.method == "PATCH":
        payload = {
            k: v
            for k, v in request.data.items()
            if k in ("name", "is_active", "position", "sub_category_id")
        }
        if "sub_category_id" in payload:
            try:
                payload["sub_category"] = SubCategory.objects.get(id=payload.pop("sub_category_id"))
            except SubCategory.DoesNotExist:
                return Response(
                    {"data": None, "error": "Sub category not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        for key, value in payload.items():
            setattr(inter, key, value)
        inter.save()
        return ok(_inter_category(inter))
    return ok(_inter_category(inter))


def _category(cat) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "is_active": cat.is_active,
        "position": cat.position,
        "subcategories_count": cat.subcategories.count(),
    }


def _sub_category(sub) -> dict:
    return {
        "id": sub.id,
        "name": sub.name,
        "is_active": sub.is_active,
        "position": sub.position,
        "category_id": sub.category_id,
        "category": sub.category.name,
        "intercategories_count": sub.intercategories.count(),
    }


def _inter_category(inter) -> dict:
    return {
        "id": inter.id,
        "name": inter.name,
        "is_active": inter.is_active,
        "position": inter.position,
        "sub_category_id": inter.sub_category_id,
        "sub_category": inter.sub_category.name,
        "assignments_count": inter.assignments.count(),
    }
