from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course, Lesson

from .models import Certificate, Enrollment
from .serializers import CertificateSerializer, EnrollmentSerializer
from .services import activity_last_six_months, enroll, record_completion


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
    record_completion(request.user, lesson)
    lid = int(lesson_id)
    if lid not in enrollment.completed_lessons:
        enrollment.completed_lessons.append(lid)
        total = Lesson.objects.filter(section__course_id=course_id).count()
        enrollment.progress = int(len(enrollment.completed_lessons) / total * 100) if total else 0
        enrollment.save(update_fields=["completed_lessons", "progress"])
    return Response({"data": EnrollmentSerializer(enrollment).data, "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_activity(request):
    return Response({"data": activity_last_six_months(request.user), "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_certificates(request):
    qs = Certificate.objects.filter(
        learner=request.user
    ).select_related("course", "enrollment").order_by("-issued_at")
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
    return Response({"data": CertificateSerializer(cert).data, "error": None})
