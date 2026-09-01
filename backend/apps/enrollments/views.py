from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course, Lesson

from .models import Enrollment
from .serializers import EnrollmentSerializer
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
    if lesson_id not in enrollment.completed_lessons:
        enrollment.completed_lessons.append(int(lesson_id))
        enrollment.save(update_fields=["completed_lessons"])
    return Response({"data": EnrollmentSerializer(enrollment).data, "error": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_activity(request):
    return Response({"data": activity_last_six_months(request.user), "error": None})
