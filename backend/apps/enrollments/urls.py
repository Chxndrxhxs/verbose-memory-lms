from django.urls import path

from .views import (
    complete_lesson,
    enroll_view,
    generate_certificate,
    my_activity,
    my_certificates,
    my_courses,
    my_timeline,
    quiz_attempt,
)
from .views_instructor_activity import instructor_activity
from .views_leaderboard import leaderboard_view

urlpatterns = [
    path("instructor/activity/", instructor_activity),
    path("leaderboard/", leaderboard_view),
    path("courses/<int:course_id>/enroll", enroll_view),
    path("courses/<int:course_id>/lessons/complete", complete_lesson),
    path("courses/<int:course_id>/lessons/quiz-attempt", quiz_attempt),
    path("courses/<int:course_id>/certificate", generate_certificate),
    path("me/courses", my_courses),
    path("me/activity/", my_activity),
    path("me/certificates", my_certificates),
    path("me/timeline", my_timeline),
]
