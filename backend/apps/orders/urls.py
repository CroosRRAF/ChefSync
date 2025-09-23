from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .bulk_views import BulkOrderManagementViewSet

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='orders')
router.register(r'order-items', views.OrderItemViewSet, basename='order-items')
router.register(r'order-history', views.OrderStatusHistoryViewSet, basename='order-history')
router.register(r'cart', views.CartItemViewSet, basename='cart')

# Bulk order management
router.register(r'bulk', BulkOrderManagementViewSet, basename='bulk-orders')

urlpatterns = [
    path('', include(router.urls)),
]
