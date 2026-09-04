from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CourseViewSet, instructor_overview, upload

router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
urlpatterns = router.urls + [
    path("upload/", upload),
    path("instructor/overview", instructor_overview),
]
