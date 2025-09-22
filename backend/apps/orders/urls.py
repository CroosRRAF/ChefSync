from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='orders')
router.register(r'cart', views.CartItemViewSet, basename='cart')

router.register(r"chef/orders", views.ChefOrderViewSet, basename="chef-orders")
router.register(r"chef/bulk-orders", views.ChefBulkOrderViewSet, basename="chef-bulk-orders")


urlpatterns = [
    path('', include(router.urls)),
]
