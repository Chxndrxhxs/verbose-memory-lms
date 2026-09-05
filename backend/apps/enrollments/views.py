from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course, Lesson
from core.pagination import paginate_queryset_view

from .models import ActivityEvent, Certificate, Enrollment
from .serializers import ActivityEventSerializer, CertificateSerializer, EnrollmentSerializer
from .services import activity_last_six_months, enroll, log_event, mark_lesson_done


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def enroll_view(request, course_id: int):
    try:
        course = Course.objects.get(id=course_id, status=Course.Status.PUBLISHED)
    except Course.DoesNotExist:
        return Response(
            {"data": None, "error": "Course not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    e = enroll(request.user, course)
    return Response({"data": EnrollmentSerializer(e).data, "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_courses(request):
    qs = (
        Enrollment.objects.filter(learner=request.user)
        .select_related("course")
        .order_by("-enrolled_at")
    )
    paged = paginate_queryset_view(request, qs, EnrollmentSerializer)
    if paged is not None:
        return paged
    return Response({"data": EnrollmentSerializer(qs, many=True).data, "error": None})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_lesson(request, course_id: int):
    lesson_id = request.data.get("lesson_id")
    try:
        enrollment = Enrollment.objects.get(learner=request.user, course_id=course_id)
    except Enrollment.DoesNotExist:
        return Response(
            {"data": None, "error": "Not enrolled"},
            status=status.HTTP_404_NOT_FOUND,
        )
    try:
        lesson = Lesson.objects.get(id=lesson_id, section__course_id=course_id)
    except (Lesson.DoesNotExist, ValueError, TypeError):
        return Response(
            {"data": None, "error": "Lesson not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    enrollment = mark_lesson_done(request.user, enrollment.course, lesson)
    if enrollment.progress >= 100:
        existing = Certificate.objects.filter(learner=request.user, course_id=course_id).first()
        if not existing:
            import uuid

            cert_id = f"QTNXT-{uuid.uuid4().hex[:8].upper()}-{course_id}"
            Certificate.objects.create(
                learner=request.user,
                course_id=course_id,
                enrollment=enrollment,
                certificate_id=cert_id,
            )
            log_event(
                request.user,
                ActivityEvent.Verb.EARNED_CERTIFICATE,
                course=enrollment.course,
                meta={"certificate_id": cert_id},
            )
    return Response({"data": EnrollmentSerializer(enrollment).data, "error": None})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def quiz_attempt(request, course_id: int):
    lesson_id = request.data.get("lesson_id")
    try:
        score = int(request.data.get("score"))
        total = int(request.data.get("total"))
    except (TypeError, ValueError):
        return Response(
            {"data": None, "error": "score and total must be integers"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if total <= 0 or not 0 <= score <= total:
        return Response(
            {"data": None, "error": "score must be between 0 and total"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not Enrollment.objects.filter(learner=request.user, course_id=course_id).exists():
        return Response(
            {"data": None, "error": "Not enrolled"},
            status=status.HTTP_404_NOT_FOUND,
        )
    try:
        lesson = Lesson.objects.get(id=lesson_id, section__course_id=course_id)
    except (Lesson.DoesNotExist, ValueError, TypeError):
        return Response(
            {"data": None, "error": "Lesson not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    if lesson.kind != "quiz":
        return Response(
            {"data": None, "error": "Lesson is not a quiz"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    prior = ActivityEvent.objects.filter(
        learner=request.user, lesson=lesson, verb=ActivityEvent.Verb.QUIZ_ATTEMPT
    )
    attempt = prior.count() + 1
    best = score
    for (meta,) in prior.values_list("meta"):
        if isinstance(meta, dict) and isinstance(meta.get("score"), int):
            best = max(best, meta["score"])
    log_event(
        request.user,
        ActivityEvent.Verb.QUIZ_ATTEMPT,
        course=lesson.section.course,
        lesson=lesson,
        meta={"score": score, "total": total, "attempt": attempt},
    )
    return Response(
        {
            "data": {
                "score": score,
                "total": total,
                "passed": score == total,
                "attempt": attempt,
                "best": best,
            },
            "error": None,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_activity(request):
    return Response({"data": activity_last_six_months(request.user), "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_certificates(request):
    qs = (
        Certificate.objects.filter(learner=request.user)
        .select_related("course", "enrollment")
        .order_by("-issued_at")
    )
    paged = paginate_queryset_view(request, qs, CertificateSerializer)
    if paged is not None:
        return paged
    return Response({"data": CertificateSerializer(qs, many=True).data, "error": None})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_certificate(request, course_id: int):
    try:
        enrollment = Enrollment.objects.get(learner=request.user, course_id=course_id)
    except Enrollment.DoesNotExist:
        return Response({"data": None, "error": "Not enrolled"}, status=status.HTTP_404_NOT_FOUND)
    if enrollment.progress < 100:
        return Response(
            {"data": None, "error": "Complete the course first"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    existing = Certificate.objects.filter(learner=request.user, course_id=course_id).first()
    if existing:
        return Response({"data": CertificateSerializer(existing).data, "error": None})
    import uuid

    cert_id = f"QTNXT-{uuid.uuid4().hex[:8].upper()}-{course_id}"
    cert = Certificate.objects.create(
        learner=request.user,
        course_id=course_id,
        enrollment=enrollment,
        certificate_id=cert_id,
    )
    log_event(
        request.user,
        ActivityEvent.Verb.EARNED_CERTIFICATE,
        course=enrollment.course,
        meta={"certificate_id": cert_id},
    )
    return Response({"data": CertificateSerializer(cert).data, "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_timeline(request):
    qs = (
        ActivityEvent.objects.filter(learner=request.user)
        .select_related("course", "lesson")
        .order_by("-created_at")
    )
    course_id = request.query_params.get("course_id")
    if course_id:
        qs = qs.filter(course_id=course_id)
    verb = request.query_params.get("verb")
    if verb:
        qs = qs.filter(verb=verb)
    paged = paginate_queryset_view(request, qs, ActivityEventSerializer)
    if paged is not None:
        return paged
    return Response({"data": ActivityEventSerializer(qs[:100], many=True).data, "error": None})
