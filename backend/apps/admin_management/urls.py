from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import ai_views

router = DefaultRouter()
router.register(r'dashboard', views.AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'users', views.AdminUserManagementViewSet, basename='admin-users')
router.register(r'orders', views.AdminOrderManagementViewSet, basename='admin-orders')
router.register(r'notifications', views.AdminNotificationViewSet, basename='admin-notifications')
router.register(r'settings', views.AdminSystemSettingsViewSet, basename='admin-settings')
router.register(r'activity-logs', views.AdminActivityLogViewSet, basename='admin-activity-logs')
router.register(r'ai', views.AdminAIServiceViewSet, basename='admin-ai')
router.register(r'documents', views.AdminDocumentManagementViewSet, basename='admin-documents')

urlpatterns = [
    path('', include(router.urls)),
    
    # AI/ML Endpoints (Phase 3)
    path('ai/sales-forecast/', ai_views.sales_forecast, name='ai-sales-forecast'),
    path('ai/anomaly-detection/', ai_views.anomaly_detection, name='ai-anomaly-detection'),
    path('ai/product-recommendations/', ai_views.product_recommendations, name='ai-product-recommendations'),
    path('ai/customer-insights/', ai_views.customer_insights, name='ai-customer-insights'),
    path('ai/status/', ai_views.ai_status, name='ai-status'),
    path('ai/dashboard-summary/', ai_views.ai_dashboard_summary, name='ai-dashboard-summary'),
    path('ai/communication-insights/', ai_views.communication_ai_insights, name='ai-communication-insights'),
    path('ai/service-status/', ai_views.ai_service_status, name='ai-service-status'),
    path('ai/business-insights/', ai_views.business_insights, name='ai-business-insights'),
    path('ai/recommendations/', ai_views.ai_recommendations, name='ai-recommendations'),
]
