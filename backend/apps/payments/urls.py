from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'payments', views.PaymentViewSet, basename='payments')
router.register(r'refunds', views.RefundViewSet, basename='refunds')
router.register(r'methods', views.PaymentMethodViewSet, basename='payment-methods')
router.register(r'transactions', views.TransactionViewSet, basename='transactions')

urlpatterns = [
    path('', include(router.urls)),
]
