"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:



    admin

    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import include, path


def root_redirect(_request):
    """Redirect root URL to admin dashboard."""
    return redirect('/admin/')


def api_health_check(_request):
    """Simple health check endpoint for API."""
    return JsonResponse(
        {
            "service": "ChefSync Backend",
            "status": "ok",
            "message": "API server running",
        }
    )


urlpatterns = [
    path("", root_redirect, name="root-redirect"),
    path("api/health/", api_health_check, name="health-check"),
    path("admin/", admin.site.urls),
    # API paths
    path("api/auth/", include("apps.authentication.urls", namespace="api-auth")),
    path("api/analytics/", include("apps.analytics.urls")),
    # DEPRECATED: path('api/admin/', include('apps.admin_panel.urls')),
    # Use /api/admin-management/ instead - it has all admin_panel endpoints plus additional features
    path(
        "api/admin-management/", include("apps.admin_management.urls")
    ),  # Consolidated admin endpoints
    path("api/communications/", include("apps.communications.urls")),
    path("api/food/", include("apps.food.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/users/", include("apps.users.urls")),
    # Alternative paths for frontend compatibility
    path("auth/", include("apps.authentication.urls", namespace="auth")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve local media files for local storage fallback
    urlpatterns += static(
        "/local_media/", document_root=getattr(settings, "LOCAL_MEDIA_ROOT", None)
    )
