from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from apps.courses.models import Course
from apps.courses.services import publish_guard
from apps.enrollments.models import Enrollment
from apps.payments.models import Payment
from apps.promotions.models import Coupon, Gift
from apps.promotions.serializers import CouponSerializer, GiftSerializer
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
    if new_status == Course.Status.PUBLISHED:
        # Same curriculum guard as publish_course(); this endpoint sets
        # status directly so the serializer rule never runs (QA: courses
        # 13/15 went live empty through here).
        try:
            publish_guard(course)
        except ValidationError as e:
            detail = e.detail
            message = str(detail[0]) if isinstance(detail, dict) else str(detail)
            return Response(
                {"data": None, "error": message},
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


@api_view(["GET", "POST"])
@permission_classes([IsAdmin])
def coupons_list(request):
    if request.method == "POST":
        serializer = CouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(
            {"data": serializer.data, "error": None},
            status=status.HTTP_201_CREATED,
        )
    qs = Coupon.objects.all()
    q = request.query_params.get("q", "").strip()
    if q:
        qs = qs.filter(code__icontains=q.upper())
    is_active = request.query_params.get("is_active")
    if is_active in ("true", "false"):
        qs = qs.filter(is_active=is_active == "true")
    scope = request.query_params.get("applies_to")
    if scope in dict(Coupon.Scope.choices):
        qs = qs.filter(applies_to=scope)
    qs = qs.order_by("-created_at")
    return admin_response(qs, True, CouponSerializer, request)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdmin])
def coupon_detail(request, coupon_id: int):
    try:
        coupon = Coupon.objects.get(id=coupon_id)
    except Coupon.DoesNotExist:
        return Response(
            {"data": None, "error": "Coupon not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    if request.method == "DELETE":
        coupon.delete()
        return Response({"data": {"message": "Coupon deleted"}, "error": None})
    if request.method == "PATCH":
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data, "error": None})
    return Response({"data": CouponSerializer(coupon).data, "error": None})


@api_view(["GET"])
@permission_classes([IsAdmin])
def gifts_list(request):
    from django.db.models import Q

    qs = Gift.objects.select_related("giver", "course", "pack").all()
    q = request.query_params.get("q", "").strip()
    if q:
        qs = qs.filter(
            Q(code__icontains=q.upper())
            | Q(recipient_email__icontains=q)
            | Q(giver__mobile__icontains=q)
        )
    gift_status = request.query_params.get("status")
    if gift_status in dict(Gift.Status.choices):
        qs = qs.filter(status=gift_status)
    qs = qs.order_by("-created_at")
    return admin_response(qs, True, GiftSerializer, request)
