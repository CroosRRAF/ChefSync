from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .bulk_views import BulkOrderManagementViewSet, CollaborationRequestViewSet
from .customer_bulk_views import CustomerBulkOrderViewSet
from .customer_views import (
    customer_dashboard_stats,
    customer_orders,
    get_order_review_status,
    submit_delivery_review,
    submit_food_review,
)
from .invoice_views import (
    generate_order_invoice,
    email_order_invoice,
    generate_bulk_order_invoice,
    email_bulk_order_invoice,
)

router = DefaultRouter()
router.register(r"orders", views.OrderViewSet, basename="orders")
# router.register(r'order-items', views.OrderItemViewSet, basename='order-items')
# router.register(r'order-history', views.OrderStatusHistoryViewSet, basename='order-history')
router.register(r"cart", views.CartItemViewSet, basename="cart")
router.register(r"addresses", views.UserAddressViewSet, basename="addresses")
router.register(
    r"delivery-reviews", views.DeliveryReviewViewSet, basename="delivery-reviews"
)

# Bulk order management (for cooks/admins)
router.register(r"bulk", BulkOrderManagementViewSet, basename="bulk-orders")
router.register(
    r"collaboration-requests",
    CollaborationRequestViewSet,
    basename="collaboration-requests",
)

# Customer bulk orders (for customers to place bulk orders)
router.register(
    r"customer-bulk-orders", CustomerBulkOrderViewSet, basename="customer-bulk-orders"
)


urlpatterns = [
    path("", include(router.urls)),
    # Customer-specific views
    path(
        "customer/stats/",
        customer_dashboard_stats,
        name="customer-dashboard-stats",
    ),
    path(
        "customer/orders/",
        customer_orders,
        name="customer-orders",
    ),
    # Review endpoints
    path(
        "reviews/food/submit/",
        submit_food_review,
        name="submit-food-review",
    ),
    path(
        "reviews/delivery/submit/",
        submit_delivery_review,
        name="submit-delivery-review",
    ),
    path(
        "reviews/status/<int:order_id>/",
        get_order_review_status,
        name="order-review-status",
    ),
    # Chef-specific views
    path(
        "chef/dashboard/stats/", views.chef_dashboard_stats, name="chef-dashboard-stats"
    ),
    path("chef/reviews/recent/", views.chef_recent_reviews, name="chef-recent-reviews"),
    path(
        "chef/activity/recent/", views.chef_recent_activity, name="chef-recent-activity"
    ),
    path("chef/income/", views.chef_income_data, name="chef-income-data"),
    path(
        "chef/income/breakdown/",
        views.chef_income_breakdown,
        name="chef-income-breakdown",
    ),
    # Checkout and order placement endpoints
    path("checkout/calculate/", views.calculate_checkout, name="calculate-checkout"),
    path("place/", views.place_order, name="place-order"),
    # Invoice generation endpoints
    path("orders/<int:pk>/generate_invoice/", generate_order_invoice, name="generate-order-invoice"),
    path("orders/<int:pk>/email_invoice/", email_order_invoice, name="email-order-invoice"),
    path("bulk/<int:pk>/generate_invoice/", generate_bulk_order_invoice, name="generate-bulk-order-invoice"),
    path("bulk/<int:pk>/email_invoice/", email_bulk_order_invoice, name="email-bulk-order-invoice"),
]
