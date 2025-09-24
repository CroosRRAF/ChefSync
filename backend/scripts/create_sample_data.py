#!/usr/bin/env python3
"""
Comprehensive sample data creation script for ChefSync
This script creates 10 sample records for each model with realistic data and images
"""
import base64
import io
import json
import os
import random
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

import django
import requests
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.admin_management.models import (
    AdminActivityLog,
    AdminBackupLog,
    AdminDashboardWidget,
    AdminNotification,
    AdminQuickAction,
    AdminSystemSettings,
    SystemHealthMetric,
)

# Now import all models
from apps.authentication.models import (
    Admin,
    Cook,
    Customer,
    DeliveryAgent,
    DocumentType,
    EmailOTP,
    JWTToken,
    User,
    UserDocument,
)
from apps.communications.models import (
    Communication,
    CommunicationCategory,
    CommunicationResponse,
    CommunicationTag,
    CommunicationTemplate,
    Contact,
    Notification,
)
from apps.food.models import (
    Cuisine,
    Food,
    FoodCategory,
    FoodImage,
    FoodPrice,
    FoodReview,
    Offer,
)
from apps.orders.models import (
    CartItem,
    Delivery,
    DeliveryReview,
    Order,
    OrderItem,
    OrderStatusHistory,
)
from apps.payments.models import Payment, PaymentMethod, Refund, Transaction
from apps.users.models import ChefProfile, DeliveryProfile, UserProfile


class SampleDataCreator:
    def __init__(self):
        self.created_objects = {
            "users": [],
            "admins": [],
            "customers": [],
            "cooks": [],
            "delivery_agents": [],
            "cuisines": [],
            "food_categories": [],
            "foods": [],
            "food_prices": [],
            "orders": [],
            "admin_activity_logs": [],
            "admin_backup_logs": [],
            "admin_dashboard_widgets": [],
            "admin_quick_actions": [],
            "system_health_metrics": [],
            "document_types": [],
            "email_otps": [],
            "jwt_tokens": [],
            "user_documents": [],
            "communication_responses": [],
            "communication_templates": [],
            "cart_items": [],
            "deliveries": [],
            "delivery_reviews": [],
            "order_status_histories": [],
            "payment_methods": [],
            "refunds": [],
            "transactions": [],
            "chef_profiles": [],
            "delivery_profiles": [],
        }

    def create_placeholder_image(
        self, text="Sample", size=(300, 300), color=(70, 130, 180)
    ):
        """Create a simple placeholder image"""
        img = Image.new("RGB", size, color=color)
        # For now, just return a simple colored image
        img_io = io.BytesIO()
        img.save(img_io, format="JPEG", quality=85)
        img_io.seek(0)
        return img_io.getvalue()

    def create_users(self):
        """Create 20 sample users for each role with mixed approval statuses"""
        print("Creating users...")

        # Sample user data - expanded to 20 users with mixed approval statuses
        user_data = [
            # Admins (all approved)
            {
                "name": "John Smith",
                "email": "john.admin@chefsync.com",
                "role": "Admin",
                "approval_status": "approved",
            },
            {
                "name": "Sarah Johnson",
                "email": "sarah.admin@chefsync.com",
                "role": "Admin",
                "approval_status": "approved",
            },
            {
                "name": "Mike Wilson",
                "email": "mike.admin@chefsync.com",
                "role": "Admin",
                "approval_status": "approved",
            },
            {
                "name": "Emily Davis",
                "email": "emily.admin@chefsync.com",
                "role": "Admin",
                "approval_status": "approved",
            },
            {
                "name": "David Brown",
                "email": "david.admin@chefsync.com",
                "role": "Admin",
                "approval_status": "approved",
            },
            # Customers (all approved - customers don't need approval)
            {
                "name": "Alice Cooper",
                "email": "alice.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Bob Taylor",
                "email": "bob.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Carol White",
                "email": "carol.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Dan Miller",
                "email": "dan.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Eve Garcia",
                "email": "eve.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Frank Lee",
                "email": "frank.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Grace Kim",
                "email": "grace.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Henry Chen",
                "email": "henry.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Ivy Patel",
                "email": "ivy.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            {
                "name": "Jack Wong",
                "email": "jack.customer@gmail.com",
                "role": "Customer",
                "approval_status": "approved",
            },
            # Cooks (mixed approval statuses)
            {
                "name": "Lisa Garcia",
                "email": "lisa.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "approved",
            },
            {
                "name": "Chef Marco",
                "email": "marco.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "approved",
            },
            {
                "name": "Anna Rodriguez",
                "email": "anna.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "approved",
            },
            {
                "name": "Tom Italian",
                "email": "tom.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "pending",
            },
            {
                "name": "Sophie French",
                "email": "sophie.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "pending",
            },
            {
                "name": "Raj Indian",
                "email": "raj.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "rejected",
            },
            {
                "name": "Maria Mexican",
                "email": "maria.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "approved",
            },
            {
                "name": "Ken Japanese",
                "email": "ken.cook@chefsync.com",
                "role": "Cook",
                "approval_status": "pending",
            },
            # Delivery Agents (mixed approval statuses)
            {
                "name": "Tom Anderson",
                "email": "tom.delivery@chefsync.com",
                "role": "DeliveryAgent",
                "approval_status": "approved",
            },
            {
                "name": "James Taylor",
                "email": "james.delivery@chefsync.com",
                "role": "DeliveryAgent",
                "approval_status": "approved",
            },
            {
                "name": "Paul Walker",
                "email": "paul.delivery@chefsync.com",
                "role": "DeliveryAgent",
                "approval_status": "approved",
            },
            {
                "name": "Sam Wilson",
                "email": "sam.delivery@chefsync.com",
                "role": "DeliveryAgent",
                "approval_status": "pending",
            },
            {
                "name": "Chris Evans",
                "email": "chris.delivery@chefsync.com",
                "role": "DeliveryAgent",
                "approval_status": "pending",
            },
            {
                "name": "Robert Downey",
                "email": "robert.delivery@chefsync.com",
                "role": "DeliveryAgent",
                "approval_status": "rejected",
            },
        ]

        for data in user_data:
            if not User.objects.filter(email=data["email"]).exists():
                user = User.objects.create_user(
                    email=data["email"],
                    username=data["email"],
                    name=data["name"],
                    phone_no=f"+1{random.randint(1000000000, 9999999999)}",
                    gender=random.choice(["Male", "Female", "Other"]),
                    address=f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Park Blvd', 'First St'])}",
                    password="password123",
                    role=data["role"],
                    email_verified=True,
                    approval_status=data["approval_status"],
                )
                self.created_objects["users"].append(user)
                print(
                    f"Created user: {user.name} ({user.role}) - Status: {user.approval_status}"
                )
            else:
                # Add existing user to the list so other methods can use them
                existing_user = User.objects.get(email=data["email"])
                self.created_objects["users"].append(existing_user)
                print(f"User {data['email']} already exists - added to created objects")

    def create_role_profiles(self):
        """Create role-specific profiles"""
        print("Creating role profiles...")

        # Create Admin profiles
        admin_users = [u for u in self.created_objects["users"] if u.role == "Admin"]
        for user in admin_users:
            if (
                not hasattr(user, "admin_profile")
                and not Admin.objects.filter(user=user).exists()
            ):
                admin = Admin.objects.create(user=user)
                self.created_objects["admins"].append(admin)
                print(f"Created admin profile for {user.name}")

        # Create Customer profiles
        customer_users = [
            u for u in self.created_objects["users"] if u.role == "Customer"
        ]
        for user in customer_users:
            if (
                not hasattr(user, "customer")
                and not Customer.objects.filter(user=user).exists()
            ):
                customer = Customer.objects.create(user=user)
                self.created_objects["customers"].append(customer)
                print(f"Created customer profile for {user.name}")

        # Create Cook profiles
        cook_users = [u for u in self.created_objects["users"] if u.role == "Cook"]
        for user in cook_users:
            if (
                not hasattr(user, "cook")
                and not Cook.objects.filter(user=user).exists()
            ):
                cook = Cook.objects.create(
                    user=user,
                    specialty=random.choice(
                        ["Italian", "Chinese", "Mexican", "Indian", "American"]
                    ),
                    kitchen_location=f"{random.randint(100, 999)} Kitchen St",
                    experience_years=random.randint(2, 15),
                    rating_avg=round(random.uniform(4.0, 5.0), 2),
                    availability_hours="9:00 AM - 10:00 PM",
                )
                self.created_objects["cooks"].append(cook)
                print(f"Created cook profile for {user.name}")

        # Create DeliveryAgent profiles
        delivery_users = [
            u for u in self.created_objects["users"] if u.role == "DeliveryAgent"
        ]
        for user in delivery_users:
            if (
                not hasattr(user, "deliveryagent")
                and not DeliveryAgent.objects.filter(user=user).exists()
            ):
                agent = DeliveryAgent.objects.create(
                    user=user,
                    vehicle_type=random.choice(["bike", "car", "scooter"]),
                    license_no=f"DL{random.randint(100000, 999999)}",
                    vehicle_number=f"{random.choice(['CAR', 'BIK'])}-{random.randint(1000, 9999)}",
                    current_location=f"{random.randint(100, 999)} Delivery Ave",
                    is_available=True,
                )
                self.created_objects["delivery_agents"].append(agent)
                print(f"Created delivery agent profile for {user.name}")

    def create_user_profiles(self):
        """Create UserProfile objects"""
        print("Creating user profiles...")

        for user in self.created_objects["users"]:
            if (
                not hasattr(user, "profile")
                and not UserProfile.objects.filter(user=user).exists()
            ):
                profile_image = self.create_placeholder_image(
                    f"{user.name[:2]}",
                    color=(
                        random.randint(50, 200),
                        random.randint(50, 200),
                        random.randint(50, 200),
                    ),
                )

                profile = UserProfile.objects.create(
                    user=user,
                    address=user.address or f"{random.randint(100, 999)} Sample St",
                    date_of_birth=timezone.now().date()
                    - timedelta(days=random.randint(6570, 18250)),  # 18-50 years old
                    gender=user.gender or random.choice(["male", "female", "other"]),
                    bio=f"Hello, I'm {user.name}. Nice to meet you!",
                    preferences={
                        "favorite_cuisine": random.choice(
                            ["italian", "chinese", "mexican", "indian"]
                        )
                    },
                )
                print(f"Created user profile for {user.name}")

    def create_cuisines(self):
        """Create cuisine categories"""
        print("Creating cuisines...")

        cuisines_data = [
            {
                "name": "Italian",
                "description": "Authentic Italian cuisine with pasta, pizza, and more",
            },
            {
                "name": "Chinese",
                "description": "Traditional Chinese dishes with bold flavors",
            },
            {"name": "Mexican", "description": "Spicy and flavorful Mexican food"},
            {"name": "Indian", "description": "Rich and aromatic Indian cuisine"},
            {"name": "American", "description": "Classic American comfort food"},
            {"name": "Japanese", "description": "Fresh and delicate Japanese cuisine"},
            {"name": "Thai", "description": "Sweet, sour, and spicy Thai dishes"},
            {"name": "French", "description": "Elegant French cuisine"},
            {"name": "Mediterranean", "description": "Healthy Mediterranean dishes"},
            {
                "name": "Korean",
                "description": "Fermented and grilled Korean specialties",
            },
        ]

        for data in cuisines_data:
            if not Cuisine.objects.filter(name=data["name"]).exists():
                cuisine_image = self.create_placeholder_image(data["name"][:3])

                cuisine = Cuisine.objects.create(
                    name=data["name"],
                    description=data["description"],
                    is_active=True,
                    sort_order=len(self.created_objects["cuisines"]) + 1,
                )
                self.created_objects["cuisines"].append(cuisine)
                print(f"Created cuisine: {cuisine.name}")

    def create_food_categories(self):
        """Create food categories for each cuisine"""
        print("Creating food categories...")

        categories = ["Appetizers", "Main Course", "Desserts", "Beverages", "Salads"]

        for cuisine in self.created_objects["cuisines"]:
            for category_name in categories:
                if not FoodCategory.objects.filter(
                    name=category_name, cuisine=cuisine
                ).exists():
                    category_image = self.create_placeholder_image(category_name[:3])

                    category = FoodCategory.objects.create(
                        name=category_name,
                        cuisine=cuisine,
                        description=f"{category_name} from {cuisine.name} cuisine",
                        is_active=True,
                        sort_order=categories.index(category_name) + 1,
                    )
                    self.created_objects["food_categories"].append(category)
                    print(f"Created category: {category.name} for {cuisine.name}")

    def create_foods(self):
        """Create food items"""
        print("Creating foods...")

        # Sample food data for different cuisines
        food_samples = {
            "Italian": [
                {"name": "Margherita Pizza", "price": 16.99, "prep_time": 15},
                {"name": "Spaghetti Carbonara", "price": 14.99, "prep_time": 20},
                {"name": "Lasagna", "price": 18.99, "prep_time": 45},
                {"name": "Chicken Parmigiana", "price": 22.99, "prep_time": 30},
                {"name": "Tiramisu", "price": 8.99, "prep_time": 10},
            ],
            "Chinese": [
                {"name": "Sweet and Sour Pork", "price": 15.99, "prep_time": 25},
                {"name": "Kung Pao Chicken", "price": 14.99, "prep_time": 20},
                {"name": "Beef with Broccoli", "price": 16.99, "prep_time": 18},
                {"name": "Fried Rice", "price": 12.99, "prep_time": 15},
                {"name": "Spring Rolls", "price": 6.99, "prep_time": 10},
            ],
            "Mexican": [
                {"name": "Chicken Tacos", "price": 11.99, "prep_time": 15},
                {"name": "Beef Burrito", "price": 13.99, "prep_time": 12},
                {"name": "Quesadilla", "price": 9.99, "prep_time": 10},
                {"name": "Nachos Supreme", "price": 12.99, "prep_time": 8},
                {"name": "Guacamole", "price": 7.99, "prep_time": 5},
            ],
            "Indian": [
                {"name": "Chicken Tikka Masala", "price": 17.99, "prep_time": 30},
                {"name": "Biryani", "price": 16.99, "prep_time": 40},
                {"name": "Naan Bread", "price": 4.99, "prep_time": 8},
                {"name": "Samosas", "price": 6.99, "prep_time": 12},
                {"name": "Mango Lassi", "price": 5.99, "prep_time": 3},
            ],
        }

        admin_users = [u for u in self.created_objects["users"] if u.role == "Admin"]
        cook_users = [u for u in self.created_objects["users"] if u.role == "Cook"]

        if not admin_users:
            print(
                "Warning: No admin users found. Foods will be created without admin approval."
            )

        for cuisine in self.created_objects["cuisines"][:4]:  # First 4 cuisines
            if cuisine.name in food_samples:
                main_course_category = next(
                    (
                        cat
                        for cat in self.created_objects["food_categories"]
                        if cat.cuisine == cuisine and cat.name == "Main Course"
                    ),
                    None,
                )

                if main_course_category and cook_users:
                    for food_data in food_samples[cuisine.name]:
                        chef = random.choice(cook_users)
                        admin = random.choice(admin_users) if admin_users else None

                        food = Food.objects.create(
                            name=food_data["name"],
                            category=random.choice(
                                ["Main Course", "Appetizer", "Dessert"]
                            ),
                            description=f"Delicious {food_data['name']} prepared with fresh ingredients",
                            status="Approved",
                            admin=admin,
                            chef=chef,
                            food_category=main_course_category,
                            is_available=True,
                            is_featured=random.choice([True, False]),
                            preparation_time=food_data["prep_time"],
                            calories_per_serving=random.randint(300, 800),
                            ingredients=["fresh ingredients", "spices", "herbs"],
                            allergens=random.choice(
                                [[], ["nuts"], ["dairy"], ["gluten"]]
                            ),
                            nutritional_info={
                                "protein": random.randint(10, 30),
                                "carbs": random.randint(20, 60),
                            },
                            is_vegetarian=random.choice([True, False]),
                            is_vegan=random.choice([True, False]),
                            is_gluten_free=random.choice([True, False]),
                            spice_level=random.choice(["mild", "medium", "hot"]),
                            rating_average=round(random.uniform(4.0, 5.0), 1),
                            total_reviews=random.randint(10, 100),
                            total_orders=random.randint(50, 500),
                        )
                        self.created_objects["foods"].append(food)
                        print(f"Created food: {food.name}")

    def create_food_prices(self):
        """Create food prices for different sizes"""
        print("Creating food prices...")

        for food in self.created_objects["foods"]:
            cook = food.chef
            if cook:
                base_price = Decimal("15.99")

                for size in ["Small", "Medium", "Large"]:
                    if size == "Small":
                        price = base_price * Decimal("0.8")
                    elif size == "Medium":
                        price = base_price
                    else:
                        price = base_price * Decimal("1.3")

                    food_price = FoodPrice.objects.create(
                        food=food,
                        size=size,
                        price=price,
                        cook=cook,
                        image_url=f"https://example.com/food_{food.id}_{size.lower()}.jpg",
                    )
                    self.created_objects["food_prices"].append(food_price)
                    print(f"Created price for {food.name} - {size}: ${price}")

    def create_food_images(self):
        """Create food images"""
        print("Creating food images...")

        for food in self.created_objects["foods"][:5]:  # First 5 foods
            for i in range(2):  # 2 images per food
                food_image = self.create_placeholder_image(food.name[:3])

                food_img = FoodImage.objects.create(
                    food=food,
                    caption=f"{food.name} - Image {i+1}",
                    is_primary=i == 0,
                    sort_order=i + 1,
                )
                print(f"Created image for {food.name}")

    def create_offers(self):
        """Create offers for food prices"""
        print("Creating offers...")

        for food_price in self.created_objects["food_prices"][:10]:  # First 10 prices
            if random.choice([True, False]):  # 50% chance of having an offer
                offer = Offer.objects.create(
                    description=f"Special {random.randint(10, 30)}% off on {food_price.food.name}",
                    discount=Decimal(str(random.randint(10, 30))),
                    valid_until=timezone.now().date()
                    + timedelta(days=random.randint(7, 30)),
                    price=food_price,
                )
                print(f"Created offer for {food_price.food.name}")

    def create_orders(self):
        """Create sample orders"""
        print("Creating orders...")

        customer_users = [
            u for u in self.created_objects["users"] if u.role == "Customer"
        ]
        cook_users = [u for u in self.created_objects["users"] if u.role == "Cook"]

        if customer_users and cook_users and self.created_objects["food_prices"]:
            for i in range(10):
                customer = random.choice(customer_users)
                chef = random.choice(cook_users)

                order = Order.objects.create(
                    customer=customer,
                    chef=chef,
                    status=random.choice(["pending", "confirmed", "delivered"]),
                    payment_status="paid",
                    payment_method="card",
                    delivery_address=f"{random.randint(100, 999)} Delivery St, City",
                    delivery_instructions="Please ring doorbell",
                    subtotal=Decimal("0.00"),
                    tax_amount=Decimal("2.50"),
                    delivery_fee=Decimal("3.99"),
                    total_amount=Decimal("0.00"),
                    customer_notes="Thank you!",
                )
                self.created_objects["orders"].append(order)

                # Add order items - ensure no duplicates for same order
                selected_prices = set()
                subtotal = Decimal("0.00")
                for _ in range(random.randint(1, 3)):
                    # Keep trying until we find a unique food price for this order
                    attempts = 0
                    while attempts < 10:  # Prevent infinite loop
                        food_price = random.choice(self.created_objects["food_prices"])
                        if food_price not in selected_prices:
                            selected_prices.add(food_price)
                            break
                        attempts += 1
                    else:
                        # If we can't find a unique price, skip this item
                        continue

                    quantity = random.randint(1, 3)
                    unit_price = food_price.price
                    total_price = quantity * unit_price
                    subtotal += total_price

                    OrderItem.objects.create(
                        order=order,
                        price=food_price,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        food_name=food_price.food.name,
                        food_description=food_price.food.description,
                    )

                order.subtotal = subtotal
                order.total_amount = subtotal + order.tax_amount + order.delivery_fee
                order.save()

                print(f"Created order: {order.order_number}")

    def create_reviews(self):
        """Create food reviews"""
        print("Creating reviews...")

        customer_users = [
            u for u in self.created_objects["users"] if u.role == "Customer"
        ]

        if customer_users and self.created_objects["food_prices"]:
            for i in range(20):  # Create 20 reviews
                customer = random.choice(customer_users)
                food_price = random.choice(self.created_objects["food_prices"])

                # Check if review already exists
                if not FoodReview.objects.filter(
                    customer=customer, price=food_price
                ).exists():
                    review = FoodReview.objects.create(
                        price=food_price,
                        customer=customer,
                        rating=random.randint(4, 5),
                        comment=f"Great food! I really enjoyed the {food_price.food.name}.",
                        taste_rating=random.randint(4, 5),
                        presentation_rating=random.randint(4, 5),
                        value_rating=random.randint(3, 5),
                    )
                    print(
                        f"Created review for {food_price.food.name} by {customer.name}"
                    )

    def create_communications(self):
        """Create communication records"""
        print("Creating communications...")

        # Create communication categories
        categories = [
            "General Inquiry",
            "Order Issue",
            "Payment Problem",
            "Technical Support",
        ]
        for cat_name in categories:
            if not CommunicationCategory.objects.filter(name=cat_name).exists():
                CommunicationCategory.objects.create(
                    name=cat_name,
                    description=f"Category for {cat_name.lower()} related communications",
                )

        # Create communication tags
        tags = ["urgent", "resolved", "pending", "escalated"]
        for tag_name in tags:
            if not CommunicationTag.objects.filter(name=tag_name).exists():
                CommunicationTag.objects.create(
                    name=tag_name, color=f"#{random.randint(100000, 999999):06x}"
                )

        # Create contacts
        for i in range(5):
            user = random.choice(self.created_objects["users"])
            Contact.objects.create(
                name=user.name,
                email=user.email,
                message=f"Hello, I have a question about your service. This is inquiry #{i+1}.",
                user=user,
            )
            print(f"Created contact from {user.name}")

    def create_notifications(self):
        """Create notifications"""
        print("Creating notifications...")

        for user in self.created_objects["users"]:
            for i in range(2):  # 2 notifications per user
                Notification.objects.create(
                    subject=f"Welcome to ChefSync #{i+1}",
                    message=f"Thank you for joining ChefSync, {user.name}! Enjoy our services.",
                    user=user,
                    status=random.choice(["Read", "Unread"]),
                )
                print(f"Created notification for {user.name}")

    def create_payments(self):
        """Create payment records"""
        print("Creating payments...")

        for order in self.created_objects["orders"]:
            if random.choice([True, False]):  # 50% of orders have payment records
                payment = Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    payment_method="card",
                    status="completed",
                    payment_id=f"PAY_{random.randint(100000, 999999)}",
                    provider_payment_id=f"stripe_{random.randint(100000, 999999)}",
                    provider_response={"status": "success"},
                    currency="USD",
                )
                print(f"Created payment for order {order.order_number}")

    def create_admin_data(self):
        """Create admin-specific data"""
        print("Creating admin data...")

        admin_users = [u for u in self.created_objects["users"] if u.role == "Admin"]
        if not admin_users:
            return

        # Create admin notifications
        for i in range(10):
            AdminNotification.objects.create(
                title=f"System Alert #{i+1}",
                message=f"This is a sample admin notification #{i+1}",
                notification_type=random.choice(
                    ["system_alert", "user_activity", "order_update"]
                ),
                priority=random.choice(["low", "medium", "high"]),
                is_read=random.choice([True, False]),
            )

        # Create system settings
        settings_data = [
            ("site_name", "ChefSync", "string", "general"),
            ("max_orders_per_day", "100", "integer", "general"),
            ("enable_notifications", "true", "boolean", "notifications"),
            ("delivery_fee", "3.99", "float", "general"),
            ("maintenance_mode", "false", "boolean", "system"),
            ("support_email", "support@chefsync.com", "string", "contact"),
        ]

        for key, value, setting_type, category in settings_data:
            if not AdminSystemSettings.objects.filter(key=key).exists():
                AdminSystemSettings.objects.create(
                    key=key,
                    value=value,
                    setting_type=setting_type,
                    category=category,
                    description=f"Setting for {key.replace('_', ' ')}",
                )

        # Create admin activity logs
        for admin in admin_users:
            for i in range(5):
                AdminActivityLog.objects.create(
                    admin=admin,
                    action=random.choice(
                        [
                            "login",
                            "logout",
                            "user_approved",
                            "order_cancelled",
                            "settings_updated",
                        ]
                    ),
                    resource_type=random.choice(["user", "order", "food", "system"]),
                    resource_id=random.randint(1, 100),
                    description=f"Admin {admin.name} performed {random.choice(['login', 'logout', 'approval', 'update'])} action #{i+1}",
                    ip_address=f"192.168.1.{random.randint(1, 255)}",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                )
                print(f"Created activity log for {admin.name}")

        # Create admin backup logs
        for i in range(5):
            status = random.choice(["success", "failed", "in_progress"])
            file_path = f"/backups/backup_{i+1}.sql" if status == "success" else ""
            file_size = (
                random.randint(1000000, 50000000) if status == "success" else None
            )
            completed_at = (
                timezone.now() - timedelta(hours=random.randint(0, 23))
                if status in ["success", "failed"]
                else None
            )

            AdminBackupLog.objects.create(
                backup_type=random.choice(["full", "incremental", "database"]),
                status=status,
                file_path=file_path,
                file_size=file_size,
                started_at=timezone.now() - timedelta(hours=random.randint(1, 24)),
                completed_at=completed_at,
                error_message="Sample error message" if status == "failed" else "",
                created_by=random.choice(admin_users),
            )

        # Create admin dashboard widgets
        widget_types = ["stats_card", "chart", "table", "list", "gauge", "map"]
        for i in range(8):
            AdminDashboardWidget.objects.create(
                name=f"Widget {i+1}",
                widget_type=random.choice(widget_types),
                title=f"Widget {i+1}",
                description=f"Sample widget #{i+1}",
                data_source=f"/api/admin/widget-data/{i+1}",
                position_x=i % 4,
                position_y=i // 4,
                width=4,
                height=3,
                is_active=random.choice([True, False]),
                refresh_interval=300,
                config={"sample": f"config_{i+1}"},
            )

        # Create admin quick actions
        for i in range(6):
            AdminQuickAction.objects.create(
                name=f"Quick Action {i+1}",
                action_type=random.choice(
                    [
                        "create_user",
                        "approve_chef",
                        "view_orders",
                        "export_data",
                        "system_backup",
                        "maintenance_mode",
                        "clear_cache",
                        "send_notification",
                    ]
                ),
                title=f"Quick Action {i+1}",
                description=f"Sample quick action #{i+1}",
                icon="bx-cog",
                color=random.choice(["primary", "success", "warning", "danger"]),
                is_active=True,
                requires_confirmation=random.choice([True, False]),
                confirmation_message=(
                    "Are you sure you want to perform this action?"
                    if random.choice([True, False])
                    else ""
                ),
                position=i + 1,
                config={"sample": f"config_{i+1}"},
            )

        # Create system health metrics
        for i in range(20):
            SystemHealthMetric.objects.create(
                metric_type=random.choice(
                    [
                        "cpu_usage",
                        "memory_usage",
                        "disk_usage",
                        "database_connections",
                        "response_time",
                        "error_rate",
                        "active_users",
                        "api_calls",
                    ]
                ),
                value=round(random.uniform(10, 100), 2),
                unit=random.choice(["%", "MB", "GB", "Mbps"]),
                timestamp=timezone.now() - timedelta(minutes=i * 5),
                metadata={"sample": f"data_{i+1}"},
            )

    def create_document_types_and_user_documents(self):
        """Create document types and user documents"""
        print("Creating document types and user documents...")

        # Create document types
        document_types_data = [
            ("cook", "Food Safety Certificate", True, ["pdf", "jpg", "png"]),
            ("cook", "Business License", True, ["pdf", "jpg", "png"]),
            ("cook", "Health Certificate", True, ["pdf", "jpg", "png"]),
            ("cook", "Insurance Certificate", False, ["pdf", "jpg", "png"]),
            ("delivery_agent", "Driving License", True, ["pdf", "jpg", "png"]),
            ("delivery_agent", "Vehicle Registration", True, ["pdf", "jpg", "png"]),
            ("delivery_agent", "Insurance", True, ["pdf", "jpg", "png"]),
            ("delivery_agent", "Background Check", False, ["pdf", "jpg", "png"]),
        ]

        for category, name, is_required, allowed_types in document_types_data:
            if not DocumentType.objects.filter(name=name, category=category).exists():
                DocumentType.objects.create(
                    name=name,
                    category=category,
                    description=f"Required document for {category.replace('_', ' ')} verification",
                    is_required=is_required,
                    allowed_file_types=allowed_types,
                    max_file_size_mb=5,
                )
                print(f"Created document type: {name}")

        # Create user documents for cooks and delivery agents
        cook_users = [
            u
            for u in self.created_objects["users"]
            if u.role == "Cook" and u.approval_status == "approved"
        ]
        delivery_users = [
            u
            for u in self.created_objects["users"]
            if u.role == "DeliveryAgent" and u.approval_status == "approved"
        ]

        for user in cook_users + delivery_users:
            category = "cook" if user.role == "Cook" else "delivery_agent"
            doc_types = DocumentType.objects.filter(category=category)

            for doc_type in doc_types:
                if random.choice([True, False]):  # 50% chance of having document
                    UserDocument.objects.create(
                        user=user,
                        document_type=doc_type,
                        file=f"https://example.com/docs/{user.pk}_{doc_type.pk}.pdf",
                        file_name=f"{doc_type.name.lower().replace(' ', '_')}_{user.pk}.pdf",
                        file_size=random.randint(100000, 2000000),
                        file_type="application/pdf",
                        status=random.choice(["approved", "pending", "rejected"]),
                        is_visible_to_admin=True,
                    )
                    print(f"Created document for {user.name}: {doc_type.name}")

    def create_email_otps_and_jwt_tokens(self):
        """Create email OTPs and JWT tokens"""
        print("Creating email OTPs and JWT tokens...")

        # Create email OTPs
        for user in self.created_objects["users"][:10]:  # First 10 users
            EmailOTP.objects.create(
                email=user.email,
                purpose=random.choice(
                    ["registration", "password_reset", "email_verification"]
                ),
                expires_at=timezone.now() + timedelta(minutes=random.randint(5, 30)),
                is_used=random.choice([True, False]),
                attempts=random.randint(0, 3),
            )
            print(f"Created OTP for {user.email}")

        # Create JWT tokens
        for user in self.created_objects["users"]:
            # Create access token
            JWTToken.objects.create(
                user=user,
                token_hash=f"hash_{user.pk}_access_{random.randint(1000, 9999)}",
                token_type="access",
                jti=f"jti_access_{user.pk}_{random.randint(1000, 9999)}",
                expires_at=timezone.now() + timedelta(minutes=15),
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                device_info="Desktop",
                is_revoked=random.choice([True, False]),
            )

            # Create refresh token
            JWTToken.objects.create(
                user=user,
                token_hash=f"hash_{user.pk}_refresh_{random.randint(1000, 9999)}",
                token_type="refresh",
                jti=f"jti_refresh_{user.pk}_{random.randint(1000, 9999)}",
                expires_at=timezone.now() + timedelta(days=1),
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                device_info="Desktop",
                is_revoked=random.choice([True, False]),
            )

            print(f"Created JWT tokens for {user.name}")

    def create_communication_templates_and_responses(self):
        """Create communication templates and responses"""
        print("Creating communication templates and responses...")

        # Create communication templates
        templates_data = [
            ("order_confirmation", "Order Confirmation", "Thank you for your order!"),
            (
                "order_delivered",
                "Order Delivered",
                "Your order has been delivered successfully.",
            ),
            (
                "payment_failed",
                "Payment Failed",
                "Your payment could not be processed.",
            ),
            (
                "chef_approved",
                "Chef Approved",
                "Congratulations! Your chef account has been approved.",
            ),
            (
                "delivery_assigned",
                "Delivery Assigned",
                "A delivery agent has been assigned to your order.",
            ),
        ]

        for template_type, subject, content in templates_data:
            if not CommunicationTemplate.objects.filter(
                template_type=template_type
            ).exists():
                CommunicationTemplate.objects.create(
                    template_type=template_type,
                    name=subject,
                    subject=subject,
                    content=content,
                    is_active=True,
                    variables=["customer_name", "order_number"],
                )
                print(f"Created communication template: {subject}")

        # Create communication responses (replies to communications)
        communications = (
            Communication.objects.all()[:5] if Communication.objects.exists() else []
        )
        admin_users = [u for u in self.created_objects["users"] if u.role == "Admin"]

        for comm in communications:
            for i in range(random.randint(1, 3)):
                CommunicationResponse.objects.create(
                    communication=comm,
                    responder=random.choice(admin_users),
                    response=f"This is a sample response #{i+1} to the communication.",
                    is_internal=random.choice([True, False]),
                    attachments=[],
                )
                print(f"Created response for communication {comm.pk}")

    def create_cart_items_and_deliveries(self):
        """Create cart items and deliveries"""
        print("Creating cart items and deliveries...")

        customer_users = [
            u for u in self.created_objects["users"] if u.role == "Customer"
        ]
        delivery_agents = [
            u
            for u in self.created_objects["users"]
            if u.role == "DeliveryAgent" and u.approval_status == "approved"
        ]

        # Create cart items for some customers
        for customer in customer_users[:5]:  # First 5 customers
            for i in range(random.randint(1, 3)):
                if self.created_objects["food_prices"]:
                    food_price = random.choice(self.created_objects["food_prices"])
                    CartItem.objects.create(
                        customer=customer,
                        price=food_price,
                        quantity=random.randint(1, 3),
                        added_at=timezone.now()
                        - timedelta(minutes=random.randint(1, 60)),
                        notes=f"Sample notes for cart item #{i+1}",
                    )
                    print(f"Created cart item for {customer.name}")

        # Create deliveries for completed orders
        for order in self.created_objects["orders"]:
            if order.status == "delivered" and delivery_agents:
                delivery = Delivery.objects.create(
                    order=order,
                    delivery_agent=random.choice(delivery_agents),
                    status="delivered",
                    estimated_delivery_time=timezone.now()
                    + timedelta(hours=random.randint(1, 3)),
                    actual_delivery_time=timezone.now()
                    - timedelta(minutes=random.randint(10, 60)),
                    delivery_address=order.delivery_address,
                    delivery_instructions=order.delivery_instructions,
                    tracking_number=f"TRK{random.randint(100000, 999999)}",
                    delivery_fee=order.delivery_fee,
                    tip_amount=round(random.uniform(0, 10), 2),
                )
                self.created_objects["deliveries"].append(delivery)
                print(f"Created delivery for order {order.order_number}")

    def create_delivery_reviews_and_order_status_history(self):
        """Create delivery reviews and order status history"""
        print("Creating delivery reviews and order status history...")

        customer_users = [
            u for u in self.created_objects["users"] if u.role == "Customer"
        ]

        # Create delivery reviews
        for delivery in self.created_objects["deliveries"]:
            if random.choice([True, False]):  # 50% chance of review
                DeliveryReview.objects.create(
                    delivery=delivery,
                    customer=random.choice(customer_users),
                    delivery_agent=delivery.delivery_agent,
                    rating=random.randint(3, 5),
                    comment=f"Great delivery service! Agent was {random.choice(['punctual', 'courteous', 'efficient'])}.",
                    delivery_time_rating=random.randint(3, 5),
                    packaging_rating=random.randint(3, 5),
                    communication_rating=random.randint(3, 5),
                )
                print(f"Created delivery review for delivery {delivery.id}")

        # Create order status history
        status_options = [
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
        ]
        for order in self.created_objects["orders"]:
            # Create status history entries
            current_status_index = status_options.index(order.status)
            for i in range(current_status_index + 1):
                OrderStatusHistory.objects.create(
                    order=order,
                    status=status_options[i],
                    changed_by=random.choice(
                        [u for u in self.created_objects["users"] if u.role == "Admin"]
                    ),
                    notes=f"Order status changed to {status_options[i]}",
                    timestamp=timezone.now()
                    - timedelta(hours=current_status_index - i),
                )
                print(f"Created status history for order {order.order_number}")

    def create_payment_methods_and_transactions(self):
        """Create payment methods and transactions"""
        print("Creating payment methods and transactions...")

        # Create payment methods for users
        for user in self.created_objects["users"]:
            for i in range(random.randint(1, 2)):  # 1-2 payment methods per user
                PaymentMethod.objects.create(
                    user=user,
                    method_type=random.choice(["card", "bank_account", "wallet"]),
                    card_last_four=(
                        f"{random.randint(1000, 9999)}"
                        if random.choice([True, False])
                        else ""
                    ),
                    card_brand=(
                        random.choice(["visa", "mastercard", "amex", "discover"])
                        if random.choice([True, False])
                        else ""
                    ),
                    card_exp_month=random.randint(1, 12),
                    card_exp_year=random.randint(2024, 2030),
                    provider_payment_method_id=f"pm_{random.randint(1000000, 9999999)}",
                    provider_customer_id=f"cus_{random.randint(1000000, 9999999)}",
                    is_default=i == 0,
                    is_active=True,
                )
                print(f"Created payment method for {user.name}")

        # Create transactions for payments
        payments = Payment.objects.all()
        for payment in payments:
            Transaction.objects.create(
                payment=payment,
                transaction_id=f"txn_{random.randint(1000000, 9999999)}",
                amount=payment.amount,
                currency=payment.currency,
                status=random.choice(["success", "pending", "failed"]),
                provider=payment.payment_method,
                provider_transaction_id=f"prov_txn_{random.randint(1000000, 9999999)}",
                provider_response={
                    "status": "success",
                    "transaction_id": f"prov_{random.randint(1000, 9999)}",
                },
                processed_at=timezone.now() - timedelta(minutes=random.randint(1, 60)),
            )
            print(f"Created transaction for payment {payment.payment_id}")

    def create_refunds(self):
        """Create refunds for some payments"""
        print("Creating refunds...")

        payments = Payment.objects.filter(status="completed")
        for payment in payments[:3]:  # Create refunds for first 3 completed payments
            refund = Refund.objects.create(
                payment=payment,
                refund_id=f"ref_{random.randint(100000, 999999)}",
                amount=payment.amount
                * Decimal(str(random.uniform(0.5, 1.0))),  # Partial or full refund
                reason=random.choice(
                    ["customer_request", "order_cancelled", "quality_issue"]
                ),
                status=random.choice(["completed", "pending", "failed"]),
                provider_refund_id=f"prov_ref_{random.randint(100000, 999999)}",
                provider_response={"status": "success"},
                processed_at=timezone.now() - timedelta(hours=random.randint(1, 24)),
                notes="Sample refund notes",
            )
            print(f"Created refund for payment {payment.payment_id}")

    def create_chef_and_delivery_profiles(self):
        """Create chef and delivery profiles"""
        print("Creating chef and delivery profiles...")

        # Create chef profiles
        cook_users = [u for u in self.created_objects["users"] if u.role == "Cook"]
        for cook in cook_users:
            if (
                not hasattr(cook, "chef_profile")
                and not ChefProfile.objects.filter(user=cook).exists()
            ):
                ChefProfile.objects.create(
                    user=cook,
                    specialty_cuisines=[
                        cook.cook.specialty,
                        random.choice(["Italian", "Chinese", "Mexican"]),
                    ],
                    experience_years=cook.cook.experience_years,
                    certifications=["Food Safety Certificate", "Culinary Arts Diploma"],
                    bio=f"Experienced {cook.cook.specialty} chef with {cook.cook.experience_years} years of experience.",
                    approval_status=cook.approval_status,
                    rating_average=cook.cook.rating_avg,
                    total_orders=random.randint(50, 500),
                    total_reviews=random.randint(10, 100),
                    is_featured=random.choice([True, False]),
                )
                print(f"Created chef profile for {cook.name}")

        # Create delivery profiles
        delivery_users = [
            u for u in self.created_objects["users"] if u.role == "DeliveryAgent"
        ]
        for delivery_agent in delivery_users:
            if (
                not hasattr(delivery_agent, "delivery_profile")
                and not DeliveryProfile.objects.filter(user=delivery_agent).exists()
            ):
                DeliveryProfile.objects.create(
                    user=delivery_agent,
                    vehicle_type=delivery_agent.deliveryagent.vehicle_type,
                    vehicle_number=delivery_agent.deliveryagent.vehicle_number,
                    license_number=delivery_agent.deliveryagent.license_no,
                    insurance_info={
                        "provider": random.choice(
                            ["Geico", "Progressive", "State Farm"]
                        ),
                        "policy_number": f"POL{random.randint(100000, 999999)}",
                        "expiry_date": (
                            timezone.now().date()
                            + timedelta(days=random.randint(180, 365))
                        ).isoformat(),
                    },
                    is_available=delivery_agent.deliveryagent.is_available,
                    rating_average=round(random.uniform(4.0, 5.0), 2),
                    total_deliveries=random.randint(50, 500),
                    total_earnings=round(random.uniform(1000, 10000), 2),
                    approval_status=delivery_agent.approval_status,
                )
                print(f"Created delivery profile for {delivery_agent.name}")

    def run(self):
        """Run all data creation methods"""
        print("Starting comprehensive sample data creation...")
        print("=" * 60)

        try:
            self.create_users()
            self.create_role_profiles()
            self.create_user_profiles()
            self.create_cuisines()
            self.create_food_categories()
            self.create_foods()
            self.create_food_prices()
            self.create_food_images()
            self.create_offers()
            self.create_orders()
            self.create_reviews()
            self.create_communications()
            self.create_notifications()
            self.create_payments()
            self.create_admin_data()
            self.create_document_types_and_user_documents()
            self.create_email_otps_and_jwt_tokens()
            self.create_communication_templates_and_responses()
            self.create_cart_items_and_deliveries()
            self.create_delivery_reviews_and_order_status_history()
            self.create_payment_methods_and_transactions()
            self.create_refunds()
            self.create_chef_and_delivery_profiles()

            print("\n" + "=" * 60)
            print("Comprehensive sample data creation completed successfully!")
            print("=" * 60)

            # Print summary
            print("\nSummary:")
            print(f"Users created: {len(self.created_objects['users'])}")
            print(
                f"  - Admins: {len([u for u in self.created_objects['users'] if u.role == 'Admin'])}"
            )
            print(
                f"  - Customers: {len([u for u in self.created_objects['users'] if u.role == 'Customer'])}"
            )
            print(
                f"  - Cooks: {len([u for u in self.created_objects['users'] if u.role == 'Cook'])}"
            )
            print(
                f"  - Delivery Agents: {len([u for u in self.created_objects['users'] if u.role == 'DeliveryAgent'])}"
            )
            print(f"Cuisines created: {len(self.created_objects['cuisines'])}")
            print(
                f"Food categories created: {len(self.created_objects['food_categories'])}"
            )
            print(f"Foods created: {len(self.created_objects['foods'])}")
            print(f"Food prices created: {len(self.created_objects['food_prices'])}")
            print(f"Orders created: {len(self.created_objects['orders'])}")
            print(
                f"Admin activity logs: {len(self.created_objects['admin_activity_logs'])}"
            )
            print(
                f"Admin backup logs: {len(self.created_objects['admin_backup_logs'])}"
            )
            print(
                f"Admin dashboard widgets: {len(self.created_objects['admin_dashboard_widgets'])}"
            )
            print(
                f"Admin quick actions: {len(self.created_objects['admin_quick_actions'])}"
            )
            print(
                f"System health metrics: {len(self.created_objects['system_health_metrics'])}"
            )
            print(f"Document types: {len(self.created_objects['document_types'])}")
            print(f"Email OTPs: {len(self.created_objects['email_otps'])}")
            print(f"JWT tokens: {len(self.created_objects['jwt_tokens'])}")
            print(
                f"Communication templates: {len(self.created_objects['communication_templates'])}"
            )
            print(f"Cart items: {len(self.created_objects['cart_items'])}")
            print(f"Deliveries: {len(self.created_objects['deliveries'])}")
            print(f"Delivery reviews: {len(self.created_objects['delivery_reviews'])}")
            print(
                f"Order status history: {len(self.created_objects['order_status_histories'])}"
            )
            print(f"Payment methods: {len(self.created_objects['payment_methods'])}")
            print(f"Refunds: {len(self.created_objects['refunds'])}")
            print(f"Transactions: {len(self.created_objects['transactions'])}")
            print(f"Chef profiles: {len(self.created_objects['chef_profiles'])}")
            print(
                f"Delivery profiles: {len(self.created_objects['delivery_profiles'])}"
            )

            # Show approval status breakdown
            approved_cooks = len(
                [
                    u
                    for u in self.created_objects["users"]
                    if u.role == "Cook" and u.approval_status == "approved"
                ]
            )
            pending_cooks = len(
                [
                    u
                    for u in self.created_objects["users"]
                    if u.role == "Cook" and u.approval_status == "pending"
                ]
            )
            rejected_cooks = len(
                [
                    u
                    for u in self.created_objects["users"]
                    if u.role == "Cook" and u.approval_status == "rejected"
                ]
            )

            approved_delivery = len(
                [
                    u
                    for u in self.created_objects["users"]
                    if u.role == "DeliveryAgent" and u.approval_status == "approved"
                ]
            )
            pending_delivery = len(
                [
                    u
                    for u in self.created_objects["users"]
                    if u.role == "DeliveryAgent" and u.approval_status == "pending"
                ]
            )
            rejected_delivery = len(
                [
                    u
                    for u in self.created_objects["users"]
                    if u.role == "DeliveryAgent" and u.approval_status == "rejected"
                ]
            )

            print("\nApproval Status Breakdown:")
            print(
                f"Cooks - Approved: {approved_cooks}, Pending: {pending_cooks}, Rejected: {rejected_cooks}"
            )
            print(
                f"Delivery Agents - Approved: {approved_delivery}, Pending: {pending_delivery}, Rejected: {rejected_delivery}"
            )

        except Exception as e:
            print(f"Error creating sample data: {e}")
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    creator = SampleDataCreator()
    creator.run()
