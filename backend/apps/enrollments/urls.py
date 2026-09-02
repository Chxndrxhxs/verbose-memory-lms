from django.urls import path

from .views import (
    complete_lesson,
    enroll_view,
    generate_certificate,
    my_activity,
    my_certificates,
    my_courses,
)

urlpatterns = [
    path("courses/<int:course_id>/enroll", enroll_view),
    path("courses/<int:course_id>/lessons/complete", complete_lesson),
    path("courses/<int:course_id>/certificate", generate_certificate),
    path("me/courses", my_courses),
    path("me/activity/", my_activity),
    path("me/certificates", my_certificates),
]
