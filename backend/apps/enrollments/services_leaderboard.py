import calendar
import datetime
import re
from collections import defaultdict
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from apps.courses.models import Lesson
from apps.users.models import User

from .models import ActivityEvent, Certificate, Enrollment, LessonCompletion

CERT_CAP = 5
STREAK_CAP = 30

TIER_THRESHOLDS = [
    (980, "Radiant"),
    (930, "Immortal"),
    (850, "Ascendant"),
    (730, "Diamond"),
    (600, "Platinum"),
    (450, "Gold"),
    (300, "Silver"),
    (150, "Bronze"),
    (0, "Iron"),
]

TIER_ORDER = {t: i for i, (_, t) in enumerate(reversed(TIER_THRESHOLDS))}


def tier_from_rr(rr: int) -> str:
    for threshold, tier in TIER_THRESHOLDS:
        if rr >= threshold:
            return tier
    return "Iron"


def _now_ist():
    return timezone.localtime(timezone.now())


def _season_window(season: str | None):
    now = _now_ist()
    if not season or season in ("current", "Current"):
        since = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if since.month == 12:
            until = since.replace(year=since.year + 1, month=1)
        else:
            until = since.replace(month=since.month + 1)
        lbl = f"{since.year}-{since.month:02d}"
        return since.astimezone(datetime.UTC), until.astimezone(datetime.UTC), lbl
    if season in ("alltime", "all-time", "all", "All Time"):
        return None, None, "alltime"
    m = re.match(r"^(\d{4})-(\d{2})$", season)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12:
            since = timezone.make_aware(datetime.datetime(y, mo, 1))
            last_day = calendar.monthrange(y, mo)[1]
            until = since + timedelta(days=last_day)
            return since, until, season
    since = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if since.month == 12:
        until = since.replace(year=since.year + 1, month=1)
    else:
        until = since.replace(month=since.month + 1)
    lbl = f"{since.year}-{since.month:02d}"
    return since.astimezone(datetime.UTC), until.astimezone(datetime.UTC), lbl


def _compute_quiz_accuracy_map(learner_ids, since, until):
    qs = ActivityEvent.objects.filter(
        learner_id__in=learner_ids,
        verb=ActivityEvent.Verb.QUIZ_ATTEMPT,
        lesson__isnull=False,
    )
    if since:
        qs = qs.filter(created_at__gte=since)
    if until:
        qs = qs.filter(created_at__lt=until)
    qs = qs.values("learner_id", "lesson_id", "meta")
    best_per_lesson: dict[tuple[int, int], float] = {}
    for row in qs:
        learner_id = row["learner_id"]
        lesson_id = row["lesson_id"]
        meta = row["meta"] or {}
        try:
            score = int(meta.get("score", 0))
            total = int(meta.get("total", 0))
        except Exception:
            continue
        if total <= 0:
            continue
        ratio = score / total
        key = (learner_id, lesson_id)
        if key not in best_per_lesson or ratio > best_per_lesson[key]:
            best_per_lesson[key] = ratio
    per_learner: dict[int, list[float]] = defaultdict(list)
    for (learner_id, _), ratio in best_per_lesson.items():
        per_learner[learner_id].append(ratio)
    result: dict[int, float] = {}
    for lid in learner_ids:
        ratios = per_learner.get(lid, [])
        result[lid] = sum(ratios) / len(ratios) if ratios else 0.0
    return result


def _completion_count_map(learner_ids, since, until):
    qs = LessonCompletion.objects.filter(learner_id__in=learner_ids)
    if since:
        qs = qs.filter(completed_at__gte=since)
    if until:
        qs = qs.filter(completed_at__lt=until)
    qs = qs.values("learner_id").annotate(cnt=Count("id"))
    return {r["learner_id"]: r["cnt"] for r in qs}


def _certificate_count_map(learner_ids, since, until):
    qs = Certificate.objects.filter(learner_id__in=learner_ids)
    if since:
        qs = qs.filter(issued_at__gte=since)
    if until:
        qs = qs.filter(issued_at__lt=until)
    qs = qs.values("learner_id").annotate(cnt=Count("id"))
    return {r["learner_id"]: r["cnt"] for r in qs}


def _total_lessons_map(learner_ids):
    enrollments = Enrollment.objects.filter(learner_id__in=learner_ids).values(
        "learner_id", "course_id"
    )
    course_ids = {r["course_id"] for r in enrollments}
    if not course_ids:
        return {lid: 0 for lid in learner_ids}
    lesson_counts = (
        Lesson.objects.filter(section__course_id__in=course_ids)
        .values("section__course_id")
        .annotate(cnt=Count("id"))
    )
    course_lesson_count = {r["section__course_id"]: r["cnt"] for r in lesson_counts}
    per_learner_courses: dict[int, set[int]] = defaultdict(set)
    for r in enrollments:
        per_learner_courses[r["learner_id"]].add(r["course_id"])
    result = {}
    for lid in learner_ids:
        courses = per_learner_courses.get(lid, set())
        result[lid] = sum(course_lesson_count.get(cid, 0) for cid in courses)
    return result


def _streak_map(learner_ids, since, until):
    learner_ids = list(learner_ids)
    if not learner_ids:
        return {}
    lc_qs = LessonCompletion.objects.filter(learner_id__in=learner_ids)
    if since:
        lc_qs = lc_qs.filter(completed_at__gte=since)
    if until:
        lc_qs = lc_qs.filter(completed_at__lt=until)
    lc_qs = lc_qs.values("learner_id", "completed_at")
    quiz_qs = ActivityEvent.objects.filter(
        learner_id__in=learner_ids, verb=ActivityEvent.Verb.QUIZ_ATTEMPT
    )
    if since:
        quiz_qs = quiz_qs.filter(created_at__gte=since)
    if until:
        quiz_qs = quiz_qs.filter(created_at__lt=until)
    quiz_qs = quiz_qs.values("learner_id", "created_at")
    dates_per_learner: dict[int, set] = defaultdict(set)
    for r in lc_qs:
        d = r["completed_at"]
        if d:
            dates_per_learner[r["learner_id"]].add(timezone.localtime(d).date().isoformat())
    for r in quiz_qs:
        d = r["created_at"]
        if d:
            dates_per_learner[r["learner_id"]].add(timezone.localtime(d).date().isoformat())
    today = timezone.localtime(timezone.now()).date()
    result = {}
    for lid in learner_ids:
        dates = dates_per_learner.get(lid, set())
        if not dates:
            result[lid] = 0
            continue
        sorted_dates = sorted(dates)
        date_set = set(sorted_dates)
        streak = 0
        cursor = today
        if cursor.isoformat() not in date_set:
            cursor = today - timedelta(days=1)
        while cursor.isoformat() in date_set:
            streak += 1
            cursor -= timedelta(days=1)
        if streak == 0:
            longest = 0
            current = 0
            prev = None
            for ds in sorted_dates:
                cur = datetime.datetime.fromisoformat(ds).date()
                if prev and (cur - prev).days == 1:
                    current += 1
                else:
                    current = 1
                longest = max(longest, current)
                prev = cur
            result[lid] = longest
        else:
            result[lid] = streak
    return result


def _earliest_activity_map(learner_ids, since, until):
    qs = ActivityEvent.objects.filter(learner_id__in=learner_ids)
    if since:
        qs = qs.filter(created_at__gte=since)
    if until:
        qs = qs.filter(created_at__lt=until)
    qs = qs.values("learner_id").annotate(earliest=Count("id"))
    return {}


def compute_leaderboard(
    city=None, category=None, season=None, ordering="rank", *, my_students=False, request_user=None
):
    since, until, season_label = _season_window(season)
    if my_students and request_user is not None:
        learners = User.objects.filter(
            role=User.Role.LEARNER, enrollments__course__instructor=request_user
        ).distinct()
    else:
        learners = User.objects.filter(role=User.Role.LEARNER)
    if city:
        c = city.strip()
        if c.lower() not in ("all", "all cities"):
            learners = learners.filter(city__iexact=c)
    if category:
        cat = category.strip()
        if cat.lower() not in ("all", "all categories"):
            learners = learners.filter(enrollments__course__category__iexact=cat).distinct()
    learners = learners.order_by("id")
    learner_ids = list(learners.values_list("id", flat=True))
    if not learner_ids:
        return [], season_label, since, until

    quiz_map = _compute_quiz_accuracy_map(learner_ids, since, until)
    completion_counts = _completion_count_map(learner_ids, since, until)
    cert_counts = _certificate_count_map(learner_ids, since, until)
    total_lessons = _total_lessons_map(learner_ids)
    streaks = _streak_map(learner_ids, since, until)

    earliest_map = {}
    agg = ActivityEvent.objects.filter(learner_id__in=learner_ids)
    if since:
        agg = agg.filter(created_at__gte=since)
    if until:
        agg = agg.filter(created_at__lt=until)
    from django.db.models import Min

    for r in agg.values("learner_id").annotate(earliest=Min("created_at")):
        earliest_map[r["learner_id"]] = r["earliest"]

    learners_by_id = {u.id: u for u in learners}

    entries = []
    for lid in learner_ids:
        user = learners_by_id[lid]
        quiz = quiz_map.get(lid, 0.0)
        done = completion_counts.get(lid, 0)
        total = total_lessons.get(lid, 0)
        completion_rate = (done / total) if total else 0.0
        if completion_rate > 1:
            completion_rate = 1.0
        certs = cert_counts.get(lid, 0)
        cert_score = min(certs / CERT_CAP, 1.0)
        streak = streaks.get(lid, 0)
        streak_score = min(streak / STREAK_CAP, 1.0)
        rr = int(round(400 * quiz + 300 * completion_rate + 200 * cert_score + 100 * streak_score))
        rr = max(0, min(1000, rr))
        tier = tier_from_rr(rr)
        entries.append(
            {
                "learner": user,
                "quiz_accuracy": round(quiz, 4),
                "completion_rate": round(completion_rate, 4),
                "certificates": certs,
                "streak": streak,
                "lessons_completed": done,
                "rr": rr,
                "tier": tier,
                "breakdown": {
                    "quiz": round(quiz * 400),
                    "completion": round(completion_rate * 300),
                    "certs": round(cert_score * 200),
                    "streak": round(streak_score * 100),
                },
                "earliest": earliest_map.get(lid),
            }
        )

    if len(entries) >= 200:
        entries_sorted_rr = sorted(entries, key=lambda x: x["rr"], reverse=True)
        radiant_cut = max(1, int(len(entries) * 0.005))
        radiant_rr_threshold = (
            entries_sorted_rr[radiant_cut - 1]["rr"]
            if radiant_cut <= len(entries_sorted_rr)
            else 980
        )
        for e in entries:
            if e["tier"] == "Radiant" and e["rr"] < radiant_rr_threshold:
                e["tier"] = "Immortal"
                e["rr"] = min(e["rr"], 979)

    def sort_key(e):
        if ordering == "quiz_accuracy":
            return (-e["quiz_accuracy"], -e["rr"])
        if ordering == "-quiz_accuracy":
            return (-e["quiz_accuracy"], -e["rr"])
        if ordering in ("completion", "-completion", "completion_rate"):
            return (-e["completion_rate"], -e["rr"])
        if ordering in ("certificates", "-certificates", "certs"):
            return (-e["certificates"], -e["rr"])
        if ordering in ("streak", "-streak"):
            return (-e["streak"], -e["rr"])
        if ordering in ("-rr", "rr"):
            return (-e["rr"], -e["quiz_accuracy"], -e["certificates"])
        return (-e["rr"], -e["quiz_accuracy"], -e["certificates"])

    entries.sort(key=sort_key)

    for idx, e in enumerate(entries, start=1):
        e["rank"] = idx

    if ordering not in ("rank", None, ""):
        pass
    else:
        entries.sort(key=lambda x: x["rank"])

    return entries, season_label, since, until
