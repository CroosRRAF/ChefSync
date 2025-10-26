"""
Custom middleware for handling security headers and CORS policies
"""

import re

from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware:
    """
    Middleware to handle Cross-Origin-Opener-Policy and other security headers
    specifically for Google OAuth compatibility
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # For Google OAuth endpoints, remove COOP header to prevent blocking
        if "/api/auth/google/" in request.path:
            # Remove Cross-Origin-Opener-Policy for Google OAuth
            if "Cross-Origin-Opener-Policy" in response:
                del response["Cross-Origin-Opener-Policy"]

            # Add specific headers for Google OAuth
            response["Access-Control-Allow-Origin"] = request.META.get(
                "HTTP_ORIGIN", "*"
            )
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

            # Set Cross-Origin-Opener-Policy to unsafe-none for OAuth popups
            response["Cross-Origin-Opener-Policy"] = "unsafe-none"

        return response


class DisableCSRFMiddleware(MiddlewareMixin):
    """
    Middleware to disable CSRF for specific API endpoints in development
    """

    def process_request(self, request):
        if settings.DEBUG:
            # List of URL patterns to exempt from CSRF
            csrf_exempt_patterns = getattr(settings, "CSRF_EXEMPT_URLS", [])

            for pattern in csrf_exempt_patterns:
                if re.match(pattern, request.path):
                    setattr(request, "_dont_enforce_csrf_checks", True)
                    break
        return None
