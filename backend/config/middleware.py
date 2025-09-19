"""
Custom middleware for handling security headers and CORS policies
"""

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
        if '/api/auth/google/' in request.path:
            # Remove Cross-Origin-Opener-Policy for Google OAuth
            if 'Cross-Origin-Opener-Policy' in response:
                del response['Cross-Origin-Opener-Policy']
            
            # Add specific headers for Google OAuth
            response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', '*')
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response