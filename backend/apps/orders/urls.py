from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .bulk_views import BulkOrderManagementViewSet

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='orders')
# router.register(r'order-items', views.OrderItemViewSet, basename='order-items')
# router.register(r'order-history', views.OrderStatusHistoryViewSet, basename='order-history')
router.register(r'cart', views.CartItemViewSet, basename='cart')
router.register(r'addresses', views.UserAddressViewSet, basename='addresses')

# Bulk order management
router.register(r'bulk', BulkOrderManagementViewSet, basename='bulk-orders')

urlpatterns = [
    path('', include(router.urls)),
    
    # Chef Dashboard API endpoints
    path('chef/dashboard/stats/', views.chef_dashboard_stats, name='chef-dashboard-stats'),
    path('chef/reviews/recent/', views.chef_recent_reviews, name='chef-recent-reviews'),
    path('chef/activity/recent/', views.chef_recent_activity, name='chef-recent-activity'),
    
    # Checkout and order placement endpoints
    path('checkout/calculate/', views.calculate_checkout, name='calculate-checkout'),
    path('place/', views.place_order, name='place-order'),
]
