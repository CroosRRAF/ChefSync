from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .bulk_views import BulkOrderManagementViewSet

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='orders')
# Temporarily disabled - need to fix serializer issues
# router.register(r'order-items', views.OrderItemViewSet, basename='order-items')
# router.register(r'order-history', views.OrderStatusHistoryViewSet, basename='order-history')
# router.register(r'cart', views.CartItemViewSet, basename='cart')

# Bulk order management
router.register(r'bulk', BulkOrderManagementViewSet, basename='bulk-orders')

urlpatterns = [
    path('', include(router.urls)),
    
    # Chef Dashboard API endpoints
    path('chef/dashboard/stats/', views.chef_dashboard_stats, name='chef-dashboard-stats'),
    path('chef/reviews/recent/', views.chef_recent_reviews, name='chef-recent-reviews'),
    path('chef/activity/recent/', views.chef_recent_activity, name='chef-recent-activity'),
    
    # Admin notifications endpoint
    path('admin/notifications/', views.admin_notifications, name='admin-notifications'),
]
