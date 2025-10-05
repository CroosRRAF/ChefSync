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
    # Additional endpoints for frontend compatibility
    path('orders', views.order_analytics, name='order-analytics'),
    path('customers', views.customer_analytics, name='customer-analytics'),
    path('performance', views.performance_analytics, name='performance-analytics'),
    
    # Export and Report Scheduling endpoints
    path('export/', views.export_data, name='export-data'),
    path('reports/schedule/', views.schedule_report, name='schedule-report'),
    path('reports/scheduled/', views.get_scheduled_reports, name='scheduled-reports'),
    
    # Admin-specific analytics endpoints for frontend compatibility
    path('admin/analytics/dashboard/advanced_analytics/', views.DashboardViewSet.as_view({'get': 'advanced_analytics'}), name='admin-advanced-analytics'),
    path('admin/analytics/reports/scheduled/', views.get_scheduled_reports, name='admin-scheduled-reports'),
]
