#!/usr/bin/env python
"""
Check the generated test data
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.orders.models import Order
from apps.food.models import Food
from apps.communications.models import Communication
from apps.payments.models import Payment

def check_data():
    print('=== DATABASE STATUS ===')
    print(f'Users: {User.objects.count()}')
    print(f'  - Admins: {User.objects.filter(role__in=["Admin", "admin"]).count()}')
    print(f'  - Customers: {User.objects.filter(role__in=["Customer", "customer"]).count()}')
    print(f'  - Cooks: {User.objects.filter(role__in=["Cook", "cook"]).count()}')
    print(f'  - Delivery Agents: {User.objects.filter(role__in=["DeliveryAgent", "delivery_agent"]).count()}')

    print(f'\\nOrders: {Order.objects.count()}')
    if Order.objects.exists():
        first_order = Order.objects.first()
        print(f'  - Order Items: {first_order.items.count()}')
        print(f'  - First order total: ${first_order.total_amount}')
        print(f'  - First order status: {first_order.status}')

    print(f'Foods: {Food.objects.count()}')
    print(f'Communications: {Communication.objects.count()}')
    print(f'Payments: {Payment.objects.count()}')

    # Show some sample users
    if User.objects.exists():
        print('\\n=== SAMPLE USERS ===')
        for user in User.objects.all()[:5]:
            print(f'  {user.name} ({user.role}) - {user.email}')

    # Show some sample orders
    if Order.objects.exists():
        print('\\n=== SAMPLE ORDERS ===')
        for order in Order.objects.all()[:3]:
            print(f'  {order.order_number} - {order.customer.name} -> ${order.total_amount}')

if __name__ == "__main__":
    check_data()
