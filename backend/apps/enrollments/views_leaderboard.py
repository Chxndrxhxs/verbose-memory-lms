from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course
from apps.users.models import User

from .services_leaderboard import compute_leaderboard


def _distinct_cities():
    return list(
        User.objects.filter(role=User.Role.LEARNER)
        .exclude(city="")
        .values_list("city", flat=True)
        .distinct()
        .order_by("city")[:50]
    )


def _distinct_categories():
    return list(
        Course.objects.exclude(category="")
        .values_list("category", flat=True)
        .distinct()
        .order_by("category")[:50]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboard_view(request):
    city = request.query_params.get("city")
    category = request.query_params.get("category")
    season = request.query_params.get("season") or "current"
    ordering = request.query_params.get("ordering") or "rank"
    page_raw = request.query_params.get("page") or "1"
    try:
        page = max(1, int(page_raw))
    except ValueError:
        page = 1
    page_size = 12

    entries, season_label, _since, _until = compute_leaderboard(
        city=city, category=category, season=season, ordering=ordering
    )

    total = len(entries)
    pages = (total + page_size - 1) // page_size if total else 1
    page = min(page, pages)
    start = (page - 1) * page_size
    end = start + page_size
    page_entries = entries[start:end]

    data = []
    for e in page_entries:
        u = e["learner"]
        data.append(
            {
                "rank": e["rank"],
                "rr": e["rr"],
                "tier": e["tier"],
                "learner": {
                    "id": u.id,
                    "name": u.get_full_name() or u.username,
                    "avatar": u.avatar or "",
                    "city": u.city or "",
                },
                "breakdown": e["breakdown"],
                "stats": {
                    "quiz_accuracy": e["quiz_accuracy"],
                    "completion_rate": e["completion_rate"],
                    "certificates": e["certificates"],
                    "streak": e["streak"],
                    "lessons_completed": e["lessons_completed"],
                },
            }
        )

    me = None
    for e in entries:
        if e["learner"].id == request.user.id:
            u = e["learner"]
            me = {
                "rank": e["rank"],
                "rr": e["rr"],
                "tier": e["tier"],
                "learner": {
                    "id": u.id,
                    "name": u.get_full_name() or u.username,
                    "avatar": u.avatar or "",
                    "city": u.city or "",
                },
                "breakdown": e["breakdown"],
                "stats": {
                    "quiz_accuracy": e["quiz_accuracy"],
                    "completion_rate": e["completion_rate"],
                    "certificates": e["certificates"],
                    "streak": e["streak"],
                    "lessons_completed": e["lessons_completed"],
                },
            }
            break

    return Response(
        {
            "data": data,
            "error": None,
            "meta": {
                "page": page,
                "total": total,
                "pages": pages,
                "season": season_label,
                "cities": _distinct_cities(),
                "categories": _distinct_categories(),
            },
            "me": me,
        }
    )
