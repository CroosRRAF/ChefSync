#!/usr/bin/env python
from __future__ import annotations

"""Comprehensive, MySQL-safe data generator for ChefSync."""

import os
import random
import string
import sys
import uuid
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, List, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
from django.utils import timezone

django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.authentication.models import Admin
from apps.users.models import UserProfile, ChefProfile, DeliveryProfile
from apps.orders.models import (
    Delivery,
    DeliveryIssue,
    DeliveryReview,
    Order,
    OrderItem,
    UserAddress,
)
from apps.food.models import Cuisine, Food, FoodCategory, FoodPrice, FoodReview
from apps.payments.models import Payment
from apps.communications.models import Communication, CommunicationResponse, Notification

User = get_user_model()


def decimal_two_places(value: float) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def decimal_coordinate(value: float) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


def random_decimal(min_value: float, max_value: float) -> Decimal:
    return decimal_two_places(random.uniform(min_value, max_value))


def random_datetime(start, end):
    delta = end - start
    if delta.total_seconds() <= 0:
        return start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def ensure_timezone(dt):
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt


@dataclass
class NamePool:
    first_names: Iterable[str]
    last_names: Iterable[str]

    def random_full_name(self) -> str:
        return f"{random.choice(self.first_names)} {random.choice(self.last_names)}"


NAME_POOL = NamePool(
    first_names=
    (
        "John", "Jane", "Michael", "Sarah", "David", "Lisa", "James", "Emily", "Robert", "Jessica",
        "William", "Amanda", "Richard", "Jennifer", "Charles", "Michelle", "Thomas", "Nicole", "Daniel", "Angela",
        "Matthew", "Melissa", "Anthony", "Stephanie", "Mark", "Rebecca", "Donald", "Laura", "Steven", "Rachel",
        "Paul", "Amy", "Andrew", "Samantha", "Joshua", "Kelly", "Kevin", "Christina", "Brian", "Olivia",
        "George", "Julie", "Timothy", "Heather", "Jason", "Denise", "Jeffrey", "Maria", "Ryan", "Christine"
    ),
    last_names=
    (
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
        "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
        "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
    ),
)


class ComprehensiveDataGenerator:
    def __init__(self, months: int = 4) -> None:
        self.now = timezone.now()
        self.start_date = self.now - timedelta(days=30 * months)
        self.total_users_target = 50
        self.cuisine_names = (
            "Italian", "Chinese", "Indian", "Mexican", "Thai", "Japanese", "French", "Mediterranean",
            "American", "Korean", "Vietnamese", "Turkish", "Greek", "Spanish", "Lebanese"
        )
        self.food_categories_map = {
            "Italian": ("Pizza", "Pasta", "Risotto", "Antipasti", "Desserts"),
            "Chinese": ("Dim Sum", "Noodles", "Rice Dishes", "Soups", "Appetizers"),
            "Indian": ("Curries", "Rice", "Breads", "Tandoori", "Desserts"),
            "Mexican": ("Tacos", "Burritos", "Quesadillas", "Nachos", "Salsas"),
            "Thai": ("Curries", "Noodles", "Rice", "Soups", "Salads"),
            "Japanese": ("Sushi", "Ramen", "Tempura", "Teriyaki", "Bento"),
            "French": ("Baguettes", "Croissants", "Quiches", "Soufflés", "Desserts"),
            "American": ("Burgers", "Hot Dogs", "Fries", "BBQ", "Pies"),
            "Korean": ("Bibimbap", "Kimchi", "Bulgogi", "Kimbap", "Soups"),
            "Vietnamese": ("Pho", "Banh Mi", "Spring Rolls", "Rice Dishes", "Noodles"),
        }
        self.specialties = (
            "Italian Cuisine", "Chinese Takeout", "Indian Curries", "Mexican Street Food", "Thai Fusion",
            "Japanese Sushi", "French Pastries", "American Comfort Food", "Korean BBQ", "Vietnamese Street Food",
            "Mediterranean Grill", "Healthy Options", "Vegan Specialties", "Gluten-Free Options", "Dessert Specialist"
        )
        self.communication_subjects = (
            "Order delayed - need update", "Food quality issue", "Missing items in delivery",
            "Request for refund", "Special dietary requirements", "Delivery address change",
            "Order customization request", "Payment issue", "App technical problem",
            "Chef recommendation request", "Menu suggestion", "Delivery time preference",
            "Allergy concern", "Order tracking inquiry", "Bulk order inquiry"
        )
        self.communication_messages = (
            "Hi, my order is taking longer than expected. Can you provide an update?",
            "The food I received doesn't match what I ordered. Please help.",
            "I noticed some items are missing from my delivery. What happened?",
            "I'm not satisfied with the food quality. I'd like a refund please.",
            "I have severe allergies. Can you confirm ingredients?",
            "I need to change my delivery address for this order.",
            "Can you customize this dish for my dietary restrictions?",
            "I have a payment issue that needs to be resolved.",
            "The app is not working properly on my device.",
            "Can you recommend dishes for a dinner party?",
            "I'd like to suggest a new menu item for your restaurant.",
            "I prefer deliveries between 6-8 PM. Can you accommodate?",
            "This dish contained allergens I didn't expect.",
            "Can you help me track my order status?",
            "I'm interested in placing a large catering order."
        )
        self.review_comments = (
            "Absolutely delicious! Will order again.", "Perfect portion size and great taste.",
            "Could use a bit more seasoning, but overall good.", "Delivery was super fast!",
            "Food arrived hot and fresh. Excellent service.", "Not quite what I expected, but still tasty.",
            "Amazing flavors! The chef really knows their stuff.", "Great value for money.",
            "Will definitely recommend to friends.", "Presentation was beautiful.",
            "Ingredients were fresh and high quality.", "Quick preparation time.",
            "Taste could be improved, but service was excellent.", "Love the spice level!",
            "Perfect for my dietary restrictions."
        )

        self.admins: List[User] = []
        self.customers: List[User] = []
        self.cooks: List[User] = []
        self.delivery_agents: List[User] = []
        self.foods: List[Food] = []
        self.cuisine_lookup = {}
        self.category_lookup = {}

    # ------------------------------------------------------------------
    # Core helpers
    # ------------------------------------------------------------------
    def get_unique_email(self, base_name: str, domain: str = "chefsync.test") -> str:
        base_slug = base_name.lower().replace(" ", ".")
        while True:
            email = f"{base_slug}{random.randint(1, 9999)}@{domain}"
            if not User.objects.filter(email=email).exists():
                return email

    def referral_code(self, name: str) -> str:
        initials = "".join([part[0].upper() for part in name.split()[:2]]) or "CF"
        random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        code = f"{initials}{random_part}"
        while User.objects.filter(referral_code=code).exists():
            random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"{initials}{random_part}"
        return code

    def random_address(self, label_index: int) -> dict:
        labels = ["Home", "Work", "Apartment", "Secondary", "Vacation"]
        streets = ("Main", "Oak", "Elm", "Park", "First", "Second", "Maple", "Cedar", "Pine", "Washington")
        cities = (
            "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
            "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville"
        )
        label = labels[label_index % len(labels)]
        address = {
            "label": label,
            "address_line1": f"{random.randint(100, 9999)} {random.choice(streets)} St",
            "address_line2": f"Apt {random.randint(1, 999)}" if random.random() > 0.5 else "",
            "city": random.choice(cities),
            "pincode": str(random.randint(10000, 99999)),
            "latitude": decimal_coordinate(random.uniform(25.0, 45.0)),
            "longitude": decimal_coordinate(random.uniform(-125.0, -70.0)),
            "is_default": label_index == 0,
        }
        return address

    def random_created_updated(self):
        created = ensure_timezone(random_datetime(self.start_date, self.now))
        updated = created + timedelta(hours=random.randint(1, 96))
        if updated > self.now:
            updated = self.now
        return created, updated

    # ------------------------------------------------------------------
    # Data creation steps
    # ------------------------------------------------------------------
    def create_or_update_admin(self, name: str, email: str, password: str = "Admin@12345") -> User:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "approval_status": "approved",
                "phone_no": f"+1{random.randint(2000000000, 9999999999)}",
            },
        )
        if created:
            user.set_password(password)
            user.save()
        else:
            user.role = "admin"
            user.is_staff = True
            user.is_superuser = True
            user.approval_status = "approved"
            user.save(update_fields=["role", "is_staff", "is_superuser", "approval_status"])

        Admin.objects.get_or_create(user=user)
        return user

    def create_admin_users(self) -> None:
        print("• Creating admin accounts")
        admins = (
            ("Admin", "admin@chefsync.com"),
            ("Operations Manager", "manager@chefsync.com"),
            ("Support Lead", "support@chefsync.com"),
        )
        for name, email in admins:
            admin_user = self.create_or_update_admin(name, email)
            self.admins.append(admin_user)

    def create_customers(self, count: int = 35) -> None:
        print(f"• Creating {count} customers")
        for _ in range(count):
            name = NAME_POOL.random_full_name()
            email = self.get_unique_email(name.replace(" ", "."))
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": name,
                    "role": "customer",
                    "phone_no": f"+1{random.randint(3000000000, 9999999999)}",
                    "approval_status": "approved",
                    "referral_code": self.referral_code(name),
                },
            )
            if created:
                user.set_password("Customer@123")
                user.save()
            self.customers.append(user)

            profile_defaults = {
                "address": random.choice(
                    (
                        "123 Main St, New York, NY 10001",
                        "456 Oak Ave, Los Angeles, CA 90210",
                        "789 Elm St, Chicago, IL 60601",
                    )
                ),
                "gender": random.choice(("male", "female", "other")),
                "bio": f"Food lover and {random.choice(('home cook', 'food blogger', 'restaurant enthusiast'))}",
            }
            UserProfile.objects.update_or_create(user=user, defaults=profile_defaults)

            for idx in range(random.randint(1, 3)):
                address_data = self.random_address(idx)
                UserAddress.objects.update_or_create(
                    user=user,
                    label=address_data["label"],
                    defaults=address_data,
                )

    def create_cooks(self, count: int = 10) -> None:
        print(f"• Creating {count} cooks")
        for _ in range(count):
            name = NAME_POOL.random_full_name()
            email = self.get_unique_email(name.replace(" ", "."), domain="chefsync.chefs")
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": name,
                    "role": "cook",
                    "phone_no": f"+1{random.randint(3000000000, 9999999999)}",
                    "approval_status": "approved",
                },
            )
            if created:
                user.set_password("Cook@123")
                user.save()
            self.cooks.append(user)

            ChefProfile.objects.update_or_create(
                user=user,
                defaults={
                    "specialty_cuisines": random.sample(self.specialties, random.randint(1, 3)),
                    "experience_years": random.randint(2, 15),
                    "certifications": ["Food Safety Certificate", "Culinary Arts Diploma"],
                    "bio": f"Experienced chef specializing in {random.choice(self.specialties)}",
                    "rating_average": decimal_two_places(random.uniform(3.5, 5.0)),
                    "total_orders": random.randint(50, 500),
                    "total_reviews": random.randint(10, 100),
                    "is_featured": random.random() > 0.7,
                },
            )

    def create_delivery_agents(self, count: int = 5) -> None:
        print(f"• Creating {count} delivery agents")
        vehicles = ("bike", "car", "scooter")
        for _ in range(count):
            name = NAME_POOL.random_full_name()
            email = self.get_unique_email(name.replace(" ", "."), domain="chefsync.delivery")
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": name,
                    "role": "delivery_agent",
                    "phone_no": f"+1{random.randint(3000000000, 9999999999)}",
                    "approval_status": random.choice(("approved", "approved", "pending")),
                },
            )
            if created:
                user.set_password("Delivery@123")
                user.save()
            self.delivery_agents.append(user)

            DeliveryProfile.objects.update_or_create(
                user=user,
                defaults={
                    "vehicle_type": random.choice(vehicles),
                    "license_number": f"DL{random.randint(100000, 999999)}",
                    "is_available": random.random() > 0.2,
                    "rating_average": decimal_two_places(random.uniform(3.0, 5.0)),
                    "total_deliveries": random.randint(100, 1000),
                    "approval_status": user.approval_status,
                },
            )

    def create_cuisines_and_categories(self) -> None:
        print("• Ensuring cuisines and categories")
        for cuisine_name in self.cuisine_names:
            cuisine, _ = Cuisine.objects.get_or_create(
                name=cuisine_name,
                defaults={
                    "description": f"Traditional {cuisine_name} cuisine with authentic flavors",
                    "is_active": True,
                    "sort_order": random.randint(1, len(self.cuisine_names)),
                },
            )
            self.cuisine_lookup[cuisine_name] = cuisine

            categories = self.food_categories_map.get(cuisine_name, ("Main Dishes",))
            for index, category_name in enumerate(categories, start=1):
                category, _ = FoodCategory.objects.get_or_create(
                    cuisine=cuisine,
                    name=category_name,
                    defaults={
                        "description": f"{category_name} from {cuisine_name} cuisine",
                        "is_active": True,
                        "sort_order": index,
                    },
                )
                self.category_lookup.setdefault(cuisine_name, []).append(category)

    def create_foods_and_prices(self, target: int = 40) -> None:
        print(f"• Creating food catalog ({target} items)")
        base_foods = (
            "Margherita Pizza", "Chicken Tikka Masala", "Pad Thai", "Beef Burrito",
            "Chicken Teriyaki", "Caesar Salad", "Fish and Chips", "Vegetable Stir Fry",
            "Spaghetti Carbonara", "Chicken Biryani", "Tom Yum Soup", "Quesadilla",
            "Salmon Sushi", "Croque Monsieur", "BBQ Ribs", "Kimchi Fried Rice",
            "Pho Bo", "Chicken Parmesan", "Butter Chicken", "Green Curry",
            "Shrimp Scampi", "Falafel Wrap", "Veggie Burger", "Samosa Platter",
            "Chocolate Lava Cake", "Mango Sticky Rice", "Poke Bowl", "Vegan Buddha Bowl"
        )
        descriptions = (
            "Classic dish with fresh ingredients.", "Traditional recipe passed down generations.",
            "Chef's special with a unique twist.", "Healthy and nutritious option.",
            "Perfect for sharing with friends.", "Spicy and flavorful delight.",
            "Comfort food at its finest.", "Light and refreshing choice."
        )
        created = 0
        attempts = 0
        while created < target and attempts < target * 3:
            attempts += 1
            food_name = random.choice(base_foods)
            cuisine_name = random.choice(self.cuisine_names)
            category_list = self.category_lookup.get(cuisine_name)
            if not category_list:
                continue
            category = random.choice(category_list)
            chef = random.choice(self.cooks)
            food, was_created = Food.objects.get_or_create(
                name=food_name,
                chef=chef,
                defaults={
                    "category": random.choice(("Main Course", "Appetizer", "Dessert", "Beverage")),
                    "description": random.choice(descriptions),
                    "food_category": category,
                    "is_available": True,
                    "is_featured": random.random() > 0.8,
                    "preparation_time": random.randint(15, 45),
                    "calories_per_serving": random.randint(200, 800),
                    "ingredients": ["tomato", "cheese", "basil", "olive oil"],
                    "allergens": ["gluten"] if "bread" in food_name.lower() or "pasta" in food_name.lower() else [],
                    "nutritional_info": {
                        "protein": random.randint(10, 40),
                        "carbs": random.randint(20, 80),
                    },
                    "is_vegetarian": random.random() > 0.5,
                    "is_vegan": random.random() > 0.7,
                    "spice_level": random.choice(("mild", "medium", "hot", None)),
                    "status": "Approved",
                },
            )
            if was_created:
                self.foods.append(food)
                created += 1

            base_price = random_decimal(8.99, 29.99)
            for size, factor in (("Small", Decimal("0.7")), ("Medium", Decimal("1.0")), ("Large", Decimal("1.3"))):
                price_value = (base_price * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                FoodPrice.objects.update_or_create(
                    food=food,
                    cook=chef,
                    size=size,
                    defaults={
                        "price": price_value,
                        "preparation_time": random.randint(15, 45),
                    },
                )

    def create_orders_and_related_data(self, target: int = 220) -> None:
        print(f"• Creating orders, payments, and logistics ({target})")
        if not (self.customers and self.cooks and self.foods):
            print("  ! Skipping orders due to missing base data")
            return

        statuses = ("confirmed", "preparing", "ready", "out_for_delivery", "delivered")
        payment_statuses = ("pending", "paid")
        delivery_notes = ("Ring the bell", "Leave at door", "Call upon arrival", "")
        instructions = ("Extra spicy please", "No onions", "Quick delivery needed", "")

        created = 0
        attempts = 0
        while created < target and attempts < target * 4:
            attempts += 1
            customer = random.choice(self.customers)
            chef = random.choice(self.cooks)
            address_qs = customer.addresses.all()
            if not address_qs.exists():
                continue
            address = random.choice(list(address_qs))
            status = random.choice(statuses)
            payment_status = random.choice(payment_statuses)
            order = Order.objects.create(
                customer=customer,
                chef=chef,
                delivery_address=f"{address.address_line1}, {address.city}",
                delivery_address_ref=address,
                delivery_instructions=random.choice(delivery_notes),
                customer_notes=random.choice(instructions),
                status=status,
                payment_status=payment_status,
                payment_method=random.choice(("cash", "card")) if payment_status == "paid" else None,
            )

            available_prices = list(FoodPrice.objects.filter(food__chef=chef))
            if not available_prices:
                order.delete()
                continue

            items_for_order = random.sample(available_prices, min(len(available_prices), random.randint(1, 4)))
            subtotal = Decimal("0.00")
            for price_obj in items_for_order:
                quantity = random.randint(1, 3)
                unit_price = price_obj.price
                total_price = (unit_price * quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                OrderItem.objects.create(
                    order=order,
                    price=price_obj,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    special_instructions=random.choice(("Extra cheese", "No spice", "Well done", "")),
                    food_name=price_obj.food.name,
                    food_description=price_obj.food.description or "",
                )
                subtotal += total_price

            tax_amount = (subtotal * Decimal("0.10")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            delivery_fee = Decimal("5.00") if random.random() > 0.4 else Decimal("0.00")
            total_amount = (subtotal + tax_amount + delivery_fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            Order.objects.filter(pk=order.pk).update(
                subtotal=subtotal,
                tax_amount=tax_amount,
                delivery_fee=delivery_fee,
                total_amount=total_amount,
            )

            # Set timestamps before creating delivery to avoid negative deltas
            created_dt, updated_dt = self.random_created_updated()
            Order.objects.filter(pk=order.pk).update(created_at=created_dt, updated_at=updated_dt)
            order.created_at = created_dt  # Update local object for delivery time calculation

            if payment_status == "paid":
                Payment.objects.update_or_create(
                    order=order,
                    defaults={
                        "amount": total_amount,
                        "currency": "USD",
                        "payment_method": order.payment_method or "card",
                        "payment_provider": random.choice(("stripe", "paypal", "razorpay")),
                        "status": "completed",
                        "provider_transaction_id": f"txn_{uuid.uuid4().hex[:18]}",
                    },
                )

            delivery = None
            if status in ("out_for_delivery", "delivered"):
                delivery_agent = random.choice(self.delivery_agents) if self.delivery_agents else None
                delivery, _created = Delivery.objects.get_or_create(
                    order=order,
                    defaults={
                        "agent": delivery_agent,
                        "address": order.delivery_address,
                        "status": "Delivered" if status == "delivered" else "On the way",
                    },
                )
                if status == "delivered":
                    delivery.delivery_time = ensure_timezone(random_datetime(order.created_at, self.now))
                    delivery.save(update_fields=["delivery_time"])
                    if random.random() > 0.5:
                        DeliveryReview.objects.update_or_create(
                            delivery=delivery,
                            customer=customer,
                            defaults={
                                "rating": random.randint(3, 5),
                                "comment": random.choice((
                                    "Great delivery service!", "Fast and friendly", "On time delivery",
                                    "Professional service", "Could be faster", "Good communication",
                                )),
                            },
                        )

            if delivery and random.random() > 0.8:
                DeliveryIssue.objects.update_or_create(
                    order=order,
                    delivery_agent=delivery.agent or random.choice(self.delivery_agents),
                    defaults={
                        "issue_type": random.choice((
                            "traffic_delay", "wrong_address", "customer_unavailable", "vehicle_problem"
                        )),
                        "description": random.choice((
                            "Stuck in traffic", "Customer not responding", "Address hard to find",
                            "Vehicle breakdown", "Weather conditions"
                        )),
                        "status": random.choice(("reported", "acknowledged", "resolved")),
                    },
                )

            created += 1

    def create_communications(self, target: int = 90) -> None:
        print(f"• Creating communications ({target})")
        if not self.customers:
            return
        created = 0
        while created < target:
            customer = random.choice(self.customers)
            communication, was_created = Communication.objects.get_or_create(
                user=customer,
                reference_number=f"COM-{uuid.uuid4().hex[:10].upper()}",
                defaults={
                    "communication_type": random.choice(("feedback", "complaint", "suggestion", "inquiry")),
                    "subject": random.choice(self.communication_subjects),
                    "message": random.choice(self.communication_messages),
                    "status": random.choice(("pending", "in_progress", "resolved", "closed")),
                    "priority": random.choice(("low", "medium", "high")),
                    "is_read": random.random() > 0.35,
                },
            )
            if not was_created:
                continue

            created_dt, updated_dt = self.random_created_updated()
            Communication.objects.filter(pk=communication.pk).update(
                created_at=created_dt,
                updated_at=updated_dt,
            )

            if communication.status in ("resolved", "closed") and random.random() > 0.5:
                responder = random.choice(self.admins) if self.admins else None
                if responder:
                    CommunicationResponse.objects.update_or_create(
                        communication=communication,
                        responder=responder,
                        defaults={
                            "message": random.choice((
                                "Thank you for your feedback. We're looking into this.",
                                "We've resolved your issue. Please let us know if you need anything else.",
                                "Your suggestion has been noted and forwarded to the team.",
                                "We're sorry for the inconvenience. Here's what we're doing to fix this.",
                            )),
                            "is_internal": random.random() > 0.75,
                        },
                    )

            created += 1

    def create_reviews(self) -> None:
        print("• Creating food reviews")
        delivered_orders = Order.objects.filter(status="delivered")
        for order in delivered_orders:
            if random.random() > 0.6:
                continue
            for item in order.items.all():
                if random.random() > 0.5:
                    FoodReview.objects.update_or_create(
                        price=item.price,
                        customer=order.customer,
                        order=order,
                        defaults={
                            "rating": random.randint(3, 5),
                            "comment": random.choice(self.review_comments),
                            "taste_rating": random.randint(3, 5),
                            "presentation_rating": random.randint(3, 5),
                            "value_rating": random.randint(3, 5),
                            "is_verified_purchase": True,
                        },
                    )

    def create_notifications(self) -> None:
        print("• Creating notifications")
        templates = (
            ("Order Update", "Your order status has been updated."),
            ("New Message", "You have a new message from support."),
            ("Special Offer", "Check out our latest special offers."),
            ("Delivery Update", "Your delivery is on the way."),
            ("Payment Confirmation", "Your payment has been processed."),
            ("Review Reminder", "How was your recent order?"),
            ("New Feature", "We've added new features to the app."),
            ("Maintenance Notice", "Scheduled maintenance tonight."),
        )
        recipients = self.customers + self.cooks + self.delivery_agents
        for user in recipients:
            for _ in range(random.randint(2, 6)):
                subject, message = random.choice(templates)
                notification, _ = Notification.objects.get_or_create(
                    user=user,
                    subject=subject,
                    message=message,
                    defaults={"status": random.choice(("Read", "Unread"))},
                )
                created_dt, updated_dt = self.random_created_updated()
                Notification.objects.filter(pk=notification.pk).update(
                    time=created_dt,
                )

    # ------------------------------------------------------------------
    # Orchestrator
    # ------------------------------------------------------------------
    def run(self) -> None:
        print("🚀 Starting ChefSync comprehensive data generation")
        print(f"   Time window: {self.start_date.date()} ➜ {self.now.date()}")

        with transaction.atomic():
            self.create_admin_users()
            self.create_customers()
            self.create_cooks()
            self.create_delivery_agents()
            self.create_cuisines_and_categories()
            self.create_foods_and_prices()
            self.create_orders_and_related_data()
            self.create_communications()
            self.create_reviews()
            self.create_notifications()

        print("✅ Data generation complete")
        print("   Summary:")
        print(f"     Users: {User.objects.count()}")
        print(f"     Orders: {Order.objects.count()}")
        print(f"     Order items: {OrderItem.objects.count()}")
        print(f"     Foods: {Food.objects.count()} ({FoodPrice.objects.count()} prices)")
        print(f"     Communications: {Communication.objects.count()}")
        print(f"     Payments: {Payment.objects.count()}")
        print(f"     Notifications: {Notification.objects.count()}")


if __name__ == "__main__":
    ComprehensiveDataGenerator().run()
