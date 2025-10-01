#!/usr/bin/env python
"""
Script to check current database status
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

def check_database():
    """Check current database status"""
    print("🔍 Checking ChefSync Database Status...")
    print("=" * 50)
    
    try:
        # Check if we can connect to database
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ Database connection: OK")
        
        # Check table counts
        tables_to_check = [
            ('authentication_user', 'Users'),
            ('food', 'Food Items'),
            ('orders', 'Orders'),
            ('payments', 'Payments'),
            ('cuisines', 'Cuisines'),
            ('food_categories', 'Food Categories'),
        ]
        
        print("\n📊 Current Database Contents:")
        print("-" * 30)
        
        for table, display_name in tables_to_check:
            try:
                with connection.cursor() as cursor:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"   {display_name}: {count}")
            except Exception as e:
                print(f"   {display_name}: Error - {e}")
        
        # Check user roles
        print("\n👥 User Roles:")
        print("-" * 15)
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT role, COUNT(*) FROM authentication_user GROUP BY role")
                roles = cursor.fetchall()
                for role, count in roles:
                    print(f"   {role}: {count}")
        except Exception as e:
            print(f"   Error checking roles: {e}")
        
        # Check recent orders
        print("\n📦 Recent Orders:")
        print("-" * 15)
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT status, COUNT(*) 
                    FROM orders 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    GROUP BY status
                """)
                recent_orders = cursor.fetchall()
                if recent_orders:
                    for status, count in recent_orders:
                        print(f"   {status}: {count}")
                else:
                    print("   No recent orders found")
        except Exception as e:
            print(f"   Error checking recent orders: {e}")
        
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    check_database()
