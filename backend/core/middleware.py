from django.conf import settings


class ContentSecurityPolicyMiddleware:
    """Adds the Content-Security-Policy header from the CSP_POLICY
    setting. CSP is not part of Django core, and the header is only
    useful once the site serves over HTTPS — until then an empty
    CSP_POLICY (set in .env) keeps this middleware a no-op.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        policy = getattr(settings, "CSP_POLICY", "")
        if policy and "content-security-policy" not in response.headers:
            response.headers["Content-Security-Policy"] = policy
        return response
