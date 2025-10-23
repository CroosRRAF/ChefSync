#!/usr/bin/env python
"""
Check if bulk orders exist in the database
"""
import os
import sys
import django

# Add the backend directory to the path and setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import BulkOrder, BulkOrderAssignment
from django.contrib.auth.models import User
from django.db import connection

def check_bulk_orders():
    print("=" * 50)
    print("BULK ORDER DATABASE CHECK")
    print("=" * 50)
    
    # Check if tables exist
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%bulk%'
        """)
        bulk_tables = cursor.fetchall()
        
    print(f"\n📊 BULK TABLES IN DATABASE:")
    for table in bulk_tables:
        print(f"  ✅ {table[0]}")
    
    # Check total bulk orders
    try:
        total_bulk_orders = BulkOrder.objects.count()
        print(f"\n📈 TOTAL BULK ORDERS: {total_bulk_orders}")
        
        if total_bulk_orders > 0:
            print(f"\n📋 BULK ORDER DETAILS:")
            for bulk_order in BulkOrder.objects.all()[:5]:  # Show first 5
                print(f"  🔹 ID: {bulk_order.bulk_order_id}")
                print(f"     Status: {bulk_order.status}")
                print(f"     Description: {bulk_order.description[:50]}...")
                print(f"     Created: {bulk_order.created_at}")
                print(f"     Created by: {bulk_order.created_by}")
                print(f"     Quantity: {bulk_order.total_quantity}")
                print()
        else:
            print("  ❌ No bulk orders found in database")
            
    except Exception as e:
        print(f"  ❌ Error accessing BulkOrder model: {e}")
    
    # Check bulk order assignments
    try:
        total_assignments = BulkOrderAssignment.objects.count()
        print(f"\n👥 TOTAL BULK ORDER ASSIGNMENTS: {total_assignments}")
        
        if total_assignments > 0:
            print(f"\n📋 ASSIGNMENT DETAILS:")
            for assignment in BulkOrderAssignment.objects.all()[:3]:
                print(f"  🔹 Bulk Order: {assignment.bulk_order.bulk_order_id}")
                print(f"     Chef: {assignment.chef}")
                print(f"     Status: {assignment.status}")
                print()
    except Exception as e:
        print(f"  ❌ Error accessing BulkOrderAssignment model: {e}")
    
    # Show status distribution
    try:
        print(f"\n📊 STATUS DISTRIBUTION:")
        from django.db.models import Count
        status_counts = BulkOrder.objects.values('status').annotate(count=Count('status'))
        for status in status_counts:
            print(f"  {status['status']}: {status['count']}")
    except Exception as e:
        print(f"  ❌ Error getting status distribution: {e}")

if __name__ == "__main__":
    check_bulk_orders()