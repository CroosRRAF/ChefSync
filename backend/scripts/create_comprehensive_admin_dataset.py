#!/usr/bin/env python3
"""
Comprehensive Admin Dataset Creator for ChefSync-Kitchen
Creates a rich, realistic dataset optimized for admin management testing
"""

import os
import sys
import django
from pathlib import Path
import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.db import transaction

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, DocumentType, UserDocument
from apps.admin_management.models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings, AdminBackupLog
)
from apps.food.models import Cuisine, FoodCategory, Food, FoodImage, FoodReview, FoodPrice, Offer
from apps.orders.models import Order, OrderItem, OrderStatusHistory, CartItem, Delivery, DeliveryReview
from apps.payments.models import Payment, Refund, PaymentMethod, Transaction
from apps.communications.models import (
    Communication, CommunicationResponse, CommunicationTemplate,
    CommunicationCategory, CommunicationTag, Contact
)
from apps.users.models import UserProfile, ChefProfile, DeliveryProfile

class ComprehensiveAdminDatasetCreator:
    def __init__(self):
        self.start_date = timezone.now() - timedelta(days=365)  # 1 year of data
        self.end_date = timezone.now()
        
        # Sample data arrays
        self.first_names = [
            'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
            'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel',
            'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Karen', 'Mark', 'Helen', 'Donald',
            'Sandra', 'Steven', 'Donna', 'Paul', 'Carol', 'Andrew', 'Ruth', 'Joshua',
            'Sharon', 'Kenneth', 'Michelle', 'Kevin', 'Laura', 'Brian', 'Sarah',
            'George', 'Kimberly', 'Timothy', 'Deborah', 'Ronald', 'Dorothy', 'Jason',
            'Lisa', 'Edward', 'Nancy', 'Jeffrey', 'Karen', 'Ryan', 'Betty', 'Jacob',
            'Helen', 'Gary', 'Sandra', 'Nicholas', 'Donna', 'Eric', 'Carol', 'Jonathan',
            'Ruth', 'Stephen', 'Sharon', 'Larry', 'Michelle', 'Justin', 'Laura',
            'Scott', 'Sarah', 'Brandon', 'Kimberly', 'Benjamin', 'Deborah', 'Samuel',
            'Dorothy', 'Gregory', 'Lisa', 'Alexander', 'Nancy', 'Patrick', 'Karen',
            'Jack', 'Betty', 'Dennis', 'Helen', 'Jerry', 'Sandra', 'Tyler', 'Donna'
        ]
        
        self.last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
            'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
            'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
            'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
            'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner',
            'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris',
            'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan',
            'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim',
            'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James',
            'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo',
            'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
        ]
        
        self.cities = [
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
            'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
            'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
            'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville',
            'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
            'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Mesa',
            'Sacramento', 'Atlanta', 'Kansas City', 'Colorado Springs', 'Omaha',
            'Raleigh', 'Miami', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa',
            'Arlington', 'Tampa', 'New Orleans'
        ]
        
        self.streets = [
            'Main St', 'Oak Ave', 'First St', 'Second St', 'Third St', 'Park Ave',
            'Washington St', 'Lincoln Ave', 'Jefferson St', 'Madison Ave', 'Franklin St',
            'Broadway', 'Center St', 'Church St', 'Market St', 'Spring St', 'High St',
            'School St', 'Water St', 'Mill St', 'Bridge St', 'Cedar St', 'Elm St',
            'Maple St', 'Pine St', 'Chestnut St', 'Walnut St', 'Cherry St', 'Poplar St'
        ]

    def create_admin_user(self):
        """Create the main admin user"""
        print("Creating admin user...")
        
        admin_user = User.objects.create_user(
            email='admin@chefsync.com',
            password='admin123',
            name='System Administrator',
            role='admin',
            is_staff=True,
            is_superuser=True,
            email_verified=True,
            phone_no='+1-555-0001',
            address='123 Admin Street, Admin City, AC 12345'
        )
        
        # Create admin profile
        UserProfile.objects.create(
            user=admin_user,
            address='123 Admin Street, Admin City, AC 12345',
            date_of_birth=datetime(1985, 1, 1).date(),
            gender='other',
            bio='System administrator for ChefSync platform'
        )
        
        return admin_user

    def create_users(self, count=200):
        """Create diverse users with different roles and statuses"""
        print(f"Creating {count} users...")
        
        users = []
        
        # Create 5 additional admins
        for i in range(5):
            user = User.objects.create_user(
                email=f'admin{i+1}@chefsync.com',
                password='admin123',
                name=f'Admin User {i+1}',
                role='admin',
                is_staff=True,
                is_superuser=True,
                email_verified=True,
                phone_no=f'+1-555-{1000+i:04d}',
                address=f'{random.randint(100, 999)} Admin St, Admin City, AC 12345'
            )
            UserProfile.objects.create(user=user, bio=f'Admin user {i+1}')
            users.append(user)
        
        # Create customers (60% of remaining)
        customer_count = int((count - 5) * 0.6)
        for i in range(customer_count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            city = random.choice(self.cities)
            street = random.choice(self.streets)
            
            user = User.objects.create_user(
                email=f'customer{i+1}@example.com',
                password='customer123',
                name=f'{first_name} {last_name}',
                role='customer',
                email_verified=random.choice([True, True, True, False]),  # 75% verified
                phone_no=f'+1-555-{random.randint(1000, 9999):04d}',
                address=f'{random.randint(100, 9999)} {street}, {city}, {random.choice(["NY", "CA", "TX", "FL", "IL"])} {random.randint(10000, 99999)}',
                status=random.choice(['active', 'active', 'active', 'inactive'])  # 75% active
            )
            UserProfile.objects.create(
                user=user,
                address=user.address,
                date_of_birth=datetime(1970 + random.randint(18, 50), random.randint(1, 12), random.randint(1, 28)).date(),
                gender=random.choice(['male', 'female', 'other']),
                bio=f'Customer from {city}'
            )
            users.append(user)
        
        # Create cooks (25% of remaining)
        cook_count = int((count - 5) * 0.25)
        for i in range(cook_count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            city = random.choice(self.cities)
            street = random.choice(self.streets)
            
            user = User.objects.create_user(
                email=f'cook{i+1}@example.com',
                password='cook123',
                name=f'{first_name} {last_name}',
                role='cook',
                email_verified=True,
                phone_no=f'+1-555-{random.randint(2000, 2999):04d}',
                address=f'{random.randint(100, 9999)} {street}, {city}, {random.choice(["NY", "CA", "TX", "FL", "IL"])} {random.randint(10000, 99999)}',
                status=random.choice(['active', 'active', 'inactive']),  # 67% active
                approval_status=random.choice(['approved', 'approved', 'pending', 'rejected'])  # 67% approved
            )
            
            # Create user profile
            profile = UserProfile.objects.create(
                user=user,
                address=user.address,
                date_of_birth=datetime(1970 + random.randint(20, 45), random.randint(1, 12), random.randint(1, 28)).date(),
                gender=random.choice(['male', 'female']),
                bio=f'Professional chef from {city}'
            )
            
            # Create chef profile
            ChefProfile.objects.create(
                user=user,
                specialty_cuisines=random.sample(['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai'], random.randint(1, 3)),
                experience_years=random.randint(1, 20),
                certifications=random.sample(['Culinary Arts', 'Food Safety', 'Nutrition', 'Pastry Arts'], random.randint(1, 3)),
                bio=f'Experienced chef with {random.randint(1, 20)} years of experience',
                approval_status=user.approval_status
            )
            users.append(user)
        
        # Create delivery agents (15% of remaining)
        delivery_count = int((count - 5) * 0.15)
        for i in range(delivery_count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            city = random.choice(self.cities)
            street = random.choice(self.streets)
            
            user = User.objects.create_user(
                email=f'delivery{i+1}@example.com',
                password='delivery123',
                name=f'{first_name} {last_name}',
                role='DeliveryAgent',
                email_verified=True,
                phone_no=f'+1-555-{random.randint(3000, 3999):04d}',
                address=f'{random.randint(100, 9999)} {street}, {city}, {random.choice(["NY", "CA", "TX", "FL", "IL"])} {random.randint(10000, 99999)}',
                status=random.choice(['active', 'active', 'inactive']),  # 67% active
                approval_status=random.choice(['approved', 'approved', 'pending', 'rejected'])  # 67% approved
            )
            
            # Create user profile
            profile = UserProfile.objects.create(
                user=user,
                address=user.address,
                date_of_birth=datetime(1970 + random.randint(18, 50), random.randint(1, 12), random.randint(1, 28)).date(),
                gender=random.choice(['male', 'female']),
                bio=f'Delivery agent from {city}'
            )
            
            # Create delivery profile
            DeliveryProfile.objects.create(
                user=user,
                vehicle_type=random.choice(['bike', 'car', 'scooter', 'foot']),
                vehicle_number=f'VH{random.randint(1000, 9999)}',
                license_number=f'DL{random.randint(100000, 999999)}',
                insurance_info={
                    'provider': random.choice(['State Farm', 'Geico', 'Progressive', 'Allstate']),
                    'policy_number': f'POL{random.randint(100000, 999999)}',
                    'expiry_date': (timezone.now() + timedelta(days=365)).strftime('%Y-%m-%d')
                },
                is_available=random.choice([True, True, False]),  # 67% available
                approval_status=user.approval_status
            )
            users.append(user)
        
        return users

    def create_cuisines_and_categories(self):
        """Create cuisines and food categories"""
        print("Creating cuisines and categories...")
        
        cuisines_data = [
            {'name': 'Italian', 'description': 'Traditional Italian cuisine', 'is_active': True, 'sort_order': 1},
            {'name': 'Chinese', 'description': 'Authentic Chinese dishes', 'is_active': True, 'sort_order': 2},
            {'name': 'Mexican', 'description': 'Spicy Mexican flavors', 'is_active': True, 'sort_order': 3},
            {'name': 'Indian', 'description': 'Rich Indian spices', 'is_active': True, 'sort_order': 4},
            {'name': 'Japanese', 'description': 'Fresh Japanese cuisine', 'is_active': True, 'sort_order': 5},
            {'name': 'Thai', 'description': 'Sweet and spicy Thai food', 'is_active': True, 'sort_order': 6},
            {'name': 'French', 'description': 'Classic French cooking', 'is_active': True, 'sort_order': 7},
            {'name': 'Korean', 'description': 'Traditional Korean dishes', 'is_active': True, 'sort_order': 8},
            {'name': 'Greek', 'description': 'Mediterranean Greek food', 'is_active': True, 'sort_order': 9},
            {'name': 'American', 'description': 'Classic American dishes', 'is_active': True, 'sort_order': 10},
            {'name': 'Mediterranean', 'description': 'Healthy Mediterranean diet', 'is_active': True, 'sort_order': 11},
            {'name': 'Vietnamese', 'description': 'Fresh Vietnamese cuisine', 'is_active': True, 'sort_order': 12},
            {'name': 'Lebanese', 'description': 'Middle Eastern flavors', 'is_active': True, 'sort_order': 13},
            {'name': 'Brazilian', 'description': 'South American cuisine', 'is_active': True, 'sort_order': 14},
            {'name': 'Ethiopian', 'description': 'East African cuisine', 'is_active': True, 'sort_order': 15}
        ]
        
        categories_data = [
            {'name': 'Appetizers', 'description': 'Start your meal right'},
            {'name': 'Main Courses', 'description': 'Hearty main dishes'},
            {'name': 'Desserts', 'description': 'Sweet endings'},
            {'name': 'Beverages', 'description': 'Refreshing drinks'},
            {'name': 'Salads', 'description': 'Fresh and healthy'},
            {'name': 'Soups', 'description': 'Warm and comforting'},
            {'name': 'Seafood', 'description': 'Fresh from the sea'},
            {'name': 'Vegetarian', 'description': 'Plant-based options'},
            {'name': 'Vegan', 'description': 'Completely plant-based'},
            {'name': 'Gluten-Free', 'description': 'Safe for gluten sensitivities'},
            {'name': 'Keto', 'description': 'Low-carb options'},
            {'name': 'Breakfast', 'description': 'Morning meals'},
            {'name': 'Lunch', 'description': 'Midday meals'},
            {'name': 'Dinner', 'description': 'Evening meals'},
            {'name': 'Snacks', 'description': 'Quick bites'}
        ]
        
        cuisines = []
        for cuisine_data in cuisines_data:
            cuisine, created = Cuisine.objects.get_or_create(
                name=cuisine_data['name'],
                defaults=cuisine_data
            )
            cuisines.append(cuisine)
        
        categories = []
        for cuisine in cuisines:
            for category_data in categories_data:
                category, created = FoodCategory.objects.get_or_create(
                    name=category_data['name'],
                    cuisine=cuisine,
                    defaults={
                        'description': category_data['description'],
                        'is_active': True,
                        'sort_order': len(categories) + 1
                    }
                )
                categories.append(category)
        
        return cuisines, categories

    def create_foods(self, cuisines, categories, users, count=300):
        """Create diverse food items"""
        print(f"Creating {count} food items...")
        
        food_names = [
            # Italian
            'Margherita Pizza', 'Spaghetti Carbonara', 'Lasagna', 'Risotto', 'Tiramisu',
            'Fettuccine Alfredo', 'Chicken Parmesan', 'Bruschetta', 'Gnocchi', 'Cannoli',
            # Chinese
            'Kung Pao Chicken', 'Sweet and Sour Pork', 'Beef Lo Mein', 'Fried Rice',
            'General Tso Chicken', 'Orange Chicken', 'Chow Mein', 'Wonton Soup',
            'Egg Rolls', 'Fortune Cookies',
            # Mexican
            'Tacos al Pastor', 'Burrito Bowl', 'Quesadilla', 'Enchiladas', 'Churros',
            'Guacamole', 'Nachos', 'Taco Salad', 'Fajitas', 'Churros',
            # Indian
            'Butter Chicken', 'Biryani', 'Tikka Masala', 'Naan Bread', 'Samosas',
            'Dal Curry', 'Tandoori Chicken', 'Palak Paneer', 'Mango Lassi', 'Gulab Jamun',
            # Japanese
            'Sushi Roll', 'Ramen', 'Teriyaki Chicken', 'Tempura', 'Miso Soup',
            'Sashimi', 'Yakitori', 'Onigiri', 'Matcha Ice Cream', 'Takoyaki',
            # Thai
            'Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Mango Sticky Rice', 'Thai Basil',
            'Massaman Curry', 'Papaya Salad', 'Thai Iced Tea', 'Coconut Soup', 'Spring Rolls',
            # American
            'Cheeseburger', 'BBQ Ribs', 'Mac and Cheese', 'Buffalo Wings', 'Apple Pie',
            'Fried Chicken', 'Hot Dog', 'Caesar Salad', 'Club Sandwich', 'Chocolate Cake',
            # French
            'Coq au Vin', 'Ratatouille', 'Croissant', 'Crème Brûlée', 'Bouillabaisse',
            'Quiche Lorraine', 'French Onion Soup', 'Escargot', 'Profiteroles', 'Tarte Tatin',
            # Korean
            'Bulgogi', 'Kimchi', 'Bibimbap', 'Korean BBQ', 'Japchae',
            'Tteokbokki', 'Korean Fried Chicken', 'Galbi', 'Hotteok', 'Bingsu',
            # Greek
            'Gyro', 'Greek Salad', 'Moussaka', 'Souvlaki', 'Baklava',
            'Spanakopita', 'Dolmades', 'Tzatziki', 'Greek Yogurt', 'Loukoumades',
            # Mediterranean
            'Hummus', 'Falafel', 'Shawarma', 'Tabouleh', 'Baba Ganoush',
            'Couscous', 'Lamb Kebab', 'Pita Bread', 'Olive Tapenade', 'Fattoush',
            # Vietnamese
            'Pho', 'Banh Mi', 'Spring Rolls', 'Bun Cha', 'Vietnamese Coffee',
            'Cao Lau', 'Banh Xeo', 'Goi Cuon', 'Che', 'Bun Bo Hue',
            # Lebanese
            'Kibbeh', 'Fattoush', 'Manakish', 'Knafeh', 'Mujaddara',
            'Shawarma', 'Falafel', 'Hummus', 'Baklava', 'Tabbouleh',
            # Brazilian
            'Feijoada', 'Pão de Açúcar', 'Açaí Bowl', 'Brigadeiro', 'Coxinha',
            'Moqueca', 'Picanha', 'Caipirinha', 'Pudim', 'Quindim',
            # Ethiopian
            'Injera', 'Doro Wat', 'Kitfo', 'Shiro', 'Tibs',
            'Gomen', 'Misir Wot', 'Ayib', 'Baklava', 'Tej'
        ]
        
        foods = []
        for i in range(count):
            name = random.choice(food_names)
            cuisine = random.choice(cuisines)
            category = random.choice(categories)
            cook = random.choice([u for u in users if u.role == 'cook' and u.status == 'active'])
            
            food = Food.objects.create(
                name=f"{name} #{i+1}",
                description=f"Delicious {name.lower()} prepared by {cook.name}",
                category=category.name,
                chef=cook,
                food_category=category,
                preparation_time=random.randint(15, 120),
                is_available=random.choice([True, True, True, False]),  # 75% available
                is_featured=random.choice([True, False, False, False]),  # 25% featured
                allergens=random.choice([
                    ['nuts'], ['dairy'], ['gluten'], ['soy'],
                    ['eggs'], [], ['shellfish'], ['peanuts']
                ]),
                calories_per_serving=random.randint(200, 800),
                ingredients=random.choice([
                    ['Tomato', 'Basil', 'Mozzarella'], ['Chicken', 'Rice', 'Vegetables'],
                    ['Beef', 'Onions', 'Spices'], ['Fish', 'Lemon', 'Herbs']
                ]),
                is_vegetarian=random.choice([True, False]),
                is_vegan=random.choice([True, False]),
                status=random.choice(['Approved', 'Approved', 'Pending']),  # 67% approved
                admin=random.choice([u for u in users if u.role == 'admin'])
            )
            
            # Create food price
            base_price = Decimal(random.uniform(8.99, 49.99)).quantize(Decimal('0.01'))
            FoodPrice.objects.create(
                food=food,
                size='Medium',
                price=base_price,
                preparation_time=random.randint(15, 60),
                cook=cook
            )
            
            # Create additional sizes
            if random.choice([True, False]):
                FoodPrice.objects.create(
                    food=food,
                    size='Large',
                    price=base_price * Decimal('1.5'),
                    preparation_time=random.randint(20, 90),
                    cook=cook
                )
            
            foods.append(food)
        
        return foods

    def create_orders(self, users, foods, count=500):
        """Create diverse orders with realistic patterns"""
        print(f"Creating {count} orders...")
        
        customers = [u for u in users if u.role == 'customer']
        cooks = [u for u in users if u.role == 'cook' and u.status == 'active']
        delivery_agents = [u for u in users if u.role == 'DeliveryAgent' and u.status == 'active']
        
        orders = []
        for i in range(count):
            customer = random.choice(customers)
            chef = random.choice(cooks)
            
            # Create order
            order = Order.objects.create(
                order_number=f'ORD-{i+1:06d}',
                customer=customer,
                chef=chef,
                status=random.choice(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
                total_amount=Decimal('0.00'),
                delivery_address=customer.address,
                created_at=self.get_random_date()
            )
            
            # Create order items
            num_items = random.randint(1, 5)
            total_amount = Decimal('0.00')
            used_foods = set()
            
            for _ in range(num_items):
                # Ensure we don't add the same food twice
                available_foods = [f for f in foods if f not in used_foods]
                if not available_foods:
                    break
                    
                food = random.choice(available_foods)
                used_foods.add(food)
                quantity = random.randint(1, 3)
                price = food.prices.first()
                if price:
                    item_total = price.price * quantity
                    total_amount += item_total
                    
                    OrderItem.objects.create(
                        order=order,
                        price=price,
                        quantity=quantity,
                        unit_price=price.price,
                        total_price=item_total,
                        special_instructions=random.choice([
                            'Please ring doorbell', 'Leave at door', 'Call when arrived',
                            'No onions please', 'Extra spicy', 'Mild spice only',
                            'Contactless delivery', 'Meet at lobby', ''
                        ]),
                        food_name=food.name,
                        food_description=food.description
                    )
            
            order.total_amount = total_amount
            order.save()
            
            # Create order status history
            OrderStatusHistory.objects.create(
                order=order,
                status=order.status,
                changed_by=chef,
                notes=f'Order {order.status}'
            )
            
            # Create delivery if order is delivered
            if order.status == 'delivered' and delivery_agents:
                delivery_agent = random.choice(delivery_agents)
                delivery = Delivery.objects.create(
                    order=order,
                    agent=delivery_agent,
                    status='Delivered',
                    address=order.delivery_address,
                    delivery_time=order.created_at + timedelta(minutes=random.randint(30, 90))
                )
                
                # Create delivery review
                if random.choice([True, False]):
                    DeliveryReview.objects.create(
                        delivery=delivery,
                        customer=order.customer,
                        rating=random.randint(3, 5),
                        comment=random.choice([
                            'Great delivery!', 'Fast and friendly', 'Perfect timing',
                            'Excellent service', 'Very professional', 'On time delivery'
                        ])
                    )
            
            orders.append(order)
        
        return orders

    def create_payments(self, orders, count=400):
        """Create payment records"""
        print(f"Creating {count} payments...")
        
        payment_methods = ['Credit Card', 'Debit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Cash']
        payment_statuses = ['pending', 'completed', 'failed', 'refunded']
        
        payments = []
        for i in range(count):
            order = random.choice(orders)
            
            payment = Payment.objects.create(
                order=order,
                amount=order.total_amount,
                payment_method=random.choice(payment_methods),
                payment_provider=random.choice(['stripe', 'paypal', 'cash', 'manual']),
                status=random.choice(payment_statuses),
                provider_transaction_id=f'TXN-{i+1:08d}',
                description=f'Payment for order {order.order_number}',
                created_at=self.get_random_date()
            )
            
            # Create transaction
            Transaction.objects.create(
                payment=payment,
                transaction_id=payment.provider_transaction_id,
                amount=payment.amount,
                status=payment.status,
                created_at=payment.created_at
            )
            
            # Create refund if payment failed
            if payment.status == 'refunded':
                Refund.objects.create(
                    payment=payment,
                    refund_id=f'REF-{i+1:06d}',
                    amount=payment.amount,
                    reason=random.choice([
                        'Customer request', 'Order cancelled', 'Quality issue',
                        'Delivery problem', 'Payment error'
                    ]),
                    status='completed',
                    created_at=payment.created_at + timedelta(hours=random.randint(1, 24))
                )
            
            payments.append(payment)
        
        return payments

    def create_communications(self, users, count=200):
        """Create communication records"""
        print(f"Creating {count} communications...")
        
        communication_types = ['support', 'complaint', 'feedback', 'inquiry', 'suggestion']
        priorities = ['low', 'medium', 'high', 'urgent']
        statuses = ['open', 'in_progress', 'resolved', 'closed']
        
        # Create categories
        categories = [
            'Order Issues', 'Payment Problems', 'Delivery Concerns', 'Food Quality',
            'Account Issues', 'Technical Support', 'General Inquiry', 'Complaint',
            'Feedback', 'Suggestion', 'Refund Request', 'Cancellation'
        ]
        
        comm_categories = []
        for cat_name in categories:
            cat, created = CommunicationCategory.objects.get_or_create(name=cat_name)
            comm_categories.append(cat)
        
        communications = []
        for i in range(count):
            user = random.choice(users)
            category = random.choice(comm_categories)
            
            communication = Communication.objects.create(
                user=user,
                communication_type=random.choice(communication_types),
                subject=f"Communication #{i+1} - {random.choice(['Order', 'Payment', 'Delivery', 'Account'])} Issue",
                message=f"This is a {random.choice(communication_types)} message from {user.name} regarding their experience with ChefSync.",
                priority=random.choice(priorities),
                status=random.choice(statuses),
                reference_number=f'COM-{i+1:06d}',
                created_at=self.get_random_date()
            )
            
            # Add category using the through model
            from apps.communications.models import CommunicationCategoryRelation
            CommunicationCategoryRelation.objects.create(
                communication=communication,
                category=category,
                added_by=user
            )
            
            # Create response if resolved
            if communication.status in ['resolved', 'closed']:
                CommunicationResponse.objects.create(
                    communication=communication,
                    responder=random.choice([u for u in users if u.role == 'admin']),
                    message=f"Thank you for contacting us. We have resolved your {communication.communication_type}.",
                    created_at=communication.created_at + timedelta(hours=random.randint(1, 48))
                )
            
            communications.append(communication)
        
        return communications

    def create_admin_data(self, admin_user, users):
        """Create admin management data"""
        print("Creating admin management data...")
        
        # Create admin notifications
        notification_types = ['system', 'user', 'order', 'payment', 'delivery', 'food', 'communication']
        priorities = ['low', 'medium', 'high', 'urgent']
        
        for i in range(100):
            AdminNotification.objects.create(
                title=f"Notification #{i+1}",
                message=f"This is a {random.choice(notification_types)} notification for admin review.",
                notification_type=random.choice(notification_types),
                priority=random.choice(priorities),
                is_read=random.choice([True, False]),
                is_active=True,
                created_at=self.get_random_date()
            )
        
        # Create admin activity logs
        actions = ['created', 'updated', 'deleted', 'approved', 'rejected', 'activated', 'deactivated']
        resource_types = ['user', 'order', 'food', 'payment', 'delivery', 'communication']
        
        for i in range(200):
            AdminActivityLog.objects.create(
                admin=admin_user,
                action=random.choice(actions),
                resource_type=random.choice(resource_types),
                resource_id=random.randint(1, 1000),
                description=f"Admin {random.choice(actions)} {random.choice(resource_types)} #{random.randint(1, 1000)}",
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                timestamp=self.get_random_date()
            )
        
        # Create system health metrics
        for i in range(365):  # Daily metrics for a year
            SystemHealthMetric.objects.create(
                metric_type=random.choice(['cpu_usage', 'memory_usage', 'disk_usage', 'response_time']),
                value=random.uniform(20.0, 95.0),
                unit='%',
                timestamp=self.start_date + timedelta(days=i),
                metadata={'server': 'web-01', 'region': 'us-east-1'}
            )
        
        # Create admin system settings
        settings_data = [
            {'key': 'site_name', 'value': 'ChefSync Kitchen', 'category': 'general'},
            {'key': 'max_orders_per_hour', 'value': '100', 'category': 'orders'},
            {'key': 'delivery_fee', 'value': '4.99', 'category': 'delivery'},
            {'key': 'min_order_amount', 'value': '15.00', 'category': 'orders'},
            {'key': 'notification_email', 'value': 'admin@chefsync.com', 'category': 'notifications'},
            {'key': 'maintenance_mode', 'value': 'false', 'category': 'system'},
            {'key': 'auto_approve_chefs', 'value': 'false', 'category': 'users'},
            {'key': 'require_phone_verification', 'value': 'true', 'category': 'users'}
        ]
        
        for setting_data in settings_data:
            AdminSystemSettings.objects.create(
                key=setting_data['key'],
                value=setting_data['value'],
                category=setting_data['category'],
                description=f"Setting for {setting_data['category']}",
                is_public=random.choice([True, False]),
                updated_by=admin_user
            )

    def create_food_reviews(self, foods, users, count=1000):
        """Create food reviews"""
        print(f"Creating {count} food reviews...")
        
        customers = [u for u in users if u.role == 'customer']
        
        for i in range(count):
            food = random.choice(foods)
            customer = random.choice(customers)
            price = food.prices.first()
            
            if price:
                FoodReview.objects.create(
                    price=price,
                    customer=customer,
                    rating=random.randint(1, 5),
                    comment=random.choice([
                        'Excellent food!', 'Very tasty', 'Great quality', 'Amazing flavor',
                        'Good but could be better', 'Not bad', 'Average', 'Disappointing',
                        'Perfect!', 'Highly recommended', 'Will order again', 'Great value'
                    ])
                )

    def get_random_date(self):
        """Get a random date between start_date and end_date"""
        time_between = self.end_date - self.start_date
        days_between = time_between.days
        random_days = random.randint(0, days_between)
        return self.start_date + timedelta(days=random_days)

    def run(self):
        """Main execution method"""
        print("🚀 Starting comprehensive admin dataset creation...")
        
        with transaction.atomic():
            # Create admin user
            admin_user = self.create_admin_user()
            
            # Create users
            users = self.create_users(200)
            
            # Create cuisines and categories
            cuisines, categories = self.create_cuisines_and_categories()
            
            # Create foods
            foods = self.create_foods(cuisines, categories, users, 300)
            
            # Create orders
            orders = self.create_orders(users, foods, 500)
            
            # Create payments
            payments = self.create_payments(orders, 400)
            
            # Create communications
            communications = self.create_communications(users, 200)
            
            # Create admin data
            self.create_admin_data(admin_user, users)
            
            # Create food reviews
            self.create_food_reviews(foods, users, 1000)
        
        print("✅ Comprehensive admin dataset creation completed!")
        print(f"📊 Created:")
        print(f"   - {User.objects.count()} users")
        print(f"   - {Food.objects.count()} food items")
        print(f"   - {Order.objects.count()} orders")
        print(f"   - {Payment.objects.count()} payments")
        print(f"   - {Communication.objects.count()} communications")
        print(f"   - {AdminNotification.objects.count()} admin notifications")
        print(f"   - {AdminActivityLog.objects.count()} admin activity logs")
        print(f"   - {FoodReview.objects.count()} food reviews")
        print(f"\n🔑 Admin Login:")
        print(f"   Email: admin@chefsync.com")
        print(f"   Password: admin123")

if __name__ == '__main__':
    creator = ComprehensiveAdminDatasetCreator()
    creator.run()
