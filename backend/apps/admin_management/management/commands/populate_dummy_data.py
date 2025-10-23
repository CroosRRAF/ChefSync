"""
Django management command to populate the database with comprehensive dummy data
for testing the ChefSync-Kitchen admin management system.
"""

import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.db import transaction

from apps.authentication.models import User, Customer, Cook, DeliveryAgent
from apps.admin_management.models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings, AdminBackupLog
)
from apps.food.models import Cuisine, FoodCategory, Food, FoodImage, FoodReview, FoodPrice
from apps.orders.models import Order, OrderItem, OrderStatusHistory, CartItem
from apps.payments.models import Payment, Refund, PaymentMethod, Transaction
from apps.users.models import ChefProfile, DeliveryProfile


class Command(BaseCommand):
    help = 'Populate database with comprehensive dummy data for admin system testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data before creating dummy data',
        )
        parser.add_argument(
            '--data-months',
            type=int,
            default=12,
            help='Number of months of historical data to generate (default: 12)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting dummy data generation for ChefSync-Kitchen...')
        )

        if options['clear_existing']:
            self.clear_existing_data()

        data_months = options['data_months']
        self.stdout.write(f'Generating {data_months} months of historical data...')

        try:
            with transaction.atomic():
                # Generate data in dependency order
                self.generate_users()
                self.generate_food_catalog()
                self.generate_orders_and_payments(data_months)
                self.generate_admin_data(data_months)

            self.stdout.write(
                self.style.SUCCESS('Dummy data generation completed successfully!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during data generation: {str(e)}')
            )
            raise

    def clear_existing_data(self):
        """Clear existing data from all models"""
        self.stdout.write('Clearing existing data...')

        # Clear in reverse dependency order
        Transaction.objects.all().delete()
        Refund.objects.all().delete()
        PaymentMethod.objects.all().delete()
        Payment.objects.all().delete()

        CartItem.objects.all().delete()
        OrderStatusHistory.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()

        FoodReview.objects.all().delete()
        FoodImage.objects.all().delete()
        Food.objects.all().delete()
        FoodCategory.objects.all().delete()
        Cuisine.objects.all().delete()

        AdminBackupLog.objects.all().delete()
        AdminSystemSettings.objects.all().delete()
        AdminQuickAction.objects.all().delete()
        AdminDashboardWidget.objects.all().delete()
        SystemHealthMetric.objects.all().delete()
        AdminNotification.objects.all().delete()
        AdminActivityLog.objects.all().delete()

        DeliveryAgent.objects.all().delete()
        Cook.objects.all().delete()
        Customer.objects.all().delete()
        User.objects.all().delete()
        
        # Clear profile models
        ChefProfile.objects.all().delete()
        DeliveryProfile.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

    def generate_users(self):
        """Generate comprehensive user data across all roles"""
        self.stdout.write('Generating user data...')

        # Create admin users
        admin_users = []
        for i in range(3):
            user = User.objects.create(
                name=f'Admin User {i+1}',
                email=f'admin{i+1}@chefsync.com',
                phone_no=f'+123456789{i}',
                role='admin',
                password=make_password('admin123'),
                address=f'123 Admin St, City {i+1}',
                email_verified=True,
                created_at=timezone.now() - timedelta(days=random.randint(30, 365))
            )
            admin_users.append(user)

        # Create customer users
        customer_users = []
        customer_names = [
            'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson',
            'David Brown', 'Lisa Garcia', 'Chris Miller', 'Amanda Taylor',
            'James Anderson', 'Jennifer Martinez', 'Robert Lee', 'Maria Rodriguez',
            'William Thompson', 'Linda White', 'Richard Jackson', 'Patricia Harris',
            'Charles Clark', 'Barbara Lewis', 'Joseph Walker', 'Susan Hall'
        ]

        for i, name in enumerate(customer_names):
            user = User.objects.create(
                name=name,
                email=f'customer{i+1}@example.com',
                phone_no=f'+198765432{i}',
                role='customer',
                password=make_password('customer123'),
                address=f'{random.randint(100, 999)} Main St, City {i+1}',
                email_verified=random.choice([True, False]),
                created_at=timezone.now() - timedelta(days=random.randint(1, 365))
            )
            Customer.objects.create(user=user)
            customer_users.append(user)

        # Create cook users
        cook_users = []
        specialties = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese', 'French', 'Mediterranean']
        kitchens = ['Downtown Kitchen', 'Riverside Kitchen', 'Mountain View Kitchen', 'City Center Kitchen']

        for i in range(8):
            user = User.objects.create(
                name=f'Chef {["Mario", "Ling", "Raj", "Carlos", "Siriporn", "Hiroshi", "Pierre", "Elena"][i % 8]} {["Rossi", "Chen", "Patel", "Garcia", "Sukhumvit", "Tanaka", "Dubois", "Moreno"][i % 8]}',
                email=f'cook{i+1}@chefsync.com',
                phone_no=f'+1555123{i:03d}',
                role='cook',
                password=make_password('cook123'),
                address=f'{random.randint(200, 800)} Kitchen Ave, City {i+1}',
                email_verified=True,
                created_at=timezone.now() - timedelta(days=random.randint(30, 365))
            )
            Cook.objects.create(
                user=user,
                specialty=random.choice(specialties),
                kitchen_location=random.choice(kitchens),
                experience_years=random.randint(2, 15),
                rating_avg=round(random.uniform(3.5, 5.0), 1),
                availability_hours='09:00-22:00'
            )
            # Create ChefProfile with approval status
            approval_status = 'pending' if i < 4 else 'approved'  # First 4 pending, rest approved
            ChefProfile.objects.create(
                user=user,
                specialty_cuisines=[random.choice(specialties)],
                experience_years=random.randint(2, 15),
                bio=f'Experienced chef specializing in {random.choice(specialties)} cuisine.',
                approval_status=approval_status,  # Explicitly set approval_status
                rating_average=round(random.uniform(3.5, 5.0), 1),
                total_orders=random.randint(10, 200),
                total_reviews=random.randint(5, 50),
                is_featured=random.choice([True, False])
            )
            cook_users.append(user)

        # Create delivery agent users
        delivery_users = []
        vehicles = ['Car', 'Motorcycle', 'Bicycle', 'Scooter']
        vehicle_numbers = [f'VEH{random.randint(1000, 9999)}' for _ in range(6)]

        for i in range(6):
            user = User.objects.create(
                name=f'Delivery Agent {i+1}',
                email=f'delivery{i+1}@chefsync.com',
                phone_no=f'+1444987{i:03d}',
                role='delivery_agent',
                password=make_password('delivery123'),
                address=f'{random.randint(300, 900)} Delivery St, City {i+1}',
                email_verified=True,
                created_at=timezone.now() - timedelta(days=random.randint(30, 365))
            )
            DeliveryAgent.objects.create(
                user=user,
                vehicle_type=random.choice(vehicles),
                vehicle_number=random.choice(vehicle_numbers),
                current_location=f'Location {random.randint(1, 10)}',
                is_available=random.choice([True, True, True, False])  # 75% available
            )
            # Create DeliveryProfile
            DeliveryProfile.objects.create(
                user=user,
                vehicle_type=random.choice(vehicles).lower(),
                vehicle_number=random.choice(vehicle_numbers),
                license_number=f'LIC{random.randint(100000, 999999)}',
                is_available=random.choice([True, True, True, False]),
                rating_average=round(random.uniform(3.0, 5.0), 1),
                total_deliveries=random.randint(10, 500),
                total_earnings=round(random.uniform(500, 5000), 2),
                approval_status='approved'  # All delivery agents are approved by default
            )
            delivery_users.append(user)

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(admin_users)} admins, {len(customer_users)} customers, '
            f'{len(cook_users)} cooks, {len(delivery_users)} delivery agents'
        ))

        # Store for later use
        self.admin_users = admin_users
        self.customer_users = customer_users
        self.cook_users = cook_users
        self.delivery_users = delivery_users

    def generate_food_catalog(self):
        """Generate comprehensive food catalog"""
        self.stdout.write('Generating food catalog...')

        # Create cuisines
        cuisines_data = [
            {'name': 'Italian', 'description': 'Traditional Italian cuisine with pasta, pizza, and regional specialties'},
            {'name': 'Chinese', 'description': 'Authentic Chinese dishes from various regions'},
            {'name': 'Indian', 'description': 'Rich Indian flavors with diverse regional cuisines'},
            {'name': 'Mexican', 'description': 'Vibrant Mexican cuisine with fresh ingredients'},
            {'name': 'Thai', 'description': 'Aromatic Thai dishes with perfect balance of flavors'},
            {'name': 'Japanese', 'description': 'Delicate Japanese cuisine with fresh seafood and rice'},
            {'name': 'French', 'description': 'Classic French cuisine with sophisticated techniques'},
            {'name': 'Mediterranean', 'description': 'Healthy Mediterranean diet with olive oil and fresh produce'},
        ]

        cuisines = []
        for cuisine_data in cuisines_data:
            cuisine = Cuisine.objects.create(**cuisine_data)
            cuisines.append(cuisine)

        # Create food categories for each cuisine
        categories_data = {
            'Italian': ['Appetizers', 'Pasta', 'Pizza', 'Main Courses', 'Desserts'],
            'Chinese': ['Dim Sum', 'Noodles', 'Rice Dishes', 'Stir Fries', 'Soups'],
            'Indian': ['Appetizers', 'Curry', 'Rice Dishes', 'Bread', 'Desserts'],
            'Mexican': ['Appetizers', 'Tacos', 'Burritos', 'Enchiladas', 'Desserts'],
            'Thai': ['Appetizers', 'Curry', 'Noodles', 'Rice Dishes', 'Desserts'],
            'Japanese': ['Sushi', 'Sashimi', 'Ramen', 'Tempura', 'Desserts'],
            'French': ['Appetizers', 'Main Courses', 'Desserts', 'Pastries'],
            'Mediterranean': ['Appetizers', 'Grilled Dishes', 'Salads', 'Seafood', 'Desserts'],
        }

        categories = []
        for cuisine in cuisines:
            for category_name in categories_data.get(cuisine.name, []):
                category = FoodCategory.objects.create(
                    name=category_name,
                    cuisine=cuisine,
                    description=f'{category_name} from {cuisine.name} cuisine'
                )
                categories.append(category)

        # Create food items
        food_items = [
            # Italian
            {'name': 'Margherita Pizza', 'category': 'Pizza', 'cuisine': 'Italian', 'price': 18.99, 'prep_time': 20},
            {'name': 'Spaghetti Carbonara', 'category': 'Pasta', 'cuisine': 'Italian', 'price': 16.99, 'prep_time': 15},
            {'name': 'Lasagna', 'category': 'Main Courses', 'cuisine': 'Italian', 'price': 22.99, 'prep_time': 35},
            {'name': 'Tiramisu', 'category': 'Desserts', 'cuisine': 'Italian', 'price': 8.99, 'prep_time': 10},

            # Chinese
            {'name': 'Kung Pao Chicken', 'category': 'Stir Fries', 'cuisine': 'Chinese', 'price': 15.99, 'prep_time': 20},
            {'name': 'Sweet and Sour Pork', 'category': 'Stir Fries', 'cuisine': 'Chinese', 'price': 16.99, 'prep_time': 25},
            {'name': 'Fried Rice', 'category': 'Rice Dishes', 'cuisine': 'Chinese', 'price': 12.99, 'prep_time': 15},
            {'name': 'Wonton Soup', 'category': 'Soups', 'cuisine': 'Chinese', 'price': 9.99, 'prep_time': 10},

            # Indian
            {'name': 'Butter Chicken', 'category': 'Curry', 'cuisine': 'Indian', 'price': 17.99, 'prep_time': 30},
            {'name': 'Paneer Tikka Masala', 'category': 'Curry', 'cuisine': 'Indian', 'price': 16.99, 'prep_time': 25},
            {'name': 'Biryani', 'category': 'Rice Dishes', 'cuisine': 'Indian', 'price': 19.99, 'prep_time': 35},
            {'name': 'Naan Bread', 'category': 'Bread', 'cuisine': 'Indian', 'price': 3.99, 'prep_time': 10},

            # Mexican
            {'name': 'Chicken Fajitas', 'category': 'Main Courses', 'cuisine': 'Mexican', 'price': 16.99, 'prep_time': 20},
            {'name': 'Beef Tacos', 'category': 'Tacos', 'cuisine': 'Mexican', 'price': 14.99, 'prep_time': 15},
            {'name': 'Enchiladas', 'category': 'Enchiladas', 'cuisine': 'Mexican', 'price': 15.99, 'prep_time': 25},
            {'name': 'Churros', 'category': 'Desserts', 'cuisine': 'Mexican', 'price': 7.99, 'prep_time': 10},

            # Thai
            {'name': 'Pad Thai', 'category': 'Noodles', 'cuisine': 'Thai', 'price': 15.99, 'prep_time': 20},
            {'name': 'Green Curry', 'category': 'Curry', 'cuisine': 'Thai', 'price': 16.99, 'prep_time': 25},
            {'name': 'Tom Yum Soup', 'category': 'Soups', 'cuisine': 'Thai', 'price': 11.99, 'prep_time': 15},
            {'name': 'Mango Sticky Rice', 'category': 'Desserts', 'cuisine': 'Thai', 'price': 8.99, 'prep_time': 10},

            # Japanese
            {'name': 'California Roll', 'category': 'Sushi', 'cuisine': 'Japanese', 'price': 12.99, 'prep_time': 15},
            {'name': 'Ramen', 'category': 'Ramen', 'cuisine': 'Japanese', 'price': 14.99, 'prep_time': 20},
            {'name': 'Tempura Udon', 'category': 'Noodles', 'cuisine': 'Japanese', 'price': 16.99, 'prep_time': 25},
            {'name': 'Mochi Ice Cream', 'category': 'Desserts', 'cuisine': 'Japanese', 'price': 6.99, 'prep_time': 5},

            # French
            {'name': 'Coq au Vin', 'category': 'Main Courses', 'cuisine': 'French', 'price': 28.99, 'prep_time': 45},
            {'name': 'Bouillabaisse', 'category': 'Main Courses', 'cuisine': 'French', 'price': 32.99, 'prep_time': 40},
            {'name': 'Crème Brûlée', 'category': 'Desserts', 'cuisine': 'French', 'price': 9.99, 'prep_time': 15},
            {'name': 'Escargot', 'category': 'Appetizers', 'cuisine': 'French', 'price': 18.99, 'prep_time': 20},

            # Mediterranean
            {'name': 'Greek Salad', 'category': 'Salads', 'cuisine': 'Mediterranean', 'price': 13.99, 'prep_time': 10},
            {'name': 'Grilled Octopus', 'category': 'Seafood', 'cuisine': 'Mediterranean', 'price': 24.99, 'prep_time': 30},
            {'name': 'Falafel Wrap', 'category': 'Main Courses', 'cuisine': 'Mediterranean', 'price': 14.99, 'prep_time': 20},
            {'name': 'Baklava', 'category': 'Desserts', 'cuisine': 'Mediterranean', 'price': 7.99, 'prep_time': 10},
        ]

        foods = []
        for food_data in food_items:
            # Find matching category and cuisine
            cuisine = next((c for c in cuisines if c.name == food_data['cuisine']), None)
            if not cuisine:
                continue

            category = next((cat for cat in categories
                           if cat.name == food_data['category'] and cat.cuisine == cuisine), None)
            if not category:
                continue

            # Assign to random cook
            chef = random.choice(self.cook_users)

            food = Food.objects.create(
                name=food_data['name'],
                category=food_data['category'],
                description=f'Delicious {food_data["name"]} prepared with fresh ingredients and authentic {food_data["cuisine"]} techniques.',
                status='Approved',  # Set as approved for dummy data
                admin=random.choice(self.admin_users) if hasattr(self, 'admin_users') and self.admin_users else None,
                chef=chef,
                food_category=category,
                is_available=random.choice([True, True, True, False]),  # 75% available
                is_featured=random.choice([True, False, False, False]),  # 25% featured
                preparation_time=food_data['prep_time'],
                calories_per_serving=random.randint(300, 800),
                ingredients=['ingredient1', 'ingredient2', 'ingredient3'],
                allergens=random.choice([[], ['nuts'], ['dairy'], ['gluten']]),
                nutritional_info={'protein': random.randint(10, 30), 'carbs': random.randint(20, 60), 'fat': random.randint(5, 25)},
                is_vegetarian=random.choice([True, False]),
                is_vegan=random.choice([True, False]),
                is_gluten_free=random.choice([True, False]),
                spice_level=random.choice(['mild', 'medium', 'hot', None]),
                rating_average=round(random.uniform(3.0, 5.0), 1),
                total_reviews=random.randint(0, 50),
                total_orders=random.randint(0, 100),
                created_at=timezone.now() - timedelta(days=random.randint(1, 365))
            )
            
            # Create FoodPrice entries for different sizes
            base_price = Decimal(str(food_data['price']))
            for size_choice in ['Small', 'Medium', 'Large']:
                if size_choice == 'Small':
                    price = base_price * Decimal('0.8')  # 20% less
                elif size_choice == 'Medium':
                    price = base_price  # Base price
                else:  # Large
                    price = base_price * Decimal('1.3')  # 30% more
                
                FoodPrice.objects.create(
                    food=food,
                    size=size_choice,
                    price=price,
                    cook=chef,
                    image_url=f'https://example.com/food_{food.food_id}_{size_choice.lower()}.jpg'
                )
            foods.append(food)

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(cuisines)} cuisines, {len(categories)} categories, {len(foods)} food items'
        ))

        # Store for later use
        self.foods = foods

    def generate_orders_and_payments(self, data_months):
        """Generate comprehensive order and payment history"""
        self.stdout.write('Generating orders and payments...')

        orders = []
        payments = []

        # Generate orders for the past data_months
        start_date = timezone.now() - timedelta(days=data_months * 30)
        end_date = timezone.now()

        # Create orders with realistic distribution
        total_orders = 500  # Adjust based on needs

        for i in range(total_orders):
            # Random date within the period
            order_date = start_date + timedelta(
                days=random.randint(0, (end_date - start_date).days)
            )

            # Select random customer and cook
            customer = random.choice(self.customer_users)
            chef = random.choice(self.cook_users)

            # Order status distribution (weighted towards completed)
            status_weights = [('delivered', 60), ('confirmed', 15), ('preparing', 10),
                            ('out_for_delivery', 8), ('ready', 5), ('cancelled', 2)]
            status = random.choices([s[0] for s in status_weights],
                                  weights=[s[1] for s in status_weights])[0]

            # Create order
            order = Order.objects.create(
                customer=customer,
                chef=chef,
                delivery_partner=random.choice(self.delivery_users) if random.choice([True, False]) else None,
                status=status,
                payment_status='paid' if status in ['delivered', 'ready', 'out_for_delivery'] else
                             'pending' if status == 'confirmed' else 'failed',
                payment_method=random.choice(['card', 'online', 'cash']),
                subtotal=Decimal('0.00'),
                tax_amount=Decimal('0.00'),
                delivery_fee=Decimal(str(round(random.uniform(2.99, 8.99), 2))),
                discount_amount=Decimal('0.00'),
                total_amount=Decimal('0.00'),
                delivery_address=customer.address,
                delivery_instructions=random.choice(['', 'Leave at door', 'Ring doorbell', 'Call upon arrival']),
                estimated_delivery_time=order_date + timedelta(hours=random.randint(1, 3)),
                actual_delivery_time=order_date + timedelta(hours=random.randint(1, 4)) if status == 'delivered' else None,
                preparation_time=random.randint(15, 45),
                customer_notes=random.choice(['', 'Extra spicy', 'No onions', 'Well done']),
                chef_notes=random.choice(['', 'Prepared with care', 'Used fresh ingredients']),
                admin_notes='' if random.randint(1, 10) > 8 else 'Order processed successfully',
                created_at=order_date,
                updated_at=order_date + timedelta(minutes=random.randint(30, 180)),
                confirmed_at=order_date + timedelta(minutes=random.randint(5, 30)) if status != 'cart' else None,
                cancelled_at=order_date + timedelta(hours=random.randint(1, 24)) if status == 'cancelled' else None
            )

            # Add order items (1-5 items per order)
            num_items = random.randint(1, 5)
            subtotal = Decimal('0.00')
            selected_foods = set()  # Track selected foods to avoid duplicates

            for _ in range(num_items):
                # Ensure we don't select the same food twice for the same order
                available_foods = [f for f in self.foods if f not in selected_foods]
                if not available_foods:
                    break  # No more unique foods available

                # Get a random food with its prices
                food = random.choice(available_foods)
                selected_foods.add(food)
                
                food_prices = FoodPrice.objects.filter(food=food)
                if not food_prices:
                    continue
                    
                food_price = random.choice(food_prices)
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
                    special_instructions=random.choice(['', 'Extra sauce', 'Less salt', 'Medium rare']),
                    food_name=food.name,
                    food_description=food.description if hasattr(food, 'description') else ''
                )

            # Calculate totals
            tax_rate = Decimal('0.08')  # 8% tax
            tax_amount = subtotal * tax_rate
            discount_amount = Decimal(str(round(random.uniform(0, float(subtotal * Decimal('0.2'))), 2))) if random.choice([True, False, False]) else Decimal('0.00')
            total_amount = subtotal + tax_amount + order.delivery_fee - discount_amount

            order.subtotal = subtotal
            order.tax_amount = tax_amount
            order.discount_amount = discount_amount
            order.total_amount = total_amount
            order.save()

            # Create order status history
            status_sequence = {
                'cart': [],
                'pending': ['cart'],
                'confirmed': ['cart', 'pending'],
                'preparing': ['cart', 'pending', 'confirmed'],
                'ready': ['cart', 'pending', 'confirmed', 'preparing'],
                'out_for_delivery': ['cart', 'pending', 'confirmed', 'preparing', 'ready'],
                'delivered': ['cart', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'],
                'cancelled': ['cart', 'pending', 'confirmed'][:random.randint(1, 3)],
                'refunded': ['cart', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
            }

            current_time = order_date
            for status_step in status_sequence.get(status, []):
                OrderStatusHistory.objects.create(
                    order=order,
                    status=status_step,
                    changed_by=random.choice(self.admin_users + [customer, chef]),
                    notes=f'Status changed to {status_step}',
                    created_at=current_time
                )
                current_time += timedelta(minutes=random.randint(15, 60))

            # Add final status
            OrderStatusHistory.objects.create(
                order=order,
                status=status,
                changed_by=random.choice(self.admin_users),
                notes=f'Final status: {status}',
                created_at=current_time
            )

            # Create payment record
            if order.payment_status in ['paid', 'refunded']:
                payment = Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    currency='USD',
                    payment_method=order.payment_method,
                    payment_provider=random.choice(['stripe', 'paypal', 'razorpay', 'square']),
                    status='completed' if order.payment_status == 'paid' else 'refunded',
                    provider_payment_id=f'prov_{uuid.uuid4().hex[:12]}',
                    provider_transaction_id=f'txn_{uuid.uuid4().hex[:12]}',
                    description=f'Payment for order {order.order_number}',
                    created_at=order_date + timedelta(minutes=random.randint(1, 10)),
                    updated_at=order_date + timedelta(minutes=random.randint(30, 120)),
                    processed_at=order_date + timedelta(minutes=random.randint(5, 15))
                )
                payments.append(payment)

                # Create transaction record
                Transaction.objects.create(
                    payment=payment,
                    transaction_type='payment',
                    amount=payment.amount,
                    currency=payment.currency,
                    status='completed',
                    provider_transaction_id=payment.provider_transaction_id,
                    description=f'Transaction for order {order.order_number}',
                    created_at=payment.created_at,
                    processed_at=payment.processed_at
                )

                # Create refund if order was refunded
                if order.payment_status == 'refunded':
                    refund = Refund.objects.create(
                        payment=payment,
                        amount=payment.amount,
                        reason=random.choice(['customer_request', 'order_cancelled', 'quality_issue']),
                        description=f'Refund for order {order.order_number}',
                        status='completed',
                        provider_refund_id=f'ref_{uuid.uuid4().hex[:12]}',
                        processed_by=random.choice(self.admin_users),
                        notes='Refund processed successfully',
                        created_at=order_date + timedelta(hours=random.randint(1, 24)),
                        processed_at=order_date + timedelta(hours=random.randint(2, 48))
                    )

                    # Create refund transaction
                    Transaction.objects.create(
                        refund=refund,
                        transaction_type='refund',
                        amount=-refund.amount,  # Negative for refund
                        currency=payment.currency,
                        status='completed',
                        provider_transaction_id=refund.provider_refund_id,
                        description=f'Refund for order {order.order_number}',
                        created_at=refund.created_at,
                        processed_at=refund.processed_at
                    )

            orders.append(order)

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(orders)} orders with {len(payments)} payments'
        ))

        # Store for later use
        self.orders = orders
        self.payments = payments

    def generate_admin_data(self, data_months):
        """Generate comprehensive admin management data"""
        self.stdout.write('Generating admin management data...')

        start_date = timezone.now() - timedelta(days=data_months * 30)

        # Generate admin activity logs
        activities = [
            'User login', 'User logout', 'Order created', 'Order updated', 'Order cancelled',
            'Payment processed', 'Refund issued', 'User created', 'User updated', 'User deleted',
            'Food item created', 'Food item updated', 'Food item deleted', 'System settings updated',
            'Backup created', 'Report generated', 'Notification sent', 'Dashboard viewed'
        ]

        activity_logs = []
        for i in range(1000):  # Generate 1000 activity logs
            activity_date = start_date + timedelta(
                days=random.randint(0, data_months * 30)
            )

            log = AdminActivityLog.objects.create(
                admin=random.choice(self.admin_users),
                action=random.choice(['create', 'update', 'delete', 'view', 'login', 'logout']),
                resource_type=random.choice(['user', 'order', 'food', 'payment', 'system', 'settings', 'report']),
                resource_id=str(random.randint(1, 1000)),
                description=f'Admin performed {random.choice(activities).lower()}',
                ip_address=f'192.168.1.{random.randint(1, 255)}',
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                metadata={'browser': 'Chrome', 'os': 'Windows'},
                timestamp=activity_date
            )
            activity_logs.append(log)

        # Generate system health metrics
        metrics = []
        for i in range(data_months * 30):  # Daily metrics
            metric_date = start_date + timedelta(days=i)

            # Create individual metrics
            metrics_data = [
                ('cpu_usage', random.uniform(10, 90), '%'),
                ('memory_usage', random.uniform(20, 95), '%'),
                ('disk_usage', random.uniform(15, 85), '%'),
                ('response_time', random.uniform(50, 500), 'ms'),
                ('error_rate', random.uniform(0, 0.05), '%'),
                ('active_users', random.randint(5, 200), 'count'),
                ('database_connections', random.randint(1, 50), 'count'),
                ('api_calls', random.randint(100, 10000), 'count'),
            ]

            for metric_type, value, unit in metrics_data:
                metric = SystemHealthMetric.objects.create(
                    metric_type=metric_type,
                    value=round(value, 2) if unit != 'count' else value,
                    unit=unit,
                    timestamp=metric_date,
                    metadata={'source': 'system_monitor', 'server': 'main'}
                )
                metrics.append(metric)

        # Generate admin notifications
        notification_types = [
            'system_alert', 'user_activity', 'order_update', 'payment_issue',
            'security_event', 'maintenance', 'backup', 'performance'
        ]

        notifications = []
        for i in range(200):  # Generate 200 notifications
            notification_date = start_date + timedelta(
                days=random.randint(0, data_months * 30)
            )

            notification = AdminNotification.objects.create(
                title=f'System {random.choice(["Alert", "Update", "Warning", "Info"])}',
                message=f'This is a {random.choice(notification_types)} notification with details about system status.',
                notification_type=random.choice(notification_types),
                priority=random.choice(['low', 'medium', 'high', 'critical']),
                is_read=random.choice([True, False, False]),  # 33% read
                metadata={'source': 'system', 'category': random.choice(['security', 'performance', 'orders', 'users'])},
                created_at=notification_date,
                read_at=notification_date + timedelta(hours=random.randint(1, 24)) if random.choice([True, False]) else None
            )
            notifications.append(notification)

        # Generate dashboard widgets
        widgets = []
        widget_configs = [
            {'name': 'Total Orders', 'type': 'stats_card', 'chart_type': None, 'title': 'Order Statistics', 'data_source': '/api/admin/orders/stats'},
            {'name': 'Total Revenue', 'type': 'stats_card', 'chart_type': None, 'title': 'Revenue Overview', 'data_source': '/api/admin/payments/stats'},
            {'name': 'Active Users', 'type': 'stats_card', 'chart_type': None, 'title': 'User Activity', 'data_source': '/api/admin/users/stats'},
            {'name': 'System Health', 'type': 'chart', 'chart_type': 'line', 'title': 'Performance Metrics', 'data_source': '/api/admin/system-health'},
            {'name': 'Recent Orders', 'type': 'table', 'chart_type': None, 'title': 'Latest Orders', 'data_source': '/api/admin/orders/recent'},
            {'name': 'Popular Foods', 'type': 'chart', 'chart_type': 'bar', 'title': 'Top Food Items', 'data_source': '/api/admin/foods/popular'},
        ]

        for config in widget_configs:
            widget = AdminDashboardWidget.objects.create(
                name=config['name'],
                widget_type=config['type'],
                chart_type=config['chart_type'],
                title=config['title'],
                description=f'Dashboard widget showing {config["name"].lower()}',
                data_source=config['data_source'],
                position_x=random.randint(0, 10),
                position_y=random.randint(0, 5),
                width=random.randint(3, 6),
                height=random.randint(2, 4),
                is_active=True,
                refresh_interval=random.choice([300, 600, 900]),
                config={'show_legend': True, 'auto_refresh': True},
                created_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )
            widgets.append(widget)

        # Generate quick actions
        actions = []
        quick_actions = [
            {'name': 'Create New Order', 'action_type': 'view_orders', 'title': 'Create Order', 'icon': 'plus', 'color': 'blue'},
            {'name': 'Process Refund', 'action_type': 'view_orders', 'title': 'Process Refund', 'icon': 'refund', 'color': 'red'},
            {'name': 'Send Notification', 'action_type': 'view_orders', 'title': 'Send Alert', 'icon': 'bell', 'color': 'yellow'},
            {'name': 'Generate Report', 'action_type': 'view_orders', 'title': 'Export Data', 'icon': 'download', 'color': 'green'},
            {'name': 'Update System Settings', 'action_type': 'view_orders', 'title': 'Settings', 'icon': 'settings', 'color': 'purple'},
        ]

        for action_data in quick_actions:
            action = AdminQuickAction.objects.create(
                name=action_data['name'],
                action_type=action_data['action_type'],
                title=action_data['title'],
                description=f'Quick action to {action_data["name"].lower()}',
                icon=action_data['icon'],
                color=action_data['color'],
                is_active=True,
                requires_confirmation=random.choice([True, False]),
                confirmation_message='Are you sure you want to perform this action?' if random.choice([True, False]) else '',
                position=random.randint(1, 10),
                config={'redirect_url': f'/admin/{action_data["action_type"].replace("_", "/")}'},
                created_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )
            actions.append(action)

        # Generate system settings
        settings = []
        system_settings = [
            {'key': 'site_name', 'value': 'ChefSync Kitchen', 'category': 'general'},
            {'key': 'site_description', 'value': 'Premium food delivery platform', 'category': 'general'},
            {'key': 'contact_email', 'value': 'support@chefsync.com', 'category': 'contact'},
            {'key': 'contact_phone', 'value': '+1-800-CHEF-SYNC', 'category': 'contact'},
            {'key': 'delivery_radius', 'value': '25', 'category': 'delivery'},
            {'key': 'delivery_fee', 'value': '2.99', 'category': 'delivery'},
            {'key': 'tax_rate', 'value': '0.08', 'category': 'payment'},
            {'key': 'currency', 'value': 'USD', 'category': 'payment'},
            {'key': 'maintenance_mode', 'value': 'false', 'category': 'system'},
            {'key': 'max_orders_per_hour', 'value': '100', 'category': 'system'},
        ]

        for setting_data in system_settings:
            setting = AdminSystemSettings.objects.create(
                key=setting_data['key'],
                value=setting_data['value'],
                category=setting_data['category'],
                description=f'System setting for {setting_data["key"]}',
                is_public=random.choice([True, False]),
                updated_by=random.choice(self.admin_users),
                created_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                updated_at=timezone.now() - timedelta(days=random.randint(0, 7))
            )
            settings.append(setting)

        # Generate backup logs
        backups = []
        for i in range(30):  # Monthly backups for the past year
            backup_date = start_date + timedelta(days=i * 30)

            backup = AdminBackupLog.objects.create(
                backup_type=random.choice(['database', 'files', 'full', 'incremental']),
                status=random.choice(['completed', 'completed', 'completed', 'failed']),  # 75% success rate
                file_path=f'/backups/backup_{backup_date.strftime("%Y%m%d")}.sql',
                file_size=random.randint(100 * 1024 * 1024, 2 * 1024 * 1024 * 1024),  # 100MB - 2GB
                started_at=backup_date,
                completed_at=backup_date + timedelta(minutes=random.randint(30, 120)) if random.choice([True, False, False, False]) else None,
                error_message='' if random.choice([True, False, False, False]) else 'Connection timeout',
                created_by=random.choice(self.admin_users),
                metadata={'tables': ['users', 'orders', 'payments', 'foods'], 'compression': 'gzip'}
            )
            backups.append(backup)

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(activity_logs)} activity logs, {len(metrics)} health metrics, '
            f'{len(notifications)} notifications, {len(widgets)} widgets, '
            f'{len(actions)} quick actions, {len(settings)} settings, {len(backups)} backups'
        ))