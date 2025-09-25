#!/usr/bin/env python3
"""
Test script to verify the orders endpoint is working
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

User = get_user_model()

def test_orders_endpoint():
    """Test the orders endpoint"""
    print("🧪 Testing orders endpoint...")
    
    # Create a test request
    factory = RequestFactory()
    request = factory.get('/api/admin/orders/?page=1&limit=5')
    
    # Get an admin user
    admin_user = User.objects.filter(role='admin').first()
    if not admin_user:
        print("❌ No admin user found")
        return
    
    request.user = admin_user
    
    # Create viewset instance
    viewset = AdminOrderManagementViewSet()
    
    try:
        # Test the list method
        response = viewset.list(request)
        print(f"✅ Orders endpoint response status: {response.status_code}")
        
        if hasattr(response, 'data'):
            print(f"📊 Orders count: {len(response.data.get('orders', []))}")
            print(f"📄 Pagination: {response.data.get('pagination', {})}")
            
            # Show first order if available
            orders = response.data.get('orders', [])
            if orders:
                first_order = orders[0]
                print(f"📋 First order: {first_order.get('order_number', 'N/A')} - {first_order.get('customer_name', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing orders endpoint: {str(e)}")
        return False

def test_orders_data():
    """Test if we have orders in the database"""
    print("\n🔍 Checking orders in database...")
    
    total_orders = Order.objects.count()
    print(f"📊 Total orders in database: {total_orders}")
    
    if total_orders > 0:
        # Show some sample orders
        sample_orders = Order.objects.select_related('customer').all()[:3]
        for order in sample_orders:
            print(f"  - {order.order_number}: {order.customer.name if order.customer else 'No customer'} - ${order.total_amount}")
    
    return total_orders > 0

if __name__ == '__main__':
    print("🚀 Testing Order Management System")
    print("=" * 50)
    
    # Test database data
    has_orders = test_orders_data()
    
    if has_orders:
        # Test endpoint
        success = test_orders_endpoint()
        
        if success:
            print("\n✅ Order management system is working correctly!")
        else:
            print("\n❌ Order management system has issues")
    else:
        print("\n❌ No orders found in database")
