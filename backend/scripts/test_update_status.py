#!/usr/bin/env python3
"""
Test script to debug the update_status endpoint
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
import json

User = get_user_model()

def test_update_status():
    """Test the update_status endpoint with detailed error handling"""
    print("🧪 Testing update_status endpoint...")
    
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
    
    print(f"📋 Testing with order: {order.order_number} (ID: {order.id})")
    print(f"   Current status: {order.status}")
    
    # Create viewset instance
    viewset = AdminOrderManagementViewSet()
    
    try:
        # Test update status
        print("\n🔄 Testing update order status...")
        request = factory.patch(f'/api/admin/orders/{order.id}/update_status/', 
                               json.dumps({'status': 'confirmed'}), 
                               content_type='application/json')
        request.user = admin_user
        
        # Add request.data manually since it's not automatically parsed in test
        request.data = {'status': 'confirmed'}
        
        response = viewset.update_status(request, pk=order.id)
        print(f"   ✅ Update status response: {response.status_code}")
        
        if hasattr(response, 'data'):
            print(f"   📊 Response data: {response.data}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing update status: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🚀 Testing Update Status Endpoint")
    print("=" * 50)
    
    success = test_update_status()
    
    if success:
        print("\n✅ Update status endpoint test completed!")
    else:
        print("\n❌ Update status endpoint test failed!")
