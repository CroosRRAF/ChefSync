#!/usr/bin/env python3
"""
Simple sample data creation script for ChefSync
Creates 3 users per role and interrelated sample data
"""
import os
import random
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

import django
from django.utils import timezone

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# Import models
from apps.authentication.models import Admin, Cook, Customer, DeliveryAgent, User
from apps.food.models import Cuisine, Food, FoodCategory, FoodPrice
from apps.orders.models import Order, OrderItem


def create_users():
    """Create 3 users per role"""
    print("Creating users...")

    # Admins
    for i in range(3):
        user = User.objects.create_user(
            email=f"admin{i+1}@chefsync.com",
            username=f"admin{i+1}@chefsync.com",
            name=f"Admin User {i+1}",
            phone_no=f"+123456789{i}",
            gender="Male" if i % 2 == 0 else "Female",
            address=f"Admin Address {i+1}",
            password="password123",
            role="Admin",
            email_verified=True,
            approval_status="approved",
        )
        Admin.objects.create(user=user)
        print(f"Created admin: {user.name}")

    # Customers
    for i in range(3):
        user = User.objects.create_user(
            email=f"customer{i+1}@chefsync.com",
            username=f"customer{i+1}@chefsync.com",
            name=f"Customer User {i+1}",
            phone_no=f"+198765432{i}",
            gender="Female" if i % 2 == 0 else "Male",
            address=f"Customer Address {i+1}",
            password="password123",
            role="Customer",
            email_verified=True,
            approval_status="approved",
        )
        Customer.objects.create(user=user)
        print(f"Created customer: {user.name}")

    # Cooks
    for i in range(3):
        user = User.objects.create_user(
            email=f"cook{i+1}@chefsync.com",
            username=f"cook{i+1}@chefsync.com",
            name=f"Cook User {i+1}",
            phone_no=f"+112233445{i}",
            gender="Male" if i % 2 == 0 else "Female",
            address=f"Cook Address {i+1}",
            password="password123",
            role="Cook",
            email_verified=True,
            approval_status="approved",
        )
        Cook.objects.create(
            user=user,
            specialty=["Italian", "Chinese", "Mexican"][i % 3],
            kitchen_location=f"Kitchen {i+1}",
            experience_years=random.randint(2, 10),
            rating_avg=round(random.uniform(4.0, 5.0), 2),
            availability_hours="9 AM - 9 PM",
        )
        print(f"Created cook: {user.name}")

    # Delivery Agents
    for i in range(3):
        user = User.objects.create_user(
            email=f"delivery{i+1}@chefsync.com",
            username=f"delivery{i+1}@chefsync.com",
            name=f"Delivery User {i+1}",
            phone_no=f"+155566677{i}",
            gender="Male",
            address=f"Delivery Address {i+1}",
            password="password123",
            role="DeliveryAgent",
            email_verified=True,
            approval_status="approved",
        )
        DeliveryAgent.objects.create(
            user=user,
            vehicle_type=["bike", "car", "scooter"][i % 3],
            license_no=f"LICENSE{i+1}",
            vehicle_number=f"VEH{i+1}",
            current_location=f"Location {i+1}",
            is_available=True,
        )
        print(f"Created delivery agent: {user.name}")


def create_food_data():
    """Create cuisines, categories, foods, and prices"""
    print("Creating food data...")

    # Cuisines
    cuisines = []
    for name in ["Italian", "Chinese", "Mexican"]:
        cuisine = Cuisine.objects.create(
            name=name, description=f"{name} cuisine", is_active=True
        )
        cuisines.append(cuisine)
        print(f"Created cuisine: {cuisine.name}")

    # Categories
    categories = []
    for cuisine in cuisines:
        for cat_name in ["Main Course", "Appetizers"]:
            category = FoodCategory.objects.create(
                name=cat_name,
                cuisine=cuisine,
                description=f"{cat_name} in {cuisine.name}",
                is_active=True,
            )
            categories.append(category)

    # Foods and Prices
    cooks = list(Cook.objects.all())
    for i, category in enumerate(categories):
        for j in range(2):  # 2 foods per category
            cook = cooks[(i + j) % len(cooks)]
            food = Food.objects.create(
                name=f"{category.name} {j+1} - {category.cuisine.name}",
                description=f"Delicious {category.name.lower()} from {category.cuisine.name}",
                status="Approved",
                chef=cook.user,
                food_category=category,
                is_available=True,
                preparation_time=random.randint(15, 45),
                rating_average=round(random.uniform(4.0, 5.0), 1),
                total_reviews=random.randint(10, 50),
            )

            # Prices for different sizes
            for size, price in [("Small", 10.99), ("Medium", 15.99), ("Large", 20.99)]:
                FoodPrice.objects.create(
                    food=food, size=size, price=Decimal(str(price)), cook=cook.user
                )
            print(f"Created food: {food.name} with prices")


def create_orders():
    """Create orders for customers"""
    print("Creating orders...")

    customers = list(Customer.objects.all())
    cooks = list(Cook.objects.all())
    delivery_agents = list(DeliveryAgent.objects.all())
    food_prices = list(FoodPrice.objects.all())

    for customer in customers:
        # Each customer gets 2-3 orders
        for order_num in range(random.randint(2, 3)):
            cook = random.choice(cooks)
            delivery_agent = random.choice(delivery_agents)

            order = Order.objects.create(
                customer=customer.user,
                chef=cook.user,
                delivery_partner=delivery_agent.user,
                status=random.choice(
                    ["confirmed", "preparing", "ready", "out_for_delivery", "delivered"]
                ),
                payment_status="paid",
                payment_method="card",
                delivery_address=f"{customer.user.address} - Order {order_num+1}",
                subtotal=Decimal("0.00"),
                tax_amount=Decimal("2.50"),
                delivery_fee=Decimal("3.99"),
                total_amount=Decimal("0.00"),
            )

            # Add 1-3 items to order
            subtotal = Decimal("0.00")
            selected_prices = random.sample(food_prices, random.randint(1, 3))
            for price in selected_prices:
                quantity = random.randint(1, 2)
                unit_price = price.price
                total_price = quantity * unit_price
                subtotal += total_price

                OrderItem.objects.create(
                    order=order,
                    price=price,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    food_name=price.food.name,
                    food_description=(
                        price.food.description[:200] if price.food.description else ""
                    ),
                )

            order.subtotal = subtotal
            order.total_amount = subtotal + order.tax_amount + order.delivery_fee
            order.save()

            print(
                f"Created order {order.order_number} for {customer.user.name} with {len(selected_prices)} items"
            )


def run():
    """Run all data creation"""
    print("Starting sample data creation...")
    print("=" * 50)

    try:
        create_users()
        create_food_data()
        create_orders()

        print("\n" + "=" * 50)
        print("Sample data creation completed successfully!")
        print("=" * 50)

        # Summary
        print("\nSummary:")
        print(f"Admins: {Admin.objects.count()}")
        print(f"Customers: {Customer.objects.count()}")
        print(f"Cooks: {Cook.objects.count()}")
        print(f"Delivery Agents: {DeliveryAgent.objects.count()}")
        print(f"Cuisines: {Cuisine.objects.count()}")
        print(f"Food Categories: {FoodCategory.objects.count()}")
        print(f"Foods: {Food.objects.count()}")
        print(f"Food Prices: {FoodPrice.objects.count()}")
        print(f"Orders: {Order.objects.count()}")
        print(f"Order Items: {OrderItem.objects.count()}")

    except Exception as e:
        print(f"Error creating sample data: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    run()
if __name__ == "__main__":
    run()
