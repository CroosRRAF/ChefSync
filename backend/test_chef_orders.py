#!/usr/bin/env python
"""
Quick test to check if orders API is working after the fix
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from apps.orders.models import Order
from apps.orders.views import OrderViewSet
from apps.authentication.models import User
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

def test_chef_orders():
    """Test if chefs can see their orders through the OrderViewSet"""
    print("🧪 Testing Chef Orders Access...")
    print("=" * 50)
    
    # Find a chef user with orders
    chefs = User.objects.filter(role__in=['cook', 'Cook'])
    print(f"Found {chefs.count()} chefs in database")
    
    for chef in chefs:
        chef_orders = Order.objects.filter(chef=chef)
        if chef_orders.count() > 0:
            print(f"\n👨‍🍳 CHEF: {chef.name} ({chef.email})")
            print(f"   Direct DB query - Orders: {chef_orders.count()}")
            
            # Test through the ViewSet
            factory = RequestFactory()
            request = factory.get('/orders/orders/')
            request.user = chef
            
            viewset = OrderViewSet()
            viewset.request = request
            queryset = viewset.get_queryset()
            
            print(f"   ViewSet query - Orders: {queryset.count()}")
            
            if queryset.count() > 0:
                print(f"   ✅ SUCCESS: Chef can access their orders through API")
                # Show first few orders
                for i, order in enumerate(queryset[:3]):
                    print(f"      Order #{order.order_number}: {order.get_status_display()} - ${order.total_amount}")
                if queryset.count() > 3:
                    print(f"      ... and {queryset.count() - 3} more orders")
            else:
                print(f"   ❌ FAILED: Chef cannot access orders through ViewSet")
                print(f"      User role: {getattr(chef, 'role', 'No role attr')}")
                print(f"      Has chef_profile: {hasattr(chef, 'chef_profile')}")
                print(f"      Is in Chefs group: {chef.groups.filter(name='Chefs').exists()}")
            
            break
    else:
        print("❌ No chefs with orders found in database")
    
    print("\n" + "=" * 50)

if __name__ == '__main__':
    test_chef_orders()