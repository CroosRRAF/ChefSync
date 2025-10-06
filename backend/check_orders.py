#!/usr/bin/env python
import os
import sys

import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order
from django.db.models import Count

print('Total orders:', Order.objects.count())
print('Orders by status:')
statuses = Order.objects.values('status').annotate(count=Count('id')).order_by('status')
for status in statuses:
    print(f"  {status['status']}: {status['count']}")

# Check recent deliveries query
print('\nRecent deliveries query results:')
recent_orders = Order.objects.filter(
    status__in=["delivered", "out_for_delivery", "in_transit"]
).select_related("customer", "delivery_partner").order_by("-created_at")[:5]

print(f"Found {len(recent_orders)} recent deliveries")
for order in recent_orders:
    print(f"  Order {order.id}: status={order.status}, customer={order.customer.name if order.customer else 'None'}")    print(f"  Order {order.id}: status={order.status}, customer={order.customer.name if order.customer else 'None'}")
