import logging
from collections import Counter
from datetime import timedelta

from django.utils import timezone

from apps.courses.models import Course, Lesson

from .models import Enrollment, LessonCompletion

logger = logging.getLogger(__name__)


def enroll(learner, course: Course) -> Enrollment:
    enrollment, _ = Enrollment.objects.get_or_create(learner=learner, course=course)
    logger.info("User %s enrolled in %s", learner.mobile, course.id)
    return enrollment


def record_completion(learner, lesson: Lesson) -> LessonCompletion:
    completion, created = LessonCompletion.objects.get_or_create(learner=learner, lesson=lesson)
    if created:
        logger.info("User %s completed lesson %s", learner.mobile, lesson.id)
    return completion


def mark_lesson_done(learner, course: Course, lesson: Lesson) -> Enrollment:
    record_completion(learner, lesson)
    enrollment = Enrollment.objects.get(learner=learner, course=course)
    lid = int(lesson.id)
    if lid not in enrollment.completed_lessons:
        enrollment.completed_lessons.append(lid)
        total = Lesson.objects.filter(section__course=course).count()
        done = len(enrollment.completed_lessons)
        enrollment.progress = int(done / total * 100) if total else 0
        enrollment.save(update_fields=["completed_lessons", "progress"])
    return enrollment


def activity_last_six_months(learner) -> list[dict]:
    start = (timezone.now() - timedelta(days=26 * 7 - 1)).date()
    qs = LessonCompletion.objects.filter(
        learner=learner, completed_at__date__gte=start
    ).values_list("completed_at", flat=True)
    counts = Counter(ts.date().isoformat() for ts in qs)
    return [{"date": d, "count": counts.get(d, 0)} for d in _date_iter(start)]


def _date_iter(start):
    today = timezone.now().date()
    days = (today - start).days + 1
    return [(start + timedelta(days=i)).isoformat() for i in range(days)]
