from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'dashboard', views.AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'users', views.AdminUserManagementViewSet, basename='admin-users')
router.register(r'orders', views.AdminOrderManagementViewSet, basename='admin-orders')
router.register(r'notifications', views.AdminNotificationViewSet, basename='admin-notifications')
router.register(r'settings', views.AdminSystemSettingsViewSet, basename='admin-settings')
router.register(r'activity-logs', views.AdminActivityLogViewSet, basename='admin-activity-logs')

urlpatterns = [
    path('', include(router.urls)),
]
