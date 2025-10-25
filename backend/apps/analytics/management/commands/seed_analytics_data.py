"""
Management command to seed sample analytics data for testing
"""
import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.food.models import Food, FoodCategory, Cuisine, FoodPrice
from apps.orders.models import Order, OrderItem

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with sample analytics data for testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=90,
            help="Number of days of historical data to generate",
        )
        parser.add_argument(
            "--orders-per-day",
            type=int,
            default=15,
            help="Average number of orders per day",
        )

    def handle(self, *args, **options):
        days = options["days"]
        orders_per_day = options["orders_per_day"]

        self.stdout.write(
            self.style.SUCCESS(f"Starting to seed {days} days of analytics data...")
        )

        # Step 1: Create sample users if they don't exist
        self.create_sample_users()

        # Step 2: Create sample food items if they don't exist
        self.create_sample_food_items()

        # Step 3: Create historical orders
        self.create_historical_orders(days, orders_per_day)

        self.stdout.write(self.style.SUCCESS("✅ Analytics data seeding completed!"))

    def create_sample_users(self):
        """Create sample users for testing"""
        self.stdout.write("Creating sample users...")

        # Create customers
        customer_data = [
            {
                "email": "customer1@test.com",
                "username": "customer1",
                "name": "John Doe",
                "role": "customer",
            },
            {
                "email": "customer2@test.com",
                "username": "customer2",
                "name": "Jane Smith",
                "role": "customer",
            },
            {
                "email": "customer3@test.com",
                "username": "customer3",
                "name": "Bob Johnson",
                "role": "customer",
            },
            {
                "email": "customer4@test.com",
                "username": "customer4",
                "name": "Alice Brown",
                "role": "customer",
            },
            {
                "email": "customer5@test.com",
                "username": "customer5",
                "name": "Charlie Wilson",
                "role": "customer",
            },
            {
                "email": "customer6@test.com",
                "username": "customer6",
                "name": "Diana Martinez",
                "role": "customer",
            },
            {
                "email": "customer7@test.com",
                "username": "customer7",
                "name": "Edward Davis",
                "role": "customer",
            },
            {
                "email": "customer8@test.com",
                "username": "customer8",
                "name": "Fiona Garcia",
                "role": "customer",
            },
            {
                "email": "customer9@test.com",
                "username": "customer9",
                "name": "George Rodriguez",
                "role": "customer",
            },
            {
                "email": "customer10@test.com",
                "username": "customer10",
                "name": "Hannah Lee",
                "role": "customer",
            },
        ]

        for data in customer_data:
            if not User.objects.filter(email=data["email"]).exists():
                user = User.objects.create_user(
                    email=data["email"],
                    username=data["username"],
                    name=data["name"],
                    password="testpass123",
                    role=data["role"],
                    is_active=True,
                    approval_status="approved",
                )
                # Set varied join dates over the last 90 days
                days_ago = random.randint(1, 90)
                user.date_joined = timezone.now() - timedelta(days=days_ago)
                user.save()
                self.stdout.write(f"  Created user: {data['name']}")
            else:
                self.stdout.write(f"  User exists: {data['name']}")

        # Create cooks
        cook_data = [
            {
                "email": "cook1@test.com",
                "username": "cook1",
                "name": "Chef Mario",
                "role": "cook",
            },
            {
                "email": "cook2@test.com",
                "username": "cook2",
                "name": "Chef Julia",
                "role": "cook",
            },
            {
                "email": "cook3@test.com",
                "username": "cook3",
                "name": "Chef Gordon",
                "role": "cook",
            },
        ]

        for data in cook_data:
            if not User.objects.filter(email=data["email"]).exists():
                user = User.objects.create_user(
                    email=data["email"],
                    username=data["username"],
                    name=data["name"],
                    password="testpass123",
                    role=data["role"],
                    is_active=True,
                    approval_status="approved",
                )
                days_ago = random.randint(91, 180)  # Cooks joined earlier
                user.date_joined = timezone.now() - timedelta(days=days_ago)
                user.save()
                self.stdout.write(f"  Created cook: {data['name']}")
            else:
                self.stdout.write(f"  Cook exists: {data['name']}")

        self.stdout.write(self.style.SUCCESS("✓ Sample users created"))

    def create_sample_food_items(self):
        """Create sample food items for testing"""
        self.stdout.write("Creating sample food items...")

        # Create cuisines first if they don't exist
        cuisines_data = [
            {
                "name": "Sri Lankan",
                "description": "Authentic Sri Lankan cuisine with traditional flavors",
            },
            {"name": "Chinese", "description": "Traditional Chinese dishes"},
            {"name": "Indian", "description": "Indian cuisine with aromatic spices"},
        ]

        cuisines = {}
        for cuisine_data in cuisines_data:
            cuisine, created = Cuisine.objects.get_or_create(
                name=cuisine_data["name"],
                defaults={"description": cuisine_data["description"]},
            )
            cuisines[cuisine.name] = cuisine
            if created:
                self.stdout.write(f"  Created cuisine: {cuisine.name}")

        # Create categories if they don't exist
        sri_lankan = cuisines["Sri Lankan"]
        categories_data = [
            {"name": "Rice & Curry", "cuisine": sri_lankan},
            {"name": "Noodles", "cuisine": cuisines["Chinese"]},
            {"name": "Appetizers", "cuisine": sri_lankan},
            {"name": "Desserts", "cuisine": sri_lankan},
            {"name": "Beverages", "cuisine": sri_lankan},
            {"name": "Curries", "cuisine": cuisines["Indian"]},
        ]

        for cat_data in categories_data:
            category, created = FoodCategory.objects.get_or_create(
                name=cat_data["name"], cuisine=cat_data["cuisine"]
            )
            if created:
                self.stdout.write(
                    f"  Created category: {cat_data['cuisine'].name} - {cat_data['name']}"
                )

        # Get cooks
        cooks = User.objects.filter(role="cook")
        if not cooks.exists():
            self.stdout.write(
                self.style.WARNING("No cooks found. Please create cooks first.")
            )
            return

        # Food items data with cuisine/category
        food_items = [
            {
                "name": "Chicken Biryani",
                "cuisine": "Sri Lankan",
                "category": "Rice & Curry",
                "price": 850,
                "is_vegetarian": False,
            },
            {
                "name": "Vegetable Fried Rice",
                "cuisine": "Sri Lankan",
                "category": "Rice & Curry",
                "price": 650,
                "is_vegetarian": True,
            },
            {
                "name": "Kottu Roti",
                "cuisine": "Chinese",
                "category": "Noodles",
                "price": 750,
                "is_vegetarian": False,
            },
            {
                "name": "Hoppers",
                "cuisine": "Sri Lankan",
                "category": "Appetizers",
                "price": 150,
                "is_vegetarian": True,
            },
            {
                "name": "Fish Curry",
                "cuisine": "Sri Lankan",
                "category": "Rice & Curry",
                "price": 900,
                "is_vegetarian": False,
            },
            {
                "name": "Watalappan",
                "cuisine": "Sri Lankan",
                "category": "Desserts",
                "price": 250,
                "is_vegetarian": True,
            },
            {
                "name": "Mango Juice",
                "cuisine": "Sri Lankan",
                "category": "Beverages",
                "price": 200,
                "is_vegetarian": True,
            },
            {
                "name": "Mutton Curry",
                "cuisine": "Indian",
                "category": "Curries",
                "price": 950,
                "is_vegetarian": False,
            },
            {
                "name": "Dhal Curry",
                "cuisine": "Sri Lankan",
                "category": "Rice & Curry",
                "price": 400,
                "is_vegetarian": True,
            },
            {
                "name": "String Hoppers",
                "cuisine": "Sri Lankan",
                "category": "Appetizers",
                "price": 300,
                "is_vegetarian": True,
            },
        ]

        for item in food_items:
            cuisine = cuisines[item["cuisine"]]
            category = FoodCategory.objects.get(name=item["category"], cuisine=cuisine)
            chef = random.choice(cooks)

            if not Food.objects.filter(name=item["name"], chef=chef).exists():
                food = Food.objects.create(
                    name=item["name"],
                    description=f"Delicious {item['name']} prepared with authentic spices",
                    food_category=category,
                    chef=chef,
                    is_available=True,
                    is_vegetarian=item["is_vegetarian"],
                    preparation_time=random.randint(20, 45),
                    status="Approved",  # Approve the food items
                )
                
                # Create FoodPrice for this food item (Medium size)
                FoodPrice.objects.create(
                    food=food,
                    cook=chef,
                    size="Medium",
                    price=Decimal(item["price"]),
                    preparation_time=food.preparation_time or 30,
                )
                
                self.stdout.write(f"  Created food: {item['name']} with price")
            else:
                self.stdout.write(f"  Food exists: {item['name']}")

        self.stdout.write(self.style.SUCCESS("✓ Sample food items created"))

    def create_historical_orders(self, days, orders_per_day):
        """Create historical orders with varied data"""
        self.stdout.write(
            f"Creating historical orders for {days} days ({orders_per_day} orders/day avg)..."
        )

        customers = list(User.objects.filter(role="customer"))
        cooks = list(User.objects.filter(role="cook"))
        food_prices = list(FoodPrice.objects.select_related('food').all())

        if not customers:
            self.stdout.write(
                self.style.ERROR("No customers found. Please create customers first.")
            )
            return

        if not food_prices:
            self.stdout.write(
                self.style.ERROR("No food prices found. Please create food items first.")
            )
            return

        statuses = ["pending", "confirmed", "preparing", "completed", "cancelled"]
        payment_statuses = ["pending", "paid", "failed", "refunded"]

        order_count = 0
        now = timezone.now()

        for day_offset in range(days):
            date = now - timedelta(days=day_offset)

            # Vary orders per day (weekends have more orders)
            if date.weekday() in [5, 6]:  # Saturday, Sunday
                daily_orders = int(orders_per_day * 1.5)
            else:
                daily_orders = orders_per_day

            # Add some randomness
            daily_orders = random.randint(
                max(1, daily_orders - 5), daily_orders + 5
            )

            for _ in range(daily_orders):
                # Select random customer
                customer = random.choice(customers)

                # Create order
                status = random.choices(
                    statuses, weights=[10, 15, 10, 60, 5]
                )[
                    0
                ]  # More completed orders

                # Paid orders are mostly completed
                if status == "completed":
                    payment_status = random.choices(
                        payment_statuses, weights=[5, 90, 3, 2]
                    )[0]
                elif status == "cancelled":
                    payment_status = random.choice(["pending", "refunded"])
                else:
                    payment_status = random.choices(
                        payment_statuses, weights=[70, 25, 5, 0]
                    )[0]

                # Select random food price items (1-4 items per order)
                num_items = random.randint(1, 4)
                selected_price_items = random.sample(
                    food_prices, min(num_items, len(food_prices))
                )

                # Calculate total from FoodPrice objects
                total_amount = sum(item.price for item in selected_price_items)
                delivery_fee = Decimal(random.choice([100, 150, 200]))
                total_amount += delivery_fee

                # Create order with timestamp
                order_time = date.replace(
                    hour=random.randint(8, 22),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59),
                )

                #Pick a random chef for the order
                chef = random.choice(cooks)
                
                order = Order.objects.create(
                    customer=customer,
                    chef=chef,
                    status=status,
                    payment_status=payment_status,
                    subtotal=total_amount - delivery_fee,
                    total_amount=total_amount,
                    delivery_fee=delivery_fee,
                    delivery_address=f"{random.randint(1, 999)} Main Street, City",
                    customer_notes=random.choice(
                        ["", "Extra spicy", "Less oil", "No onions", "Mild spice"]
                    ),
                    order_number=f"ORD-{int(order_time.timestamp())}-{random.randint(1000, 9999)}",
                )

                # Override created_at to be in the past
                Order.objects.filter(pk=order.pk).update(created_at=order_time)

                # Create order items using FoodPrice objects
                for food_price_item in selected_price_items:
                    quantity = random.randint(1, 3)
                    OrderItem.objects.create(
                        order=order,
                        price=food_price_item,  # This is the FK to FoodPrice
                        quantity=quantity,
                    )

                order_count += 1

                if order_count % 50 == 0:
                    self.stdout.write(f"  Created {order_count} orders...")

        self.stdout.write(
            self.style.SUCCESS(f"✓ Created {order_count} historical orders")
        )

        # Print summary statistics
        self.print_statistics()

    def print_statistics(self):
        """Print statistics about the seeded data"""
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("📊 Data Summary:"))
        self.stdout.write("=" * 50)

        # Users
        total_users = User.objects.count()
        customers = User.objects.filter(role="customer").count()
        cooks = User.objects.filter(role="cook").count()
        self.stdout.write(f"Total Users: {total_users}")
        self.stdout.write(f"  - Customers: {customers}")
        self.stdout.write(f"  - Cooks: {cooks}")

        # Food Items
        total_foods = Food.objects.count()
        self.stdout.write(f"\nTotal Food Items: {total_foods}")

        # Orders
        total_orders = Order.objects.count()
        paid_orders = Order.objects.filter(payment_status="paid").count()
        total_revenue = (
            Order.objects.filter(payment_status="paid").aggregate(
                total=__import__("django.db.models", fromlist=["Sum"]).Sum(
                    "total_amount"
                )
            )["total"]
            or 0
        )

        self.stdout.write(f"\nTotal Orders: {total_orders}")
        self.stdout.write(f"  - Paid Orders: {paid_orders}")
        self.stdout.write(f"  - Total Revenue: LKR {total_revenue:,.2f}")

        # Orders by status
        self.stdout.write("\nOrders by Status:")
        for status in ["pending", "confirmed", "preparing", "completed", "cancelled"]:
            count = Order.objects.filter(status=status).count()
            self.stdout.write(f"  - {status.capitalize()}: {count}")

        # Recent orders (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_orders = Order.objects.filter(created_at__gte=week_ago).count()
        recent_revenue = (
            Order.objects.filter(
                created_at__gte=week_ago, payment_status="paid"
            ).aggregate(
                total=__import__("django.db.models", fromlist=["Sum"]).Sum(
                    "total_amount"
                )
            )[
                "total"
            ]
            or 0
        )

        self.stdout.write(f"\nLast 7 Days:")
        self.stdout.write(f"  - Orders: {recent_orders}")
        self.stdout.write(f"  - Revenue: LKR {recent_revenue:,.2f}")

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(
            self.style.SUCCESS(
                "✅ Analytics Hub should now display data!\n   Refresh your browser to see the updates."
            )
        )
        self.stdout.write("=" * 50 + "\n")

