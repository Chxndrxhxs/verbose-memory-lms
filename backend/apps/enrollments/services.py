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
    qs = LessonCompletion.objects.filter(
        learner=learner, completed_at__gte=start_dt
    ).values_list("completed_at", flat=True)
    counts = Counter(timezone.localtime(ts).date().isoformat() for ts in qs)
    return [{"date": d, "count": counts.get(d, 0)} for d in _date_iter(start)]


def _date_iter(start):
    today = _today_ist()
    days = (today - start).days + 1
    return [(start + timedelta(days=i)).isoformat() for i in range(days)]
