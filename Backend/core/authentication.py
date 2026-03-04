from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads the token from HttpOnly cookies instead of Authorization header.
    """

    def get_validated_token(self, raw_token):
        """
        Validate a JWT token. Accepts both raw tokens and token objects.
        """
        return super().get_validated_token(raw_token)

    def authenticate(self, request):
        """
        Extract JWT token from cookies and authenticate the request.
        """
        # Try to get token from Authorization header first (standard JWT)
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            raw_token = auth_header.split(' ')[1]
            validated_token = self.get_validated_token(raw_token)
            return (self.get_user(validated_token), validated_token)

        # If no Authorization header, check for access token in cookies
        raw_token = request.COOKIES.get('access') or request.COOKIES.get('jwt')
        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                return (self.get_user(validated_token), validated_token)
            except AuthenticationFailed:
                return None

        # No token found in either location
        return None
