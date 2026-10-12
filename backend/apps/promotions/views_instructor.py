from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.promotions.models import Coupon
from apps.promotions.serializers import CouponSerializer
from apps.users.permissions import RequireCompleteProfile
from core.pagination import paginate_queryset_view


def _can_manage(user) -> bool:
    return bool(user.role in ("instructor", "admin") or user.is_staff)


def _error(message: str, code: int = status.HTTP_403_FORBIDDEN):
    return Response({"data": None, "error": message}, status=code)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def instructor_coupons_list(request):
    user = request.user
    if not _can_manage(user):
        return _error("Instructor access required")
    if request.method == "POST":
        serializer = CouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        applies_to = serializer.validated_data.get("applies_to", Coupon.Scope.ALL)
        course = serializer.validated_data.get("course")
        # Instructors may only discount their own catalog, never store-wide.
        if applies_to != Coupon.Scope.COURSE or course is None:
            return _error(
                "Instructor coupons must target one of your courses.",
                status.HTTP_400_BAD_REQUEST,
            )
        if course.instructor_id != user.id and not user.is_staff:
            return _error("You can only add coupons to your own courses.")
        serializer.save(created_by=user)
        return Response(
            {"data": serializer.data, "error": None},
            status=status.HTTP_201_CREATED,
        )
    qs = Coupon.objects.filter(created_by=user).order_by("-created_at")
    q = request.query_params.get("q", "").strip()
    if q:
        qs = qs.filter(code__icontains=q.upper())
    is_active = request.query_params.get("is_active")
    if is_active in ("true", "false"):
        qs = qs.filter(is_active=is_active == "true")
    paged = paginate_queryset_view(request, qs, CouponSerializer)
    if paged is not None:
        return paged
    return Response({"data": CouponSerializer(qs, many=True).data, "error": None})


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated, RequireCompleteProfile])
def instructor_coupon_detail(request, coupon_id: int):
    user = request.user
    if not _can_manage(user):
        return _error("Instructor access required")
    try:
        coupon = Coupon.objects.get(id=coupon_id)
    except Coupon.DoesNotExist:
        return _error("Coupon not found", status.HTTP_404_NOT_FOUND)
    if coupon.created_by_id != user.id and not user.is_staff:
        return _error("You can only manage your own coupons.")
    if request.method == "DELETE":
        coupon.delete()
        return Response({"data": {"message": "Coupon deleted"}, "error": None})
    if request.method == "PATCH":
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        applies_to = serializer.validated_data.get("applies_to", coupon.applies_to)
        if applies_to != Coupon.Scope.COURSE:
            return _error(
                "Instructor coupons must target one of your courses.",
                status.HTTP_400_BAD_REQUEST,
            )
        course = serializer.validated_data.get("course", coupon.course)
        if course is not None and course.instructor_id != user.id and not user.is_staff:
            return _error("You can only add coupons to your own courses.")
        serializer.save()
        return Response({"data": serializer.data, "error": None})
    return Response({"data": CouponSerializer(coupon).data, "error": None})
