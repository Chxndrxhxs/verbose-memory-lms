from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

from core.spa import spa_view

urlpatterns = [
    path("djadmin/", admin.site.urls),
    path("api/v1/", include("apps.users.urls")),
    path("api/v1/", include("apps.courses.urls")),
    path("api/v1/", include("apps.enrollments.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.adminpanel.urls")),
    path("api/v1/", include("apps.assignments.urls")),
    path("teach", RedirectView.as_view(url="/teach/", permanent=False)),
    path("teach/", spa_view("teach")),
    path("teach/<path:path>", spa_view("teach")),
    path("admin", RedirectView.as_view(url="/admin/", permanent=False)),
    path("admin/", spa_view("admin")),
    path("admin/<path:path>", spa_view("admin")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("", spa_view("")),
    path("<path:path>", spa_view("")),
]
