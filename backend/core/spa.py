import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404

REPO_ROOT = Path(settings.BASE_DIR).parent

DIST_DIRS = {
    "": REPO_ROOT / "frontend-learner" / "dist",
    "teach": REPO_ROOT / "frontend-instructor" / "dist",
    "admin": REPO_ROOT / "frontend-admin" / "dist",
}


def spa_view(app):
    dist = DIST_DIRS[app]
    base = dist.resolve()

    def view(request, path=""):
        target = base / (path or "index.html")
        if str(target.resolve()).startswith(str(base)) and target.is_file():
            ctype, _ = mimetypes.guess_type(str(target))
            return FileResponse(target.open("rb"), content_type=ctype)
        index = base / "index.html"
        if not index.is_file():
            raise Http404
        return FileResponse(index.open("rb"), content_type="text/html")

    return view
