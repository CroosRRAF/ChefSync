#!/usr/bin/env python
"""
Test script to verify dashboard API endpoints return data
Run this to check if the backend is working correctly
"""
import os
import sys

import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.admin_management.views import AdminDashboardViewSet
from apps.orders.models import Order
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

User = get_user_model()

print("=" * 80)
print("DASHBOARD API ENDPOINT TEST")
print("=" * 80)

# 1. Check database state
print("\n1. DATABASE CHECK:")
print(f"   Total orders in database: {Order.objects.count()}")

recent_orders_query = Order.objects.select_related("customer", "chef").order_by(
    "-created_at"
)[:5]
print(f"   Recent orders (last 5): {recent_orders_query.count()}")
for order in recent_orders_query:
    print(
        f"      - Order {order.id}: customer={order.customer.name if order.customer else 'None'}, status={order.status}"
    )

deliveries_query = (
    Order.objects.filter(status__in=["delivered", "out_for_delivery", "in_transit"])
    .select_related("customer", "delivery_partner")
    .order_by("-created_at")[:5]
)
print(f"\n   Recent deliveries (delivered/in-transit): {deliveries_query.count()}")
for order in deliveries_query:
    print(
        f"      - Order {order.id}: status={order.status}, customer={order.customer.name if order.customer else 'None'}"
    )

# 2. Test API endpoint directly
print("\n2. API ENDPOINT TEST:")
try:
    # Get or create admin user for testing
    admin_user = User.objects.filter(role="admin", is_staff=True).first()
    if not admin_user:
        print("   ⚠️  No admin user found! Creating test admin...")
        admin_user = User.objects.create_superuser(
            email="test_admin@chefsync.com", password="testpass123", name="Test Admin"
        )
        admin_user.role = "admin"
        admin_user.save()

    print(f"   Using admin user: {admin_user.email} (role={admin_user.role})")

    # Create mock request
    factory = APIRequestFactory()

    # Test recent_orders endpoint
    print("\n   Testing /api/admin-management/dashboard/recent_orders/")
    request = factory.get("/api/admin-management/dashboard/recent_orders/?limit=5")
    request.user = admin_user

    viewset = AdminDashboardViewSet()
    viewset.request = request
    viewset.format_kwarg = None

    response = viewset.recent_orders(request)
    print(f"   Response status: {response.status_code}")
    print(f"   Response data type: {type(response.data)}")
    print(
        f"   Number of orders returned: {len(response.data) if isinstance(response.data, list) else 'N/A'}"
    )

    if isinstance(response.data, list) and len(response.data) > 0:
        print("   ✅ API returning orders!")
        print(f"   Sample order: {response.data[0]}")
    elif isinstance(response.data, dict) and "error" in response.data:
        print(f"   ❌ API returned error: {response.data['error']}")
    else:
        print(f"   ⚠️  API returned empty list or unexpected format")
        print(f"   Full response: {response.data}")

    # Test recent_deliveries endpoint
    print("\n   Testing /api/admin-management/dashboard/recent_deliveries/")
    request = factory.get("/api/admin-management/dashboard/recent_deliveries/?limit=5")
    request.user = admin_user

    response = viewset.recent_deliveries(request)
    print(f"   Response status: {response.status_code}")
    print(f"   Response data type: {type(response.data)}")
    print(
        f"   Number of deliveries returned: {len(response.data) if isinstance(response.data, list) else 'N/A'}"
    )

    if isinstance(response.data, list) and len(response.data) > 0:
        print("   ✅ API returning deliveries!")
        print(f"   Sample delivery: {response.data[0]}")
    elif isinstance(response.data, dict) and "error" in response.data:
        print(f"   ❌ API returned error: {response.data['error']}")
    else:
        print(f"   ⚠️  API returned empty list or unexpected format")
        print(f"   Full response: {response.data}")

except Exception as e:
    print(f"   ❌ Error testing API: {str(e)}")
    import traceback

    traceback.print_exc()

print("\n" + "=" * 80)
print("DIAGNOSIS COMPLETE")
print("=" * 80)
print("\nNext steps based on results:")
print("- If database has orders but API returns empty → Check serializer/query filters")
print("- If API returns error → Check error message and fix backend code")
print(
    "- If API returns data → Problem is in frontend (URL, authentication, or data transformation)"
)
print("=" * 80)
