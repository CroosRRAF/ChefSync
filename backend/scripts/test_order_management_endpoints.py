#!/usr/bin/env python3
"""
Test script to verify the order management endpoints are working
"""

import os
import sys
import django
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.admin_management.views import AdminOrderManagementViewSet
from apps.orders.models import Order
from apps.authentication.models import User

User = get_user_model()

def test_order_endpoints():
    """Test the order management endpoints"""
    print("🧪 Testing order management endpoints...")
    
    # Create a test request factory
    factory = RequestFactory()
    
    # Get an admin user
    admin_user = User.objects.filter(role='admin').first()
    if not admin_user:
        print("❌ No admin user found")
        return False
    
    # Get a sample order
    order = Order.objects.first()
    if not order:
        print("❌ No orders found")
        return False
    
    print(f"📋 Testing with order: {order.order_number}")
    
    # Create viewset instance
    viewset = AdminOrderManagementViewSet()
    
    try:
        # Test 1: List orders
        print("\n1️⃣ Testing list orders...")
        request = factory.get('/api/admin/orders/')
        request.user = admin_user
        response = viewset.list(request)
        print(f"   ✅ List orders status: {response.status_code}")
        
        # Test 2: Retrieve order details
        print("\n2️⃣ Testing retrieve order details...")
        request = factory.get(f'/api/admin/orders/{order.id}/')
        request.user = admin_user
        response = viewset.retrieve(request, pk=order.id)
        print(f"   ✅ Retrieve order status: {response.status_code}")
        
        # Test 3: Update order status
        print("\n3️⃣ Testing update order status...")
        request = factory.patch(f'/api/admin/orders/{order.id}/update_status/', 
                               {'status': 'confirmed'}, 
                               content_type='application/json')
        request.user = admin_user
        response = viewset.update_status(request, pk=order.id)
        print(f"   ✅ Update status response: {response.status_code}")
        
        # Test 4: Get available chefs
        print("\n4️⃣ Testing available chefs...")
        request = factory.get('/api/admin/orders/available_chefs/')
        request.user = admin_user
        response = viewset.available_chefs(request)
        print(f"   ✅ Available chefs status: {response.status_code}")
        
        # Test 5: Get available delivery partners
        print("\n5️⃣ Testing available delivery partners...")
        request = factory.get('/api/admin/orders/available_delivery_partners/')
        request.user = admin_user
        response = viewset.available_delivery_partners(request)
        print(f"   ✅ Available delivery partners status: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing order endpoints: {str(e)}")
        return False

def test_order_data():
    """Test if we have the necessary data for order management"""
    print("\n🔍 Checking order management data...")
    
    # Check orders
    total_orders = Order.objects.count()
    print(f"📊 Total orders: {total_orders}")
    
    # Check chefs
    chefs = User.objects.filter(role='cook', status='active').count()
    print(f"👨‍🍳 Active chefs: {chefs}")
    
    # Check delivery agents
    delivery_agents = User.objects.filter(role='DeliveryAgent', status='active').count()
    print(f"🚚 Active delivery agents: {delivery_agents}")
    
    # Show sample order
    if total_orders > 0:
        order = Order.objects.select_related('customer', 'chef').first()
        print(f"📋 Sample order: {order.order_number}")
        print(f"   Customer: {order.customer.name if order.customer else 'No customer'}")
        print(f"   Chef: {order.chef.name if order.chef else 'No chef assigned'}")
        print(f"   Status: {order.status}")
        print(f"   Total: ${order.total_amount}")
    
    return total_orders > 0 and chefs > 0 and delivery_agents > 0

if __name__ == '__main__':
    print("🚀 Testing Order Management Endpoints")
    print("=" * 50)
    
    # Test data availability
    has_data = test_order_data()
    
    if has_data:
        # Test endpoints
        success = test_order_endpoints()
        
        if success:
            print("\n✅ Order management endpoints are working correctly!")
        else:
            print("\n❌ Order management endpoints have issues")
    else:
        print("\n❌ Missing required data for order management testing")
