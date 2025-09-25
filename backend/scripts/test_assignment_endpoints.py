#!/usr/bin/env python3
"""
Test script to verify the assignment endpoints are working
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
import json

User = get_user_model()

def test_assignment_endpoints():
    """Test the assignment endpoints"""
    print("🧪 Testing assignment endpoints...")
    
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
    
    # Get available chefs and delivery partners
    chefs = User.objects.filter(role='cook', status='active').first()
    delivery_partners = User.objects.filter(role='DeliveryAgent', status='active').first()
    
    if not chefs:
        print("❌ No chefs found")
        return False
        
    if not delivery_partners:
        print("❌ No delivery partners found")
        return False
    
    print(f"📋 Testing with order: {order.order_number} (ID: {order.id})")
    print(f"👨‍🍳 Testing with chef: {chefs.name} (ID: {chefs.user_id})")
    print(f"🚚 Testing with delivery partner: {delivery_partners.name} (ID: {delivery_partners.user_id})")
    
    # Create viewset instance
    viewset = AdminOrderManagementViewSet()
    
    try:
        # Test 1: Get available chefs
        print("\n1️⃣ Testing available chefs...")
        request = factory.get('/api/admin/orders/available_chefs/')
        request.user = admin_user
        response = viewset.available_chefs(request)
        print(f"   ✅ Available chefs status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"   📊 Chefs count: {len(response.data.get('chefs', []))}")
        
        # Test 2: Get available delivery partners
        print("\n2️⃣ Testing available delivery partners...")
        request = factory.get('/api/admin/orders/available_delivery_partners/')
        request.user = admin_user
        response = viewset.available_delivery_partners(request)
        print(f"   ✅ Available delivery partners status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"   📊 Partners count: {len(response.data.get('partners', []))}")
        
        # Test 3: Assign chef
        print("\n3️⃣ Testing assign chef...")
        request = factory.patch(f'/api/admin/orders/{order.id}/assign_chef/', 
                               json.dumps({'chef_id': chefs.user_id}), 
                               content_type='application/json')
        request.user = admin_user
        request.data = {'chef_id': chefs.user_id}
        response = viewset.assign_chef(request, pk=order.id)
        print(f"   ✅ Assign chef status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"   📊 Response: {response.data}")
        
        # Test 4: Assign delivery partner
        print("\n4️⃣ Testing assign delivery partner...")
        request = factory.patch(f'/api/admin/orders/{order.id}/assign_delivery_partner/', 
                               json.dumps({'partner_id': delivery_partners.user_id}), 
                               content_type='application/json')
        request.user = admin_user
        request.data = {'partner_id': delivery_partners.user_id}
        response = viewset.assign_delivery_partner(request, pk=order.id)
        print(f"   ✅ Assign delivery partner status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"   📊 Response: {response.data}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing assignment endpoints: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🚀 Testing Assignment Endpoints")
    print("=" * 50)
    
    success = test_assignment_endpoints()
    
    if success:
        print("\n✅ Assignment endpoints test completed!")
    else:
        print("\n❌ Assignment endpoints test failed!")
