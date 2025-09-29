#!/usr/bin/env python
"""
Create comprehensive sample data for admin testing with relational data
"""
import os
import sys

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import random
from datetime import date, timedelta
from decimal import Decimal

from apps.admin_management.models import (
    AdminActivityLog,
    AdminNotification,
    AdminSystemSettings,
    SystemHealthMetric,
)
from apps.authentication.models import Admin, Cook, Customer, DeliveryAgent, User
from apps.communications.models import Contact, Notification
from apps.food.models import Cuisine, Food, FoodCategory, FoodPrice, FoodReview, Offer
from apps.orders.models import CartItem, Delivery, Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment
from apps.users.models import ChefProfile, DeliveryProfile, UserProfile
from django.db import transaction
from django.utils import timezone


def clear_existing_data():
    """Clear existing sample data"""
    print("🗑️  Clearing existing data...")

    models_to_clear = [
        OrderItem,
        CartItem,
        Order,
        Delivery,
        FoodReview,
        Offer,
        FoodPrice,
        Food,
        FoodCategory,
        Cuisine,
        Payment,
        Contact,
        Notification,
        AdminActivityLog,
        AdminNotification,
        SystemHealthMetric,
        DeliveryProfile,
        ChefProfile,
        UserProfile,
        DeliveryAgent,
        Cook,
        Customer,
        Admin,
    ]

    for model in models_to_clear:
        count = model.objects.count()
        if count > 0:
            model.objects.all().delete()
            print(f"   Cleared {count} {model.__name__} records")


def create_users():
    """Create sample users with different roles"""
    print("👥 Creating users...")

    user_data = [
        # Admin users
        {"name": "John Admin", "email": "john.admin@chefsync.com", "role": "Admin"},
        {"name": "Sarah Manager", "email": "sarah.admin@chefsync.com", "role": "Admin"},
        # Customer users
        {
            "name": "Mike Customer",
            "email": "mike.customer@gmail.com",
            "role": "Customer",
        },
        {
            "name": "Emily Johnson",
            "email": "emily.customer@gmail.com",
            "role": "Customer",
        },
        {
            "name": "David Brown",
            "email": "david.customer@gmail.com",
            "role": "Customer",
        },
        {"name": "Lisa Wilson", "email": "lisa.customer@gmail.com", "role": "Customer"},
        {"name": "Tom Garcia", "email": "tom.customer@gmail.com", "role": "Customer"},
        # Cook users
        {"name": "Chef Marco", "email": "marco.cook@chefsync.com", "role": "Cook"},
        {"name": "Anna Rodriguez", "email": "anna.cook@chefsync.com", "role": "Cook"},
        {
            "name": "Giuseppe Italian",
            "email": "giuseppe.cook@chefsync.com",
            "role": "Cook",
        },
        {"name": "Li Wei", "email": "li.cook@chefsync.com", "role": "Cook"},
        {"name": "Raj Patel", "email": "raj.cook@chefsync.com", "role": "Cook"},
        # Delivery agents
        {
            "name": "James Delivery",
            "email": "james.delivery@chefsync.com",
            "role": "DeliveryAgent",
        },
        {
            "name": "Maria Lopez",
            "email": "maria.delivery@chefsync.com",
            "role": "DeliveryAgent",
        },
        {
            "name": "Alex Driver",
            "email": "alex.delivery@chefsync.com",
            "role": "DeliveryAgent",
        },
    ]

    users = []
    for data in user_data:
        if not User.objects.filter(email=data["email"]).exists():
            user = User.objects.create_user(
                email=data["email"],
                username=data["email"],  # Add username parameter
                name=data["name"],
                phone_no=f"+1{random.randint(1000000000, 9999999999)}",
                gender=random.choice(["Male", "Female", "Other"]),
                address=f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Elm St'])}",
                password="password123",
                role=data["role"],
                email_verified=True,
                approval_status="approved",
            )
            users.append(user)
            print(f"   Created user: {user.name} ({user.role})")

    return users


def create_role_profiles(users):
    """Create role-specific profiles"""
    print("📝 Creating role profiles...")

    created_data = {"admins": [], "customers": [], "cooks": [], "delivery_agents": []}

    for user in users:
        if user.role == "Admin":
            admin = Admin.objects.create(user=user)
            created_data["admins"].append(admin)
            print(f"   Created admin profile for: {user.name}")

        elif user.role == "Customer":
            customer = Customer.objects.create(user=user)
            created_data["customers"].append(customer)
            print(f"   Created customer profile for: {user.name}")

        elif user.role == "Cook":
            cook = Cook.objects.create(
                user=user,
                specialty=random.choice(
                    ["Italian", "Chinese", "Mexican", "Indian", "American"]
                ),
                experience_years=random.randint(2, 15),
                rating_avg=round(random.uniform(4.0, 5.0), 2),
            )
            created_data["cooks"].append(cook)
            print(
                f"   Created cook profile for: {user.name} (Specialty: {cook.specialty})"
            )

        elif user.role == "DeliveryAgent":
            agent = DeliveryAgent.objects.create(
                user=user,
                vehicle_type=random.choice(["bike", "car", "scooter"]),
                license_no=f"DL{random.randint(100000, 999999)}",
            )
            created_data["delivery_agents"].append(agent)
            print(
                f"   Created delivery agent profile for: {user.name} (Vehicle: {agent.vehicle_type})"
            )

    return created_data


def create_user_profiles(users):
    """Create UserProfile objects"""
    print("👤 Creating user profiles...")

    profiles = []
    for user in users:
        if not hasattr(user, "profile"):
            profile = UserProfile.objects.create(
                user=user,
                address=user.address or f"{random.randint(100, 999)} Sample St",
                date_of_birth=timezone.now().date()
                - timedelta(days=random.randint(6570, 18250)),
                gender=user.gender.lower() if user.gender else "other",
                bio=f"Hello, I'm {user.name}! Welcome to ChefSync.",
            )
            profiles.append(profile)

    print(f"   Created {len(profiles)} user profiles")
    return profiles


def create_cuisines():
    """Create cuisine categories"""
    print("🍽️  Creating cuisines...")

    cuisines_data = [
        {
            "name": "Italian",
            "description": "Authentic Italian cuisine with fresh ingredients",
        },
        {
            "name": "Chinese",
            "description": "Traditional Chinese dishes with bold flavors",
        },
        {"name": "Mexican", "description": "Spicy and flavorful Mexican cuisine"},
        {"name": "Indian", "description": "Rich and aromatic Indian dishes"},
        {"name": "American", "description": "Classic American comfort food"},
        {"name": "Japanese", "description": "Fresh and delicate Japanese cuisine"},
        {"name": "Thai", "description": "Balanced and aromatic Thai dishes"},
        {"name": "French", "description": "Elegant French culinary traditions"},
        {"name": "Mediterranean", "description": "Healthy Mediterranean diet"},
        {"name": "Korean", "description": "Spicy and fermented Korean flavors"},
    ]

    cuisines = []
    for i, data in enumerate(cuisines_data):
        cuisine, created = Cuisine.objects.get_or_create(
            name=data["name"],
            defaults={
                "description": data["description"],
                "is_active": True,
                "sort_order": i + 1,
            },
        )
        cuisines.append(cuisine)
        if created:
            print(f"   Created cuisine: {cuisine.name}")

    return cuisines


def create_food_categories(cuisines):
    """Create food categories"""
    print("📂 Creating food categories...")

    categories = [
        {"name": "Appetizers", "description": "Start your meal right"},
        {"name": "Main Course", "description": "Hearty main dishes"},
        {"name": "Desserts", "description": "Sweet endings"},
        {"name": "Beverages", "description": "Refreshing drinks"},
        {"name": "Salads", "description": "Fresh and healthy salads"},
        {"name": "Soups", "description": "Warm and comforting soups"},
    ]

    food_categories = []
    for cuisine in cuisines:
        for i, category_data in enumerate(categories):
            category, created = FoodCategory.objects.get_or_create(
                name=category_data["name"],
                cuisine=cuisine,
                defaults={
                    "description": f"{category_data['description']} from {cuisine.name} cuisine",
                    "is_active": True,
                    "sort_order": i + 1,
                },
            )
            food_categories.append(category)
            if created:
                print(f"   Created category: {cuisine.name} - {category.name}")

    return food_categories


def create_foods(cuisines, cooks, admins):
    """Create food items"""
    print("🍕 Creating food items...")

    food_samples = {
        "Italian": [
            {
                "name": "Margherita Pizza",
                "description": "Classic pizza with tomato, mozzarella, and basil",
                "veg": True,
            },
            {
                "name": "Spaghetti Carbonara",
                "description": "Creamy pasta with eggs, cheese, and pancetta",
                "veg": False,
            },
            {
                "name": "Lasagna Bolognese",
                "description": "Layered pasta with meat sauce and cheese",
                "veg": False,
            },
            {
                "name": "Risotto Mushroom",
                "description": "Creamy rice with mixed mushrooms",
                "veg": True,
            },
            {
                "name": "Chicken Parmigiana",
                "description": "Breaded chicken with tomato sauce and cheese",
                "veg": False,
            },
        ],
        "Chinese": [
            {
                "name": "Sweet and Sour Pork",
                "description": "Crispy pork with tangy sauce",
                "veg": False,
            },
            {
                "name": "Kung Pao Chicken",
                "description": "Spicy chicken with peanuts and vegetables",
                "veg": False,
            },
            {
                "name": "Vegetable Fried Rice",
                "description": "Wok-fried rice with mixed vegetables",
                "veg": True,
            },
            {
                "name": "Beef Black Bean",
                "description": "Tender beef with black bean sauce",
                "veg": False,
            },
            {
                "name": "Ma Po Tofu",
                "description": "Spicy tofu in Sichuan sauce",
                "veg": True,
            },
        ],
        "Mexican": [
            {
                "name": "Chicken Tacos",
                "description": "Soft tacos with seasoned chicken",
                "veg": False,
            },
            {
                "name": "Beef Burrito",
                "description": "Large flour tortilla with beef and beans",
                "veg": False,
            },
            {
                "name": "Cheese Quesadilla",
                "description": "Grilled tortilla with melted cheese",
                "veg": True,
            },
            {
                "name": "Chicken Enchiladas",
                "description": "Rolled tortillas with chicken and sauce",
                "veg": False,
            },
            {
                "name": "Vegetable Fajitas",
                "description": "Sizzling vegetables with tortillas",
                "veg": True,
            },
        ],
        "Indian": [
            {
                "name": "Chicken Tikka Masala",
                "description": "Creamy tomato curry with chicken",
                "veg": False,
            },
            {
                "name": "Vegetable Biryani",
                "description": "Fragrant rice with mixed vegetables",
                "veg": True,
            },
            {
                "name": "Butter Naan",
                "description": "Soft bread baked in tandoor oven",
                "veg": True,
            },
            {
                "name": "Palak Paneer",
                "description": "Spinach curry with cottage cheese",
                "veg": True,
            },
            {
                "name": "Lamb Vindaloo",
                "description": "Spicy curry with tender lamb",
                "veg": False,
            },
        ],
        "American": [
            {
                "name": "Classic Cheeseburger",
                "description": "Beef patty with cheese and fixings",
                "veg": False,
            },
            {
                "name": "BBQ Ribs",
                "description": "Slow-cooked ribs with barbecue sauce",
                "veg": False,
            },
            {
                "name": "Caesar Salad",
                "description": "Crisp romaine with Caesar dressing",
                "veg": True,
            },
            {
                "name": "Fried Chicken",
                "description": "Crispy fried chicken pieces",
                "veg": False,
            },
            {
                "name": "Mac and Cheese",
                "description": "Creamy macaroni with cheese sauce",
                "veg": True,
            },
        ],
    }

    foods = []
    cook_users = [c.user for c in cooks]
    admin_users = [a.user for a in admins] if admins else []

    for cuisine in cuisines:
        if cuisine.name in food_samples and cook_users:
            main_course = FoodCategory.objects.filter(
                cuisine=cuisine, name="Main Course"
            ).first()

            for food_data in food_samples[cuisine.name]:
                food = Food.objects.create(
                    name=food_data["name"],
                    category="Main Course",
                    description=food_data["description"],
                    status="Approved",
                    admin=random.choice(admin_users) if admin_users else None,
                    chef=random.choice(cook_users),
                    food_category=main_course,
                    is_available=True,
                    is_featured=random.choice([True, False]),
                    preparation_time=random.randint(15, 45),
                    calories_per_serving=random.randint(300, 800),
                    is_vegetarian=food_data["veg"],
                    is_vegan=food_data["veg"] and random.choice([True, False]),
                    spice_level=(
                        random.choice(["mild", "medium", "hot"])
                        if cuisine.name in ["Indian", "Mexican", "Thai"]
                        else "mild"
                    ),
                    rating_average=round(random.uniform(4.0, 5.0), 1),
                    total_reviews=random.randint(5, 50),
                    total_orders=random.randint(10, 100),
                )
                foods.append(food)
                print(
                    f"   Created food: {food.name} by {food.chef.name if food.chef else 'Unknown Chef'}"
                )

    return foods


def create_food_prices(foods):
    """Create food prices with different sizes"""
    print("💰 Creating food prices...")

    food_prices = []
    for food in foods:
        base_price = Decimal(str(random.uniform(12.99, 24.99)))

        for size in ["Small", "Medium", "Large"]:
            if size == "Small":
                price = base_price * Decimal("0.8")
            elif size == "Medium":
                price = base_price
            else:
                price = base_price * Decimal("1.3")

            price = price.quantize(Decimal("0.01"))

            food_price = FoodPrice.objects.create(
                food=food,
                size=size,
                price=price,
                cook=food.chef,
                preparation_time=random.randint(10, 30),
                image_url=f"https://images.unsplash.com/photo-{random.randint(1000000000000, 9999999999999)}",
            )
            food_prices.append(food_price)

    print(f"   Created {len(food_prices)} food prices")
    return food_prices


def create_offers(food_prices):
    """Create special offers"""
    print("🎯 Creating offers...")

    offers = []
    selected_prices = random.sample(food_prices, min(15, len(food_prices)))

    for food_price in selected_prices:
        discount = Decimal(str(random.randint(10, 30)))
        valid_until = timezone.now().date() + timedelta(days=random.randint(7, 60))

        offer = Offer.objects.create(
            description=f"Special {discount}% off on {food_price.food.name} ({food_price.size})",
            discount=discount,
            valid_until=valid_until,
            price=food_price,
        )
        offers.append(offer)
        print(f"   Created offer: {discount}% off {food_price.food.name}")

    return offers


def create_orders(customers, cooks):
    """Create sample orders"""
    print("📦 Creating orders...")

    customer_users = [c.user for c in customers]
    cook_users = [c.user for c in cooks]

    order_statuses = [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
    ]
    payment_statuses = ["pending", "paid", "failed"]

    orders = []
    for i in range(25):
        status = random.choice(order_statuses)
        payment_status = (
            "paid"
            if status in ["confirmed", "preparing", "ready", "delivered"]
            else random.choice(payment_statuses)
        )

        subtotal = Decimal(str(random.uniform(15.99, 89.99))).quantize(Decimal("0.01"))
        tax_amount = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
        delivery_fee = Decimal("3.99")
        total_amount = subtotal + tax_amount + delivery_fee

        order = Order.objects.create(
            customer=random.choice(customer_users),
            chef=random.choice(cook_users),
            status=status,
            payment_status=payment_status,
            payment_method="cash",
            delivery_address=f"{random.randint(100, 999)} {random.choice(['Delivery Ave', 'Food St', 'Order Blvd'])}",
            delivery_instructions=random.choice(
                [
                    "Ring the doorbell",
                    "Leave at door",
                    "Call when arrived",
                    "Meet at lobby",
                    "",
                ]
            ),
            subtotal=subtotal,
            tax_amount=tax_amount,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            estimated_delivery_time=timezone.now()
            + timedelta(minutes=random.randint(30, 90)),
            customer_notes=random.choice(
                [
                    "Extra spicy please",
                    "No onions",
                    "Mild spice level",
                    "Extra sauce on side",
                    "",
                ]
            ),
        )
        orders.append(order)
        print(f"   Created order #{order.order_number} - {status}")

    return orders


def create_order_items(orders, food_prices):
    """Create order items"""
    print("🛒 Creating order items...")

    order_items = []
    for order in orders:
        # Each order has 1-4 items
        num_items = random.randint(1, 4)
        selected_prices = random.sample(food_prices, min(num_items, len(food_prices)))

        for food_price in selected_prices:
            quantity = random.randint(1, 3)
            unit_price = food_price.price
            total_price = quantity * unit_price

            order_item = OrderItem.objects.create(
                order=order,
                price=food_price,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                food_name=food_price.food.name,
                food_description=food_price.food.description,
                special_instructions=random.choice(
                    ["Extra sauce", "No pickles", "Well done", "Medium rare", ""]
                ),
            )
            order_items.append(order_item)

    print(f"   Created {len(order_items)} order items")
    return order_items


def create_deliveries(orders, delivery_agents):
    """Create delivery records"""
    print("🚚 Creating deliveries...")

    agent_users = [a.user for a in delivery_agents]
    deliveries = []

    # Create deliveries for orders that are ready or delivered
    delivery_orders = [
        o for o in orders if o.status in ["ready", "out_for_delivery", "delivered"]
    ]

    for order in delivery_orders:
        delivery = Delivery.objects.create(
            status=random.choice(["Pending", "On the way", "Delivered"]),
            address=order.delivery_address,
            order=order,
            agent=random.choice(agent_users) if agent_users else None,
            delivery_time=(
                timezone.now() + timedelta(minutes=random.randint(25, 75))
                if order.status == "delivered"
                else None
            ),
        )
        deliveries.append(delivery)
        print(f"   Created delivery for order #{order.order_number}")

    return deliveries


def create_food_reviews(customers, food_prices, orders):
    """Create food reviews"""
    print("⭐ Creating food reviews...")

    customer_users = [c.user for c in customers]
    reviews = []

    # Create reviews for completed orders
    completed_orders = [o for o in orders if o.status == "delivered"]

    review_comments = [
        "Absolutely delicious! Will order again.",
        "Great taste and perfect portion size.",
        "Fresh ingredients and amazing flavors.",
        "Quick delivery and hot food.",
        "Exceeded my expectations!",
        "Good value for money.",
        "Perfectly cooked and seasoned.",
        "Amazing presentation and taste.",
        "Fast service and great food.",
        "Highly recommended!",
    ]

    for _ in range(30):
        customer = random.choice(customer_users)
        food_price = random.choice(food_prices)
        order = random.choice(completed_orders) if completed_orders else None

        # Avoid duplicate reviews
        existing_review = FoodReview.objects.filter(
            customer=customer, price=food_price
        ).first()

        if not existing_review:
            review = FoodReview.objects.create(
                price=food_price,
                customer=customer,
                order=order,
                rating=random.randint(3, 5),
                comment=random.choice(review_comments),
                taste_rating=random.randint(3, 5),
                presentation_rating=random.randint(3, 5),
                value_rating=random.randint(3, 5),
            )
            reviews.append(review)
            print(f"   Created review: {review.rating}⭐ for {food_price.food.name}")

    return reviews


def create_cart_items(customers, food_prices):
    """Create cart items"""
    print("🛒 Creating cart items...")

    customer_users = [c.user for c in customers]
    cart_items = []

    # Create cart items for some customers
    active_customers = random.sample(customer_users, min(8, len(customer_users)))

    for customer in active_customers:
        # Each customer has 1-3 items in cart
        num_items = random.randint(1, 3)
        selected_prices = random.sample(food_prices, min(num_items, len(food_prices)))

        for food_price in selected_prices:
            cart_item = CartItem.objects.create(
                customer=customer,
                price=food_price,
                quantity=random.randint(1, 2),
                special_instructions=random.choice(
                    ["Extra spicy", "No onions please", "Medium spice level", ""]
                ),
            )
            cart_items.append(cart_item)

    print(f"   Created {len(cart_items)} cart items")
    return cart_items


def create_payments(orders):
    """Create payment records"""
    print("💳 Creating payments...")

    payments = []
    paid_orders = [o for o in orders if o.payment_status == "paid"]

    for order in paid_orders:
        payment = Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method=random.choice(["card", "cash", "online"]),
            payment_provider="stripe",
            status="completed",
            payment_id=f"PAY_{random.randint(100000, 999999)}",
            provider_transaction_id=f"TXN_{random.randint(1000000000, 9999999999)}",
            currency="USD",
        )
        payments.append(payment)

    print(f"   Created {len(payments)} payments")
    return payments


def create_communications(users):
    """Create communication records"""
    print("📞 Creating communications...")

    contacts = []
    notifications = []

    # Create contact messages
    contact_messages = [
        "I have a question about my recent order",
        "When will my food be ready?",
        "I'd like to provide feedback about my experience",
        "Can I modify my order?",
        "How do I become a chef on your platform?",
        "I'm having trouble with the app",
        "Great service! Keep it up!",
    ]

    for i in range(12):
        user = random.choice(users)
        contact = Contact.objects.create(
            name=user.name,
            email=user.email,
            message=random.choice(contact_messages),
            user=user,
        )
        contacts.append(contact)

    # Create notifications for all users
    notification_types = [
        ("Welcome to ChefSync!", "Thank you for joining our platform"),
        ("Your order is confirmed", "Your delicious meal is being prepared"),
        ("Order delivered successfully", "Hope you enjoyed your meal!"),
        ("New offers available", "Check out today's special deals"),
        ("Profile updated", "Your profile information has been updated"),
    ]

    for user in users:
        for title, message in notification_types[:2]:  # 2 notifications per user
            notification = Notification.objects.create(
                subject=title,
                message=f"{message}, {user.name}!",
                user=user,
                status=random.choice(["Read", "Unread"]),
            )
            notifications.append(notification)

    print(f"   Created {len(contacts)} contacts and {len(notifications)} notifications")
    return contacts, notifications


def create_admin_data():
    """Create admin-specific data"""
    print("🔧 Creating admin data...")

    # Create admin notifications
    admin_notifications = []
    admin_alert_types = [
        ("High Order Volume", "Unusual spike in orders detected", "system_alert"),
        ("New Chef Registration", "5 new chefs registered today", "user_activity"),
        ("Payment Issue", "Payment gateway experiencing delays", "system_alert"),
        (
            "Customer Complaint",
            "New customer complaint requires attention",
            "user_activity",
        ),
        ("System Maintenance", "Scheduled maintenance tonight at 2 AM", "maintenance"),
    ]

    for title, message, notification_type in admin_alert_types:
        admin_notification = AdminNotification.objects.create(
            title=title,
            message=message,
            notification_type=notification_type,
            priority=random.choice(["low", "medium", "high"]),
            is_read=random.choice([True, False]),
        )
        admin_notifications.append(admin_notification)

    # Create system settings
    system_settings = [
        ("site_name", "ChefSync", "string", "general", "Application name"),
        ("delivery_fee", "3.99", "float", "pricing", "Standard delivery fee"),
        ("tax_rate", "8.0", "float", "pricing", "Tax rate percentage"),
        (
            "max_delivery_distance",
            "10",
            "integer",
            "delivery",
            "Maximum delivery distance in miles",
        ),
        (
            "admin_email",
            "admin@chefsync.com",
            "string",
            "general",
            "Admin contact email",
        ),
        (
            "support_phone",
            "+1-800-CHEF-SYNC",
            "string",
            "general",
            "Customer support phone",
        ),
        ("maintenance_mode", "false", "boolean", "system", "Maintenance mode status"),
        (
            "allow_new_registrations",
            "true",
            "boolean",
            "system",
            "Allow new user registrations",
        ),
    ]

    for key, value, setting_type, category, description in system_settings:
        AdminSystemSettings.objects.get_or_create(
            key=key,
            defaults={
                "value": value,
                "setting_type": setting_type,
                "category": category,
                "description": description,
            },
        )

    # Create system health metrics
    metrics = []
    metric_types = [
        "cpu_usage",
        "memory_usage",
        "disk_usage",
        "response_time",
        "error_rate",
    ]

    for metric_type in metric_types:
        for i in range(5):  # 5 data points per metric
            timestamp = timezone.now() - timedelta(hours=i * 2)
            if metric_type == "response_time":
                value = random.uniform(100, 500)  # milliseconds
            elif metric_type == "error_rate":
                value = random.uniform(0, 5)  # percentage
            else:
                value = random.uniform(20, 80)  # percentage

            metric = SystemHealthMetric.objects.create(
                metric_type=metric_type,
                value=value,
                timestamp=timestamp,
                unit="ms" if metric_type == "response_time" else "%",
            )
            metrics.append(metric)

    print(f"   Created {len(admin_notifications)} admin notifications")
    print(f"   Created {len(system_settings)} system settings")
    print(f"   Created {len(metrics)} health metrics")

    return admin_notifications, metrics


def create_activity_logs(users, orders):
    """Create admin activity logs"""
    print("📋 Creating activity logs...")

    admin_users = [u for u in users if u.role == "Admin"]
    if not admin_users:
        return []

    activity_logs = []
    activities = [
        ("approve", "Approved new chef registration"),
        ("update", "Modified order status"),
        ("approve", "Approved new food item"),
        ("update", "Updated delivery fee setting"),
        ("suspend", "Suspended user account for violations"),
        ("create", "Created new promotional offer"),
        ("export", "Generated monthly sales report"),
    ]

    for i in range(20):
        admin = random.choice(admin_users)
        action, description = random.choice(activities)

        log = AdminActivityLog.objects.create(
            admin=admin,
            action=action,
            resource_type=random.choice(
                ["user", "order", "food", "system", "settings"]
            ),
            description=description,
            ip_address=f"192.168.1.{random.randint(1, 254)}",
            user_agent="Mozilla/5.0 (Admin Dashboard)",
        )
        activity_logs.append(log)

    print(f"   Created {len(activity_logs)} activity logs")
    return activity_logs


def main():
    """Main function to create all sample data"""
    print("🚀 Starting ChefSync Sample Data Creation")
    print("=" * 50)

    try:
        with transaction.atomic():
            # Clear existing data
            clear_existing_data()
            print()

            # Create users and profiles
            users = create_users()
            role_data = create_role_profiles(users)
            create_user_profiles(users)
            print()

            # Create food-related data
            cuisines = create_cuisines()
            food_categories = create_food_categories(cuisines)
            foods = create_foods(cuisines, role_data["cooks"], role_data["admins"])
            food_prices = create_food_prices(foods)
            offers = create_offers(food_prices)
            print()

            # Create order-related data
            orders = create_orders(role_data["customers"], role_data["cooks"])
            order_items = create_order_items(orders, food_prices)
            deliveries = create_deliveries(orders, role_data["delivery_agents"])
            cart_items = create_cart_items(role_data["customers"], food_prices)
            print()

            # Create reviews and payments
            reviews = create_food_reviews(role_data["customers"], food_prices, orders)
            payments = create_payments(orders)
            print()

            # Create communications
            contacts, notifications = create_communications(users)
            print()

            # Create admin data
            admin_notifications, metrics = create_admin_data()
            activity_logs = create_activity_logs(users, orders)
            print()

            print("✅ Sample Data Creation Complete!")
            print("=" * 50)
            print(f"📊 Summary:")
            print(f"   Users: {len(users)}")
            print(f"   Cuisines: {len(cuisines)}")
            print(f"   Food Categories: {len(food_categories)}")
            print(f"   Food Items: {len(foods)}")
            print(f"   Food Prices: {len(food_prices)}")
            print(f"   Offers: {len(offers)}")
            print(f"   Orders: {len(orders)}")
            print(f"   Order Items: {len(order_items)}")
            print(f"   Deliveries: {len(deliveries)}")
            print(f"   Reviews: {len(reviews)}")
            print(f"   Payments: {len(payments)}")
            print(f"   Cart Items: {len(cart_items)}")
            print(f"   Admin Notifications: {len(admin_notifications)}")
            print(f"   Activity Logs: {len(activity_logs)}")
            print()
            print("🎯 All relational data created successfully!")
            print("🔑 Login credentials for testing:")
            print("   Admin: john.admin@chefsync.com / password123")
            print("   Chef: marco.cook@chefsync.com / password123")
            print("   Customer: mike.customer@gmail.com / password123")
            print("   Delivery: james.delivery@chefsync.com / password123")

    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        raise


if __name__ == "__main__":
    main()
