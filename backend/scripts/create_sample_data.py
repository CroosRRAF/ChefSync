#!/usr/bin/env python3
"""
Comprehensive sample data creation script for ChefSync
This script creates 10 sample records for each model with realistic data and images
"""
import os
import sys
import django
from pathlib import Path
import random
import json
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.base import ContentFile
import requests
from PIL import Image
import io
import base64

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now import all models
from apps.authentication.models import (
    User, Admin, Customer, Cook, DeliveryAgent, 
    DocumentType, UserDocument, EmailOTP, JWTToken
)
from apps.users.models import UserProfile, ChefProfile, DeliveryProfile
from apps.food.models import (
    Cuisine, FoodCategory, Food, FoodImage, 
    FoodPrice, Offer, FoodReview
)
from apps.orders.models import (
    Order, OrderItem, OrderStatusHistory, 
    CartItem, Delivery, DeliveryReview
)
from apps.payments.models import Payment, Refund, PaymentMethod, Transaction
from apps.communications.models import (
    Contact, Notification, Communication, 
    CommunicationResponse, CommunicationTemplate,
    CommunicationCategory, CommunicationTag
)
from apps.admin_management.models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings, AdminBackupLog
)

class SampleDataCreator:
    def __init__(self):
        self.created_objects = {
            'users': [],
            'admins': [],
            'customers': [],
            'cooks': [],
            'delivery_agents': [],
            'cuisines': [],
            'food_categories': [],
            'foods': [],
            'food_prices': [],
            'orders': [],
        }
        
    def create_placeholder_image(self, text="Sample", size=(300, 300), color=(70, 130, 180)):
        """Create a simple placeholder image"""
        img = Image.new('RGB', size, color=color)
        # For now, just return a simple colored image
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG', quality=85)
        img_io.seek(0)
        return img_io.getvalue()

    def create_users(self):
        """Create 10 sample users for each role"""
        print("Creating users...")
        
        # Sample user data
        user_data = [
            {'name': 'John Smith', 'email': 'john.admin@chefsync.com', 'role': 'Admin'},
            {'name': 'Sarah Johnson', 'email': 'sarah.admin@chefsync.com', 'role': 'Admin'},
            {'name': 'Mike Wilson', 'email': 'mike.customer@gmail.com', 'role': 'Customer'},
            {'name': 'Emily Davis', 'email': 'emily.customer@gmail.com', 'role': 'Customer'},
            {'name': 'David Brown', 'email': 'david.customer@gmail.com', 'role': 'Customer'},
            {'name': 'Lisa Garcia', 'email': 'lisa.cook@chefsync.com', 'role': 'Cook'},
            {'name': 'Chef Marco', 'email': 'marco.cook@chefsync.com', 'role': 'Cook'},
            {'name': 'Anna Rodriguez', 'email': 'anna.cook@chefsync.com', 'role': 'Cook'},
            {'name': 'Tom Anderson', 'email': 'tom.delivery@chefsync.com', 'role': 'DeliveryAgent'},
            {'name': 'James Taylor', 'email': 'james.delivery@chefsync.com', 'role': 'DeliveryAgent'},
        ]
        
        for data in user_data:
            if not User.objects.filter(email=data['email']).exists():
                user = User.objects.create_user(
                    email=data['email'],
                    name=data['name'],
                    phone_no=f"+1{random.randint(1000000000, 9999999999)}",
                    gender=random.choice(['Male', 'Female', 'Other']),
                    address=f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Park Blvd', 'First St'])}",
                    password='password123',
                    role=data['role'],
                    email_verified=True,
                    approval_status='approved' if data['role'] != 'Customer' else 'approved'
                )
                self.created_objects['users'].append(user)
                print(f"Created user: {user.name} ({user.role})")

    def create_role_profiles(self):
        """Create role-specific profiles"""
        print("Creating role profiles...")
        
        # Create Admin profiles
        admin_users = [u for u in self.created_objects['users'] if u.role == 'Admin']
        for user in admin_users:
            if not hasattr(user, 'admin_profile'):
                admin = Admin.objects.create(user=user)
                self.created_objects['admins'].append(admin)
                print(f"Created admin profile for {user.name}")

        # Create Customer profiles
        customer_users = [u for u in self.created_objects['users'] if u.role == 'Customer']
        for user in customer_users:
            if not hasattr(user, 'customer'):
                customer = Customer.objects.create(user=user)
                self.created_objects['customers'].append(customer)
                print(f"Created customer profile for {user.name}")

        # Create Cook profiles
        cook_users = [u for u in self.created_objects['users'] if u.role == 'Cook']
        for user in cook_users:
            if not hasattr(user, 'cook'):
                cook = Cook.objects.create(
                    user=user,
                    specialty=random.choice(['Italian', 'Chinese', 'Mexican', 'Indian', 'American']),
                    kitchen_location=f"{random.randint(100, 999)} Kitchen St",
                    experience_years=random.randint(2, 15),
                    rating_avg=round(random.uniform(4.0, 5.0), 2),
                    availability_hours="9:00 AM - 10:00 PM"
                )
                self.created_objects['cooks'].append(cook)
                print(f"Created cook profile for {user.name}")

        # Create DeliveryAgent profiles
        delivery_users = [u for u in self.created_objects['users'] if u.role == 'DeliveryAgent']
        for user in delivery_users:
            if not hasattr(user, 'deliveryagent'):
                agent = DeliveryAgent.objects.create(
                    user=user,
                    vehicle_type=random.choice(['bike', 'car', 'scooter']),
                    license_no=f"DL{random.randint(100000, 999999)}",
                    vehicle_number=f"{random.choice(['CAR', 'BIK'])}-{random.randint(1000, 9999)}",
                    current_location=f"{random.randint(100, 999)} Delivery Ave",
                    is_available=True
                )
                self.created_objects['delivery_agents'].append(agent)
                print(f"Created delivery agent profile for {user.name}")

    def create_user_profiles(self):
        """Create UserProfile objects"""
        print("Creating user profiles...")
        
        for user in self.created_objects['users']:
            if not hasattr(user, 'profile'):
                profile_image = self.create_placeholder_image(f"{user.name[:2]}", color=(random.randint(50, 200), random.randint(50, 200), random.randint(50, 200)))
                
                profile = UserProfile.objects.create(
                    user=user,
                    address=user.address or f"{random.randint(100, 999)} Sample St",
                    date_of_birth=timezone.now().date() - timedelta(days=random.randint(6570, 18250)),  # 18-50 years old
                    gender=user.gender or random.choice(['male', 'female', 'other']),
                    bio=f"Hello, I'm {user.name}. Nice to meet you!",
                    preferences={'favorite_cuisine': random.choice(['italian', 'chinese', 'mexican', 'indian'])}
                )
                print(f"Created user profile for {user.name}")

    def create_cuisines(self):
        """Create cuisine categories"""
        print("Creating cuisines...")
        
        cuisines_data = [
            {'name': 'Italian', 'description': 'Authentic Italian cuisine with pasta, pizza, and more'},
            {'name': 'Chinese', 'description': 'Traditional Chinese dishes with bold flavors'},
            {'name': 'Mexican', 'description': 'Spicy and flavorful Mexican food'},
            {'name': 'Indian', 'description': 'Rich and aromatic Indian cuisine'},
            {'name': 'American', 'description': 'Classic American comfort food'},
            {'name': 'Japanese', 'description': 'Fresh and delicate Japanese cuisine'},
            {'name': 'Thai', 'description': 'Sweet, sour, and spicy Thai dishes'},
            {'name': 'French', 'description': 'Elegant French cuisine'},
            {'name': 'Mediterranean', 'description': 'Healthy Mediterranean dishes'},
            {'name': 'Korean', 'description': 'Fermented and grilled Korean specialties'},
        ]
        
        for data in cuisines_data:
            if not Cuisine.objects.filter(name=data['name']).exists():
                cuisine_image = self.create_placeholder_image(data['name'][:3])
                
                cuisine = Cuisine.objects.create(
                    name=data['name'],
                    description=data['description'],
                    is_active=True,
                    sort_order=len(self.created_objects['cuisines']) + 1
                )
                self.created_objects['cuisines'].append(cuisine)
                print(f"Created cuisine: {cuisine.name}")

    def create_food_categories(self):
        """Create food categories for each cuisine"""
        print("Creating food categories...")
        
        categories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads']
        
        for cuisine in self.created_objects['cuisines']:
            for category_name in categories:
                if not FoodCategory.objects.filter(name=category_name, cuisine=cuisine).exists():
                    category_image = self.create_placeholder_image(category_name[:3])
                    
                    category = FoodCategory.objects.create(
                        name=category_name,
                        cuisine=cuisine,
                        description=f"{category_name} from {cuisine.name} cuisine",
                        is_active=True,
                        sort_order=categories.index(category_name) + 1
                    )
                    self.created_objects['food_categories'].append(category)
                    print(f"Created category: {category.name} for {cuisine.name}")

    def create_foods(self):
        """Create food items"""
        print("Creating foods...")
        
        # Sample food data for different cuisines
        food_samples = {
            'Italian': [
                {'name': 'Margherita Pizza', 'price': 16.99, 'prep_time': 15},
                {'name': 'Spaghetti Carbonara', 'price': 14.99, 'prep_time': 20},
                {'name': 'Lasagna', 'price': 18.99, 'prep_time': 45},
                {'name': 'Chicken Parmigiana', 'price': 22.99, 'prep_time': 30},
                {'name': 'Tiramisu', 'price': 8.99, 'prep_time': 10},
            ],
            'Chinese': [
                {'name': 'Sweet and Sour Pork', 'price': 15.99, 'prep_time': 25},
                {'name': 'Kung Pao Chicken', 'price': 14.99, 'prep_time': 20},
                {'name': 'Beef with Broccoli', 'price': 16.99, 'prep_time': 18},
                {'name': 'Fried Rice', 'price': 12.99, 'prep_time': 15},
                {'name': 'Spring Rolls', 'price': 6.99, 'prep_time': 10},
            ],
            'Mexican': [
                {'name': 'Chicken Tacos', 'price': 11.99, 'prep_time': 15},
                {'name': 'Beef Burrito', 'price': 13.99, 'prep_time': 12},
                {'name': 'Quesadilla', 'price': 9.99, 'prep_time': 10},
                {'name': 'Nachos Supreme', 'price': 12.99, 'prep_time': 8},
                {'name': 'Guacamole', 'price': 7.99, 'prep_time': 5},
            ],
            'Indian': [
                {'name': 'Chicken Tikka Masala', 'price': 17.99, 'prep_time': 30},
                {'name': 'Biryani', 'price': 16.99, 'prep_time': 40},
                {'name': 'Naan Bread', 'price': 4.99, 'prep_time': 8},
                {'name': 'Samosas', 'price': 6.99, 'prep_time': 12},
                {'name': 'Mango Lassi', 'price': 5.99, 'prep_time': 3},
            ],
        }
        
        admin_users = [u for u in self.created_objects['users'] if u.role == 'Admin']
        cook_users = [u for u in self.created_objects['users'] if u.role == 'Cook']
        
        if not admin_users:
            print("Warning: No admin users found. Foods will be created without admin approval.")
        
        for cuisine in self.created_objects['cuisines'][:4]:  # First 4 cuisines
            if cuisine.name in food_samples:
                main_course_category = next((cat for cat in self.created_objects['food_categories'] 
                                           if cat.cuisine == cuisine and cat.name == 'Main Course'), None)
                
                if main_course_category and cook_users:
                    for food_data in food_samples[cuisine.name]:
                        chef = random.choice(cook_users)
                        admin = random.choice(admin_users) if admin_users else None
                        
                        food = Food.objects.create(
                            name=food_data['name'],
                            category=random.choice(['Main Course', 'Appetizer', 'Dessert']),
                            description=f"Delicious {food_data['name']} prepared with fresh ingredients",
                            status='Approved',
                            admin=admin,
                            chef=chef,
                            food_category=main_course_category,
                            is_available=True,
                            is_featured=random.choice([True, False]),
                            preparation_time=food_data['prep_time'],
                            calories_per_serving=random.randint(300, 800),
                            ingredients=['fresh ingredients', 'spices', 'herbs'],
                            allergens=random.choice([[], ['nuts'], ['dairy'], ['gluten']]),
                            nutritional_info={'protein': random.randint(10, 30), 'carbs': random.randint(20, 60)},
                            is_vegetarian=random.choice([True, False]),
                            is_vegan=random.choice([True, False]),
                            is_gluten_free=random.choice([True, False]),
                            spice_level=random.choice(['mild', 'medium', 'hot']),
                            rating_average=round(random.uniform(4.0, 5.0), 1),
                            total_reviews=random.randint(10, 100),
                            total_orders=random.randint(50, 500)
                        )
                        self.created_objects['foods'].append(food)
                        print(f"Created food: {food.name}")

    def create_food_prices(self):
        """Create food prices for different sizes"""
        print("Creating food prices...")
        
        for food in self.created_objects['foods']:
            cook = food.chef
            if cook:
                base_price = Decimal('15.99')
                
                for size in ['Small', 'Medium', 'Large']:
                    if size == 'Small':
                        price = base_price * Decimal('0.8')
                    elif size == 'Medium':
                        price = base_price
                    else:
                        price = base_price * Decimal('1.3')
                    
                    food_price = FoodPrice.objects.create(
                        food=food,
                        size=size,
                        price=price,
                        cook=cook,
                        image_url=f'https://example.com/food_{food.food_id}_{size.lower()}.jpg'
                    )
                    self.created_objects['food_prices'].append(food_price)
                    print(f"Created price for {food.name} - {size}: ${price}")

    def create_food_images(self):
        """Create food images"""
        print("Creating food images...")
        
        for food in self.created_objects['foods'][:5]:  # First 5 foods
            for i in range(2):  # 2 images per food
                food_image = self.create_placeholder_image(food.name[:3])
                
                food_img = FoodImage.objects.create(
                    food=food,
                    caption=f"{food.name} - Image {i+1}",
                    is_primary=i == 0,
                    sort_order=i + 1
                )
                print(f"Created image for {food.name}")

    def create_offers(self):
        """Create offers for food prices"""
        print("Creating offers...")
        
        for food_price in self.created_objects['food_prices'][:10]:  # First 10 prices
            if random.choice([True, False]):  # 50% chance of having an offer
                offer = Offer.objects.create(
                    description=f"Special {random.randint(10, 30)}% off on {food_price.food.name}",
                    discount=Decimal(str(random.randint(10, 30))),
                    valid_until=timezone.now().date() + timedelta(days=random.randint(7, 30)),
                    price=food_price
                )
                print(f"Created offer for {food_price.food.name}")

    def create_orders(self):
        """Create sample orders"""
        print("Creating orders...")
        
        customer_users = [u for u in self.created_objects['users'] if u.role == 'Customer']
        cook_users = [u for u in self.created_objects['users'] if u.role == 'Cook']
        
        if customer_users and cook_users and self.created_objects['food_prices']:
            for i in range(10):
                customer = random.choice(customer_users)
                chef = random.choice(cook_users)
                
                order = Order.objects.create(
                    customer=customer,
                    chef=chef,
                    status=random.choice(['pending', 'confirmed', 'delivered']),
                    payment_status='paid',
                    payment_method='card',
                    delivery_address=f"{random.randint(100, 999)} Delivery St, City",
                    delivery_instructions="Please ring doorbell",
                    subtotal=Decimal('0.00'),
                    tax_amount=Decimal('2.50'),
                    delivery_fee=Decimal('3.99'),
                    total_amount=Decimal('0.00'),
                    customer_notes="Thank you!"
                )
                self.created_objects['orders'].append(order)
                
                # Add order items
                subtotal = Decimal('0.00')
                for _ in range(random.randint(1, 3)):
                    food_price = random.choice(self.created_objects['food_prices'])
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
                        food_description=food_price.food.description
                    )
                
                order.subtotal = subtotal
                order.total_amount = subtotal + order.tax_amount + order.delivery_fee
                order.save()
                
                print(f"Created order: {order.order_number}")

    def create_reviews(self):
        """Create food reviews"""
        print("Creating reviews...")
        
        customer_users = [u for u in self.created_objects['users'] if u.role == 'Customer']
        
        if customer_users and self.created_objects['food_prices']:
            for i in range(20):  # Create 20 reviews
                customer = random.choice(customer_users)
                food_price = random.choice(self.created_objects['food_prices'])
                
                # Check if review already exists
                if not FoodReview.objects.filter(customer=customer, price=food_price).exists():
                    review = FoodReview.objects.create(
                        price=food_price,
                        customer=customer,
                        rating=random.randint(4, 5),
                        comment=f"Great food! I really enjoyed the {food_price.food.name}.",
                        taste_rating=random.randint(4, 5),
                        presentation_rating=random.randint(4, 5),
                        value_rating=random.randint(3, 5)
                    )
                    print(f"Created review for {food_price.food.name} by {customer.name}")

    def create_communications(self):
        """Create communication records"""
        print("Creating communications...")
        
        # Create communication categories
        categories = ['General Inquiry', 'Order Issue', 'Payment Problem', 'Technical Support']
        for cat_name in categories:
            if not CommunicationCategory.objects.filter(name=cat_name).exists():
                CommunicationCategory.objects.create(
                    name=cat_name,
                    description=f"Category for {cat_name.lower()} related communications"
                )

        # Create communication tags
        tags = ['urgent', 'resolved', 'pending', 'escalated']
        for tag_name in tags:
            if not CommunicationTag.objects.filter(name=tag_name).exists():
                CommunicationTag.objects.create(
                    name=tag_name,
                    color=f"#{random.randint(100000, 999999):06x}"
                )

        # Create contacts
        for i in range(5):
            user = random.choice(self.created_objects['users'])
            Contact.objects.create(
                name=user.name,
                email=user.email,
                message=f"Hello, I have a question about your service. This is inquiry #{i+1}.",
                user=user
            )
            print(f"Created contact from {user.name}")

    def create_notifications(self):
        """Create notifications"""
        print("Creating notifications...")
        
        for user in self.created_objects['users']:
            for i in range(2):  # 2 notifications per user
                Notification.objects.create(
                    subject=f"Welcome to ChefSync #{i+1}",
                    message=f"Thank you for joining ChefSync, {user.name}! Enjoy our services.",
                    user=user,
                    status=random.choice(['Read', 'Unread'])
                )
                print(f"Created notification for {user.name}")

    def create_payments(self):
        """Create payment records"""
        print("Creating payments...")
        
        for order in self.created_objects['orders']:
            if random.choice([True, False]):  # 50% of orders have payment records
                payment = Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    payment_method='card',
                    status='completed',
                    payment_id=f"PAY_{random.randint(100000, 999999)}",
                    provider_payment_id=f"stripe_{random.randint(100000, 999999)}",
                    provider_response={'status': 'success'},
                    currency='USD'
                )
                print(f"Created payment for order {order.order_number}")

    def create_admin_data(self):
        """Create admin-specific data"""
        print("Creating admin data...")
        
        admin_users = [u for u in self.created_objects['users'] if u.role == 'Admin']
        if not admin_users:
            return
            
        # Create admin notifications
        for i in range(5):
            AdminNotification.objects.create(
                title=f"System Alert #{i+1}",
                message=f"This is a sample admin notification #{i+1}",
                notification_type=random.choice(['system_alert', 'user_activity', 'order_update']),
                priority=random.choice(['low', 'medium', 'high']),
                is_read=random.choice([True, False])
            )

        # Create system settings
        settings_data = [
            ('site_name', 'ChefSync', 'string', 'general'),
            ('max_orders_per_day', '100', 'integer', 'general'),
            ('enable_notifications', 'true', 'boolean', 'notifications'),
            ('delivery_fee', '3.99', 'float', 'general'),
        ]
        
        for key, value, setting_type, category in settings_data:
            if not AdminSystemSettings.objects.filter(key=key).exists():
                AdminSystemSettings.objects.create(
                    key=key,
                    value=value,
                    setting_type=setting_type,
                    category=category,
                    description=f"Setting for {key.replace('_', ' ')}"
                )

    def run(self):
        """Run all data creation methods"""
        print("Starting sample data creation...")
        print("=" * 50)
        
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
            
            print("\n" + "=" * 50)
            print("Sample data creation completed successfully!")
            print("=" * 50)
            
            # Print summary
            print("\nSummary:")
            print(f"Users created: {len(self.created_objects['users'])}")
            print(f"Cuisines created: {len(self.created_objects['cuisines'])}")
            print(f"Food categories created: {len(self.created_objects['food_categories'])}")
            print(f"Foods created: {len(self.created_objects['foods'])}")
            print(f"Food prices created: {len(self.created_objects['food_prices'])}")
            print(f"Orders created: {len(self.created_objects['orders'])}")
            
        except Exception as e:
            print(f"Error creating sample data: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    creator = SampleDataCreator()
    creator.run()