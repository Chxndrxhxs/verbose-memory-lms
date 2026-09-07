from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.payments.models import Payment
from core.pagination import EnvelopePagination

from .permissions import IsAdmin
from .serializers import (
    AdminCourseDetailSerializer,
    AdminCourseListSerializer,
    AdminEnrollmentSerializer,
    AdminPaymentSerializer,
    AdminUserSerializer,
    section_payload,
)
from .services import (
    course_search_qs,
    dashboard_stats,
    delete_course,
    delete_user,
    enrollment_search_qs,
    payment_search_qs,
    update_user,
    user_search_qs,
)

User = get_user_model()


class AdminPagination(EnvelopePagination):
    page_size = 20
    page_size_query_param = "page_size"


def admin_response(data, many, serializer_class, request):
    paginator = AdminPagination()
    page = paginator.paginate_queryset(data, request)
    if page is None:
        return Response({"data": serializer_class(data, many=many).data, "error": None})
    return paginator.get_paginated_response(serializer_class(page, many=many).data)


@api_view(["GET"])
@permission_classes([IsAdmin])
def dashboard(request):
    return Response({"data": dashboard_stats(), "error": None})


@api_view(["GET"])
@permission_classes([IsAdmin])
def users_list(request):
    qs = user_search_qs(request.query_params.get("q", "").strip())
    role = request.query_params.get("role")
    if role in dict(User.Role.choices):
        qs = qs.filter(role=role)
    qs = qs.order_by("-date_joined")
    return admin_response(qs, True, AdminUserSerializer, request)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdmin])
def user_detail(request, user_id: int):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"data": None, "error": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        delete_user(user)
        return Response({"data": {"message": "User deleted"}, "error": None})

    if request.method == "PATCH":
        serializer = AdminUserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = dict(serializer.validated_data)
        if isinstance(request.data.get("name"), str):
            updates["name"] = request.data["name"]
        update_user(user, updates)
        return Response({"data": AdminUserSerializer(user).data, "error": None})

    enrollments = Enrollment.objects.filter(learner=user).select_related(
        "course", "course__instructor"
    )
    payments = Payment.objects.filter(user=user).select_related("course").order_by("-created_at")
    return Response(
        {
            "data": {
                "user": AdminUserSerializer(user).data,
                "enrollments": AdminEnrollmentSerializer(enrollments, many=True).data,
                "payments": AdminPaymentSerializer(payments, many=True).data,
            },
            "error": None,
        }
    )


@api_view(["GET"])
@permission_classes([IsAdmin])
def courses_list(request):
    qs = course_search_qs(request.query_params.get("q", "").strip())
    page_status = request.query_params.get("status")
    if page_status in dict(Course.Status.choices):
        qs = qs.filter(status=page_status)
    category = request.query_params.get("category")
    if category:
        qs = qs.filter(category=category)
    qs = qs.order_by("-created_at")
    return admin_response(qs, True, AdminCourseListSerializer, request)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdmin])
def course_detail(request, course_id: int):
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {"data": None, "error": "Course not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        delete_course(course)
        return Response({"data": {"message": "Course deleted"}, "error": None})

    if request.method == "PATCH":
        serializer = AdminCourseDetailSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": AdminCourseDetailSerializer(course).data, "error": None})

    return Response(
        {
            "data": {
                "course": AdminCourseDetailSerializer(course).data,
                "sections": section_payload(course),
            },
            "error": None,
        }
    )


@api_view(["POST"])
@permission_classes([IsAdmin])
def course_status(request, course_id: int):
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {"data": None, "error": "Course not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    new_status = request.data.get("status")
    if new_status not in dict(Course.Status.choices):
        return Response(
            {"data": None, "error": "status must be 'published' or 'draft'"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    course.status = new_status
    course.save(update_fields=["status", "updated_at"])
    return Response({"data": AdminCourseDetailSerializer(course).data, "error": None})


@api_view(["GET"])
@permission_classes([IsAdmin])
def enrollments_list(request):
    qs = enrollment_search_qs(request.query_params.get("q", "").strip())
    course_id = request.query_params.get("course_id")
    if course_id and course_id.isdigit():
        qs = qs.filter(course_id=course_id)
    learner_id = request.query_params.get("learner_id")
    if learner_id and learner_id.isdigit():
        qs = qs.filter(learner_id=learner_id)
    progress = request.query_params.get("progress")
    if progress == "done":
        qs = qs.filter(progress=100)
    elif progress == "active":
        qs = qs.exclude(progress=100)
    qs = qs.order_by("-enrolled_at")
    return admin_response(qs, True, AdminEnrollmentSerializer, request)


@api_view(["DELETE"])
@permission_classes([IsAdmin])
def enrollment_delete(request, enrollment_id: int):
    try:
        enrollment = Enrollment.objects.get(id=enrollment_id)
    except Enrollment.DoesNotExist:
        return Response(
            {"data": None, "error": "Enrollment not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    enrollment.delete()
    return Response({"data": {"message": "Enrollment removed"}, "error": None})


@api_view(["GET"])
@permission_classes([IsAdmin])
def payments_list(request):
    qs = payment_search_qs(request.query_params.get("q", "").strip())
    pg_status = request.query_params.get("status")
    if pg_status in dict(Payment.Status.choices):
        qs = qs.filter(status=pg_status)
    qs = qs.order_by("-created_at")
    return admin_response(qs, True, AdminPaymentSerializer, request)
