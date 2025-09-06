from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='orders')
router.register(r'cart', views.CartItemViewSet, basename='cart')

urlpatterns = [
    path('', include(router.urls)),
]
