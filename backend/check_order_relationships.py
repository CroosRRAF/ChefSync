"""
Check if orders have customer relationships properly set
"""

import os
import sys

import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.orders.models import Order
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 60)
print("🔍 CHECKING ORDER-CUSTOMER RELATIONSHIPS")
print("=" * 60)

# Get all orders
orders = Order.objects.all()
print(f"\nTotal Orders in Database: {orders.count()}")

if orders.count() == 0:
    print("❌ No orders found in database!")
    print("   This explains why recent orders is empty.")
    print("\n💡 Solution: Create some test orders")
else:
    print("\n📊 Order Details:")
    print("-" * 60)

    for order in orders:
        print(f"\n  Order: {order.order_number}")
        print(f"  Status: {order.status}")
        print(f"  Total: ${order.total_amount}")
        print(f"  Created: {order.created_at}")

        # Check customer relationship
        if order.customer:
            print(f"  ✅ Customer: {order.customer.name} ({order.customer.email})")
        else:
            print(f"  ❌ Customer: NULL (This will break serializer!)")

        # Check chef relationship
        if hasattr(order, "chef"):
            if order.chef:
                print(f"  ✅ Chef: {order.chef.name}")
            else:
                print(f"  ⚠️  Chef: NULL")

        # Check items
        try:
            items_count = order.items.count()
            print(f"  📦 Items: {items_count}")
        except:
            print(f"  ⚠️  Items: Unable to count")

print("\n" + "=" * 60)
print("📋 SUMMARY")
print("=" * 60)

# Count orders without customers
orders_without_customer = Order.objects.filter(customer__isnull=True).count()
orders_with_customer = Order.objects.filter(customer__isnull=False).count()

print(f"\n✅ Orders WITH customer: {orders_with_customer}")
print(f"❌ Orders WITHOUT customer: {orders_without_customer}")

if orders_without_customer > 0:
    print("\n⚠️  WARNING: Some orders have NULL customer!")
    print("   This will cause AdminOrderSummarySerializer to fail")
    print("   because it tries to access customer.name")
    print("\n💡 Solution:")
    print("   1. Fix serializer to handle NULL customer")
    print("   2. Or assign customers to all orders")

# Check if recent orders query would work
print("\n" + "=" * 60)
print("🧪 TESTING RECENT ORDERS QUERY")
print("=" * 60)

try:
    recent = Order.objects.select_related("customer", "chef").order_by("-created_at")[
        :5
    ]
    print(f"\n✅ Query executed successfully")
    print(f"   Found {len(recent)} orders")

    for order in recent:
        customer_name = order.customer.name if order.customer else "NULL"
        print(f"   - {order.order_number}: {customer_name}")

except Exception as e:
    print(f"\n❌ Query failed: {e}")

print("\n✅ Check complete!")
