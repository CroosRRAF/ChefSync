#!/usr/bin/env python
"""
Test Django setup and create some sample data
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

def main():
    print("🚀 Starting Django test...")

    try:
        # Check current state
        user_count = User.objects.count()
        order_count = Order.objects.count()
        food_count = Food.objects.count()

        print(f"📊 Current database state:")
        print(f"   • Users: {user_count}")
        print(f"   • Orders: {order_count}")
        print(f"   • Foods: {food_count}")

        # Create a test user
        print("\\n👤 Creating test user...")
        user = User.objects.create_user(
            email="test@example.com",
            password="test123",
            name="Test User",
            role="Customer",
            phone_no="+1234567890"
        )
        print(f"✅ Created user: {user.name} ({user.email})")

        # Create a test food item
        print("\\n🍕 Creating test food item...")
        food = Food.objects.create(
            name="Test Pizza",
            category="Main Course",
            description="A delicious test pizza",
            chef=user,  # This might fail if chef relationship is required
            is_available=True,
            status="Approved"
        )
        print(f"✅ Created food: {food.name}")

        # Check final state
        print("\\n📊 Final database state:")
        print(f"   • Users: {User.objects.count()}")
        print(f"   • Orders: {Order.objects.count()}")
        print(f"   • Foods: {Food.objects.count()}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
