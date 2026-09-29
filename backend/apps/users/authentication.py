from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

# Each frontend (learner / instructor / admin) keeps its own session so that
# logging in or out of one app never disturbs the others. The app is selected
# with the X-App header (sent by the shared API client) or an `app` body
# field on auth POSTs. Requests without it use the legacy cookie names.
APP_COOKIE_APPS = ("learner", "instructor", "admin")

ACCESS_MAX_AGE = 1800
REFRESH_MAX_AGE = 604800


def auth_app(request) -> str:
    """Which frontend this auth request belongs to ("" = legacy shared)."""
    headers = getattr(request, "headers", {}) or {}
    header = (headers.get("X-App") or "").strip().lower()
    if header in APP_COOKIE_APPS:
        return header
    data = getattr(request, "data", None)
    if isinstance(data, dict):
        body = str(data.get("app") or "").strip().lower()
        if body in APP_COOKIE_APPS:
            return body
    return ""


def cookie_names(app: str) -> tuple[str, str]:
    if app in APP_COOKIE_APPS:
        return f"{app}_access_token", f"{app}_refresh_token"
    return "access_token", "refresh_token"


def set_auth_cookies(res: Response, tokens: dict, app: str = "") -> Response:
    secure = not settings.DEBUG
    access_name, refresh_name = cookie_names(app)
    res.set_cookie(
        access_name,
        tokens["access"],
        httponly=True,
        secure=secure,
        samesite="Lax",
        max_age=ACCESS_MAX_AGE,
        path="/",
    )
    res.set_cookie(
        refresh_name,
        tokens["refresh"],
        httponly=True,
        secure=secure,
        samesite="Lax",
        max_age=REFRESH_MAX_AGE,
        path="/",
    )
    return res


def clear_auth_cookies(res: Response, app: str = "") -> Response:
    """Clear this app's session (plus any legacy shared cookies)."""
    names = {cookie_names(app), cookie_names("")}
    for access_name, refresh_name in names:
        res.delete_cookie(access_name, path="/")
        res.delete_cookie(refresh_name, path="/")
    return res


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            # Per-app session (X-App header from our frontends) so learner,
            # instructor and admin logins never overwrite each other. Without
            # the header, fall back to the legacy shared cookie names.
            app = (request.headers.get("X-App") or "").strip().lower()
            if app in APP_COOKIE_APPS:
                raw_token = request.COOKIES.get(cookie_names(app)[0])
            else:
                raw_token = request.COOKIES.get(cookie_names("")[0])
            if raw_token is None:
                return None
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        return super().authenticate(request)
