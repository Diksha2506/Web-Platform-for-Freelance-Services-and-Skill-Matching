from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that does NOT enforce CSRF.
    Safe for SPA usage where CORS is properly configured
    and the API is only accessible from trusted origins.
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF check
