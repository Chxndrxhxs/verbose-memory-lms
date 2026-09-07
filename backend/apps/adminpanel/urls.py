from django.urls import path

from .views import (
    course_detail,
    course_status,
    courses_list,
    dashboard,
    enrollment_delete,
    enrollments_list,
    payments_list,
    user_detail,
    users_list,
)

urlpatterns = [
    path("admin/dashboard", dashboard),
    path("admin/users", users_list),
    path("admin/users/<int:user_id>", user_detail),
    path("admin/courses", courses_list),
    path("admin/courses/<int:course_id>", course_detail),
    path("admin/courses/<int:course_id>/status", course_status),
    path("admin/enrollments", enrollments_list),
    path("admin/enrollments/<int:enrollment_id>", enrollment_delete),
    path("admin/payments", payments_list),
]
