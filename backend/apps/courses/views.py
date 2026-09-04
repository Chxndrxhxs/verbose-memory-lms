from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Course
from .serializers import CourseDetailSerializer, CourseListSerializer
from .services import (
    create_course,
    get_user_rating,
    publish_course,
    rate_course,
    replace_curriculum,
    save_uploaded_file,
)


class IsInstructorOrReadOnly(IsAuthenticatedOrReadOnly):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", "") == "instructor" or user.is_staff)
        )

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return obj.instructor_id == request.user.id


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstructorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status"]
    search_fields = ["title", "subtitle"]
    ordering_fields = ["created_at", "price"]
    lookup_field = "id"

    def get_queryset(self):
        qs = Course.objects.select_related("instructor").prefetch_related(
            "sections__lessons",
            "enrollments",
        )
        if self.action == "list" and not self.request.user.is_staff:
            return qs.filter(status=Course.Status.PUBLISHED)
        return qs

    def get_serializer_class(self):
        if self.action in ("retrieve", "update", "partial_update"):
            return CourseDetailSerializer
        return CourseListSerializer

    def perform_create(self, serializer):
        course = create_course(instructor=self.request.user, data=serializer.validated_data)
        serializer.instance = course

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"data": self.get_serializer(serializer.instance).data, "error": None},
            status=201,
        )

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        s = self.get_serializer(page if page is not None else qs, many=True)
        if page is not None:
            total = self.paginator.page.paginator.count
            num = self.paginator.page.number
            return Response(
                {
                    "data": s.data,
                    "error": None,
                    "meta": {"page": num, "total": total},
                }
            )
        return Response({"data": s.data, "error": None})

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.status == Course.Status.DRAFT:
            if not request.user.is_authenticated or not (
                request.user.is_staff or obj.instructor_id == request.user.id
            ):
                raise NotFound("Course not found")
        return Response({"data": self.get_serializer(obj).data, "error": None})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, id=None):
        course = self.get_object()
        if course.instructor_id != request.user.id and not request.user.is_staff:
            raise PermissionDenied("Only the course instructor can publish this course")
        publish_course(course)
        return Response({"data": CourseDetailSerializer(course).data, "error": None})

    @action(
        detail=True,
        methods=["put"],
        permission_classes=[IsAuthenticated],
        url_path="curriculum",
    )
    def curriculum(self, request, id=None):
        course = self.get_object()
        if course.instructor_id != request.user.id:
            raise PermissionDenied
        sections = request.data.get("sections", [])
        replace_curriculum(course, sections)
        return Response({"data": CourseDetailSerializer(course).data, "error": None})

    @action(
        detail=True, methods=["get", "post"], permission_classes=[IsAuthenticated], url_path="rate"
    )
    def rate(self, request, id=None):
        course = self.get_object()
        if request.method == "GET":
            return Response({"data": get_user_rating(course, request.user), "error": None})
        rating = request.data.get("rating")
        try:
            rating_int = int(rating)
        except (TypeError, ValueError):
            return Response(
                {"data": None, "error": "rating must be 1-5"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not 1 <= rating_int <= 5:
            return Response(
                {"data": None, "error": "rating must be 1-5"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from apps.enrollments.models import Enrollment

        if not Enrollment.objects.filter(learner=request.user, course=course).exists():
            return Response(
                {"data": None, "error": "Enroll first"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({"data": rate_course(course, request.user, rating_int), "error": None})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mine(self, request):
        qs = (
            Course.objects.filter(instructor=request.user)
            .select_related("instructor")
            .prefetch_related("sections__lessons")
            .order_by("-updated_at")
        )
        qs = self.filter_queryset(qs)
        page = self.paginate_queryset(qs)
        if page is not None:
            s = CourseListSerializer(page, many=True)
            total = self.paginator.page.paginator.count
            num = self.paginator.page.number
            return Response(
                {
                    "data": s.data,
                    "error": None,
                    "meta": {"page": num, "total": total},
                }
            )
        return Response({"data": CourseListSerializer(qs, many=True).data, "error": None})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload(request):
    file = request.FILES.get("file")
    if not file:
        return Response(
            {"data": None, "error": "Missing 'file' field"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        url, size = save_uploaded_file(file)
    except ValueError as e:
        return Response({"data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"data": {"url": url, "size": size}, "error": None})
