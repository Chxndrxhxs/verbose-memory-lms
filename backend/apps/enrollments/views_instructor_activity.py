from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import paginate_queryset_view

from .models import ActivityEvent
from .serializers import InstructorActivitySerializer

ALLOWED_VERBS = {c[0] for c in ActivityEvent.Verb.choices}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def instructor_activity(request):
    user = request.user
    if user.role not in ("instructor", "admin") and not user.is_staff:
        return Response(
            {"data": None, "error": "Instructor access required"},
            status=403,
        )

    qs = (
        ActivityEvent.objects.filter(course__instructor=user)
        .select_related("course", "lesson", "learner")
        .order_by("-created_at")
    )

    course_id = request.query_params.get("course_id")
    if course_id:
        try:
            cid = int(course_id)
        except (TypeError, ValueError):
            return Response({"data": None, "error": "Invalid course_id"}, status=400)
        qs = qs.filter(course_id=cid, course__instructor=user)

    verb = request.query_params.get("verb")
    if verb and verb != "all":
        if verb not in ALLOWED_VERBS:
            return Response({"data": None, "error": "Invalid verb"}, status=400)
        qs = qs.filter(verb=verb)

    paged = paginate_queryset_view(request, qs, InstructorActivitySerializer)
    if paged is not None:
        return paged
    return Response(
        {"data": InstructorActivitySerializer(qs[:100], many=True).data, "error": None}
    )
