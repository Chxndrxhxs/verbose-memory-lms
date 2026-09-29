import logging
from collections import Counter
from datetime import datetime, time, timedelta

from django.utils import timezone

from apps.courses.models import Course, Lesson

from .models import ActivityEvent, Enrollment, LessonCompletion

logger = logging.getLogger(__name__)


def log_event(learner, verb: str, *, course=None, lesson=None, meta=None) -> ActivityEvent:
    event = ActivityEvent.objects.create(
        learner=learner,
        verb=verb,
        course=course,
        lesson=lesson,
        meta=meta or {},
    )
    logger.info("Activity: %s %s course=%s lesson=%s", learner.mobile, verb, course, lesson)
    return event


def _normalize_text(value) -> str:
    import re

    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _quiz_option_text(option) -> str:
    if isinstance(option, str):
        return option
    if isinstance(option, dict):
        return str(option.get("text") or "")
    return str(option or "")


def grade_quiz_answers(quiz_data, answers) -> tuple[int, int]:
    """Grade submitted answers against the lesson's stored answer key.

    `quiz_data` is the lesson's canonical key, `answers` maps question index
    to the learner's answer (option index, or typed text for qa questions).
    Returns (score, total). Unknown shapes score 0 — never trust the client.
    """
    questions = quiz_data if isinstance(quiz_data, list) else []
    total = len(questions)
    if total == 0:
        return 0, 0
    lookup = answers if isinstance(answers, dict) else {}
    score = 0
    for index, question in enumerate(questions):
        if not isinstance(question, dict):
            continue
        key = str(index)
        raw = lookup.get(key, lookup.get(index))
        if question.get("type") == "qa":
            expected = _normalize_text(question.get("answer"))
            given = _normalize_text(raw) if isinstance(raw, str) else ""
            if expected and given == expected:
                score += 1
            continue
        try:
            correct = int(question.get("correct", -1))
        except (TypeError, ValueError):
            continue
        try:
            given = int(raw) if not isinstance(raw, bool) else -1
        except (TypeError, ValueError):
            continue
        options = question.get("options") or []
        if 0 <= given < len(options) and given == correct:
            score += 1
    return score, total


def enroll(learner, course: Course) -> Enrollment:
    enrollment, created = Enrollment.objects.get_or_create(learner=learner, course=course)
    logger.info("User %s enrolled in %s", learner.mobile, course.id)
    if created:
        log_event(learner, ActivityEvent.Verb.ENROLLED, course=course)
    return enrollment


def record_completion(learner, lesson: Lesson) -> LessonCompletion:
    completion, created = LessonCompletion.objects.get_or_create(learner=learner, lesson=lesson)
    if created:
        logger.info("User %s completed lesson %s", learner.mobile, lesson.id)
    return completion


def mark_lesson_done(learner, course: Course, lesson: Lesson) -> Enrollment:
    record_completion(learner, lesson)
    log_event(learner, ActivityEvent.Verb.COMPLETED_LESSON, course=course, lesson=lesson)
    enrollment = Enrollment.objects.get(learner=learner, course=course)
    lid = int(lesson.id)
    if lid not in enrollment.completed_lessons:
        enrollment.completed_lessons.append(lid)
        total = Lesson.objects.filter(section__course=course).count()
        done = len(enrollment.completed_lessons)
        enrollment.progress = int(done / total * 100) if total else 0
        enrollment.save(update_fields=["completed_lessons", "progress"])
    return enrollment


def _today_ist():
    return timezone.localtime(timezone.now()).date()


def activity_last_six_months(learner) -> list[dict]:
    today = _today_ist()
    start = today - timedelta(days=26 * 7 - 1)
    start_dt = timezone.make_aware(datetime.combine(start, time.min))
    qs = LessonCompletion.objects.filter(learner=learner, completed_at__gte=start_dt).values_list(
        "completed_at", flat=True
    )
    counts = Counter(timezone.localtime(ts).date().isoformat() for ts in qs)
    return [{"date": d, "count": counts.get(d, 0)} for d in _date_iter(start)]


def _date_iter(start):
    today = _today_ist()
    days = (today - start).days + 1
    return [(start + timedelta(days=i)).isoformat() for i in range(days)]
