#!/usr/bin/env python
"""
Create essential test data for admin testing
Creates realistic users, orders, communications, and other data needed for admin features
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.orders.models import Order, OrderItem, UserAddress
from apps.food.models import Food, FoodPrice
from apps.communications.models import Communication

def create_admin_test_data():
    """Create essential test data for admin features"""

    print("🚀 Creating admin test data...")

    # Create admin user
    admin = User.objects.create_user(
        email="admin@chefsync.com",
        password="admin123",
        name="System Admin",
        role="Admin",
        approval_status="approved"
    )
    print(f"✅ Created admin: {admin.name}")

    # Create customers
    customers = []
    for i in range(15):
        customer = User.objects.create_user(
            email=f"customer{i+1}@example.com",
            password="customer123",
            name=f"Customer {i+1}",
            role="Customer",
            phone_no=f"+1234567{i:03d}",
            approval_status="approved"
        )
        customers.append(customer)
        print(f"✅ Created customer: {customer.name}")

    # Create cooks
    cooks = []
    for i in range(5):
        cook = User.objects.create_user(
            email=f"cook{i+1}@example.com",
            password="cook123",
            name=f"Chef {i+1}",
            role="Cook",
            phone_no=f"+1234568{i:03d}",
            approval_status="approved"
        )
        cooks.append(cook)
        print(f"✅ Created cook: {cook.name}")

    # Create delivery agents
    delivery_agents = []
    for i in range(3):
        agent = User.objects.create_user(
            email=f"agent{i+1}@example.com",
            password="agent123",
            name=f"Delivery Agent {i+1}",
            role="DeliveryAgent",
            phone_no=f"+1234569{i:03d}",
            approval_status="approved"
        )
        delivery_agents.append(agent)
        print(f"✅ Created delivery agent: {agent.name}")

    # Create some addresses for customers
    addresses = []
    for customer in customers[:5]:  # Create addresses for first 5 customers
        address = UserAddress.objects.create(
            user=customer,
            label="Home",
            address_line1=f"{random.randint(100, 999)} Main St",
            city="New York",
            pincode="10001",
            is_default=True
        )
        addresses.append(address)

    # Create some food items
    foods = []
    food_names = [
        "Margherita Pizza", "Chicken Tikka Masala", "Pad Thai",
        "Beef Burger", "Caesar Salad", "Fish and Chips"
    ]

    for i, food_name in enumerate(food_names):
        cook = cooks[i % len(cooks)]  # Assign to different cooks
        food = Food.objects.create(
            name=food_name,
            category="Main Course",
            description=f"Delicious {food_name.lower()}",
            chef=cook,
            is_available=True,
            status="Approved",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        foods.append(food)
        print(f"✅ Created food: {food.name}")

        # Create prices for the food
        FoodPrice.objects.create(
            food=food,
            cook=cook,
            size="Medium",
            price=15.99
        )

    # Create orders
    orders = []
    for i in range(20):
        customer = random.choice(customers)
        cook = random.choice(cooks)

        # Create order
        order = Order.objects.create(
            customer=customer,
            chef=cook,
            status=random.choice(["confirmed", "preparing", "ready", "out_for_delivery", "delivered"]),
            payment_status=random.choice(["pending", "paid"]),
            subtotal=25.50,
            tax_amount=2.55,
            delivery_fee=3.00,
            total_amount=31.05
        )

        # Add order items
        for food in foods[:random.randint(1, 3)]:
            food_price = food.prices.first()
            if food_price:
                OrderItem.objects.create(
                    order=order,
                    price=food_price,
                    quantity=random.randint(1, 2),
                    unit_price=food_price.price,
                    total_price=food_price.price * random.randint(1, 2),
                    food_name=food.name,
                    food_description=food.description or ""
                )

        orders.append(order)
        print(f"✅ Created order: {order.order_number}")

    # Create communications
    communication_subjects = [
        "Order delayed", "Missing items", "Food quality issue",
        "Delivery problem", "Payment issue", "App feedback"
    ]

    for i in range(10):
        customer = random.choice(customers)
        communication = Communication.objects.create(
            user=customer,
            communication_type=random.choice(["complaint", "feedback", "inquiry"]),
            subject=random.choice(communication_subjects),
            message=f"This is a test message about {random.choice(['order', 'delivery', 'food'])} issue.",
            status=random.choice(["pending", "in_progress", "resolved"]),
            priority=random.choice(["low", "medium", "high"])
        )
        print(f"✅ Created communication: {communication.subject}")

    print("\\n📊 Summary:")
    print(f"   • Users: {User.objects.count()}")
    print(f"   • Orders: {Order.objects.count()}")
    print(f"   • Foods: {Food.objects.count()}")
    print(f"   • Communications: {Communication.objects.count()}")

    print("\\n✅ Admin test data created successfully!")
    print("You can now test admin features like:")
    print("  • User management")
    print("  • Order management")
    print("  • Food menu management")
    print("  • Communication handling")
    print("  • Analytics and reporting")

if __name__ == "__main__":
    create_admin_test_data()
