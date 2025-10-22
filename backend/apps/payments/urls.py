from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"payments", views.PaymentViewSet, basename="payments")
router.register(r"refunds", views.RefundViewSet, basename="refunds")
router.register(r"methods", views.PaymentMethodViewSet, basename="payment-methods")
router.register(r"transactions", views.TransactionViewSet, basename="transactions")

urlpatterns = [
    path("", include(router.urls)),
    # Stats endpoint expected by frontend at /api/payments/stats/
    path("stats/", views.payment_stats, name="payment-stats"),
]
