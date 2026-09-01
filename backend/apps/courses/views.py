from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Course
from .serializers import CourseDetailSerializer, CourseListSerializer
from .services import create_course, publish_course, save_uploaded_file


class IsInstructorOrReadOnly(IsAuthenticatedOrReadOnly):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return obj.instructor_id == request.user.id


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstructorOrReadOnly]
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
            return Response(
                {
                    "data": {
                        "results": s.data,
                        "count": self.paginator.page.paginator.count,
                        "page": request.GET.get("page", 1),
                    },
                    "error": None,
                }
            )
        return Response({"data": s.data, "error": None})

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.status == Course.Status.DRAFT:
            if not request.user.is_authenticated or not (
                request.user.is_staff or obj.instructor_id == request.user.id
            ):
                from rest_framework.exceptions import NotFound

                raise NotFound("Course not found")
        return Response({"data": self.get_serializer(obj).data, "error": None})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, id=None):
        course = self.get_object()
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
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied
        sections = request.data.get("sections", [])
        from .models import Lesson, Section

        # replace curriculum
        course.sections.all().delete()
        for si, sec in enumerate(sections):
            s = Section.objects.create(
                course=course,
                title=sec.get("title", f"Section {si + 1}"),
                order=si,
            )
            for li, les in enumerate(sec.get("lessons", [])):
                Lesson.objects.create(
                    section=s,
                    title=les.get("title", "Untitled"),
                    kind=les.get("kind", "video"),
                    duration=les.get("duration", ""),
                    resource_url=les.get("resource_url", ""),
                    quiz_data=les.get("quiz_data", []),
                    order=li,
                )
        return Response({"data": CourseDetailSerializer(course).data, "error": None})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mine(self, request):
        qs = Course.objects.filter(instructor=request.user).order_by("-updated_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(CourseListSerializer(page, many=True).data)
        return Response({"data": CourseListSerializer(qs, many=True).data})


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
        return Response(
            {"data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )
    return Response({"data": {"url": url, "size": size}, "error": None})
