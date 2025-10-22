#!/usr/bin/env python
"""
Check if orders exist in the database
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.orders.models import Order, BulkOrder
from django.contrib.auth import get_user_model

User = get_user_model()

def check_orders():
    print("🔍 CHECKING DATABASE FOR ORDERS")
    print("=" * 50)
    
    try:
        # Check total orders
        total_orders = Order.objects.count()
        print(f"\n📈 TOTAL ORDERS: {total_orders}")
        
        if total_orders > 0:
            print("\n📋 RECENT ORDERS:")
            orders = Order.objects.all().order_by('-created_at')[:5]
            for order in orders:
                customer_name = "Unknown"
                if order.customer:
                    if hasattr(order.customer, 'name') and order.customer.name:
                        customer_name = order.customer.name
                    else:
                        customer_name = order.customer.username
                
                chef_name = "No Chef"
                if order.chef:
                    if hasattr(order.chef, 'name') and order.chef.name:
                        chef_name = order.chef.name
                    else:
                        chef_name = order.chef.username
                
                print(f"  - Order #{order.order_number}")
                print(f"    Status: {order.status}")
                print(f"    Customer: {customer_name}")
                print(f"    Chef: {chef_name}")
                print(f"    Total: ${order.total_amount}")
                print(f"    Created: {order.created_at}")
                print()
        else:
            print("  ❌ No orders found in database")
        
        # Check total bulk orders
        total_bulk_orders = BulkOrder.objects.count()
        print(f"\n📈 TOTAL BULK ORDERS: {total_bulk_orders}")
        
        if total_bulk_orders > 0:
            print("\n📋 RECENT BULK ORDERS:")
            bulk_orders = BulkOrder.objects.all().order_by('-created_at')[:5]
            for order in bulk_orders:
                print(f"  - Bulk Order #{order.bulk_order_id}")
                print(f"    Status: {order.status}")
                print(f"    Quantity: {order.total_quantity}")
                print(f"    Description: {order.description}")
                print(f"    Created: {order.created_at}")
                print()
        else:
            print("  ❌ No bulk orders found in database")
        
        # Check users by role
        print(f"\n👥 USERS BY ROLE:")
        all_users = User.objects.all()
        print(f"  - Total users: {all_users.count()}")
        
        # Check role distribution
        if hasattr(User.objects.first(), 'role'):
            customers = User.objects.filter(role='customer').count()
            cooks = User.objects.filter(role='cook').count()
            delivery = User.objects.filter(role='delivery_agent').count()
            admins = User.objects.filter(role='admin').count()
            
            print(f"  - Customers: {customers}")
            print(f"  - Cooks: {cooks}")  
            print(f"  - Delivery Agents: {delivery}")
            print(f"  - Admins: {admins}")
        else:
            print("  - Users don't have role field")
    
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_orders()