#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order

print(f'Total orders: {Order.objects.count()}')
print(f'Pending orders: {Order.objects.filter(status="pending").count()}')
print(f'Cancelled orders: {Order.objects.filter(status="cancelled").count()}')

print("\nRecent orders:")
for order in Order.objects.order_by('-created_at')[:5]:
    print(f"  {order.order_number}: {order.status} - ₹{order.total_amount} ({order.created_at})")