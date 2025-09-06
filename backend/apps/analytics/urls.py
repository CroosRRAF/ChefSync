from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')
router.register(r'settings', views.SystemSettingsViewSet, basename='settings')
router.register(r'notifications', views.SystemNotificationViewSet, basename='notifications')
router.register(r'audit-logs', views.SystemAuditLogViewSet, basename='audit-logs')
router.register(r'maintenance', views.SystemMaintenanceViewSet, basename='maintenance')

urlpatterns = [
    path('', include(router.urls)),
]
