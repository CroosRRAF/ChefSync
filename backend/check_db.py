#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(__file__))
django.setup()

from apps.orders.models import Order
from django.contrib.auth import get_user_model

User = get_user_model()

print("Users:")
for user in User.objects.all()[:10]:
    print(f"  {user.username} ({user.pk}): role={getattr(user, 'role', 'no role')}")

print("\nOrders:")
for order in Order.objects.all().order_by('-id')[:10]:
    customer_name = order.customer.username if order.customer else "None"
    print(f"  Order {order.id} ({order.order_number}): customer={customer_name}, status={order.status}, created={order.created_at}")