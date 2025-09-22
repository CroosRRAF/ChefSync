from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
import random
from datetime import timedelta

from apps.authentication.models import (
    User, Admin, Customer, Cook, DeliveryAgent, 
    DocumentType, UserDocument, EmailOTP
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


class Command(BaseCommand):
    help = 'Create comprehensive sample data for all models with images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before creating new data',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of records to create for each model (default: 10)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()

        count = options['count']
        self.stdout.write(f'Creating {count} sample records for each model...')
        
        with transaction.atomic():
            self.create_sample_data(count)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created sample data for all models!')
        )

    def clear_data(self):
        """Clear existing sample data"""
        models_to_clear = [
            OrderItem, CartItem, Order, Delivery, DeliveryReview,
            FoodReview, Offer, FoodPrice, FoodImage, Food,
            FoodCategory, Cuisine,
            Payment, Refund, PaymentMethod, Transaction,
            Contact, Notification, Communication, CommunicationResponse,
            AdminActivityLog, AdminNotification, SystemHealthMetric,
            UserDocument, DocumentType,
            DeliveryProfile, ChefProfile, UserProfile,
            DeliveryAgent, Cook, Customer, Admin
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                self.stdout.write(f'Cleared {count} {model.__name__} records')

    def create_sample_data(self, count):
        """Create sample data for all models"""
        
        # Track created objects
        self.created_data = {}
        
        self.stdout.write('Creating users...')
        self.create_users()
        
        self.stdout.write('Creating role profiles...')
        self.create_role_profiles()
        
        self.stdout.write('Creating user profiles...')
        self.create_user_profiles()
        
        self.stdout.write('Creating document types...')
        self.create_document_types()
        
        self.stdout.write('Creating cuisines...')
        self.create_cuisines()
        
        self.stdout.write('Creating food categories...')
        self.create_food_categories()
        
        self.stdout.write('Creating foods...')
        self.create_foods()
        
        self.stdout.write('Creating food prices...')
        self.create_food_prices()
        
        self.stdout.write('Creating food images...')
        self.create_food_images()
        
        self.stdout.write('Creating offers...')
        self.create_offers()
        
        self.stdout.write('Creating orders...')
        self.create_orders()
        
        self.stdout.write('Creating order items...')
        self.create_order_items()
        
        self.stdout.write('Creating deliveries...')
        self.create_deliveries()
        
        self.stdout.write('Creating reviews...')
        self.create_reviews()
        
        self.stdout.write('Creating payments...')
        self.create_payments()
        
        self.stdout.write('Creating communications...')
        self.create_communications()
        
        self.stdout.write('Creating notifications...')
        self.create_notifications()
        
        self.stdout.write('Creating admin data...')
        self.create_admin_data()

    def create_users(self):
        """Create sample users"""
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
        
        users = []
        for data in user_data:
            if not User.objects.filter(email=data['email']).exists():
                user = User.objects.create_user(
                    email=data['email'],
                    name=data['name'],
                    phone_no=f"+1{random.randint(1000000000, 9999999999)}",
                    gender=random.choice(['Male', 'Female', 'Other']),
                    address=f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Park Blvd'])}",
                    password='password123',
                    role=data['role'],
                    email_verified=True,
                    approval_status='approved'
                )
                users.append(user)
                
        self.created_data['users'] = users

    def create_role_profiles(self):
        """Create role-specific profiles"""
        users = self.created_data.get('users', [])
        
        admins = []
        customers = []
        cooks = []
        agents = []
        
        for user in users:
            if user.role == 'Admin':
                admin = Admin.objects.create(user=user)
                admins.append(admin)
            elif user.role == 'Customer':
                customer = Customer.objects.create(user=user)
                customers.append(customer)
            elif user.role == 'Cook':
                cook = Cook.objects.create(
                    user=user,
                    specialty=random.choice(['Italian', 'Chinese', 'Mexican', 'Indian']),
                    experience_years=random.randint(2, 15),
                    rating_avg=round(random.uniform(4.0, 5.0), 2)
                )
                cooks.append(cook)
            elif user.role == 'DeliveryAgent':
                agent = DeliveryAgent.objects.create(
                    user=user,
                    vehicle_type=random.choice(['bike', 'car', 'scooter']),
                    license_no=f"DL{random.randint(100000, 999999)}"
                )
                agents.append(agent)
        
        self.created_data.update({
            'admins': admins,
            'customers': customers,
            'cooks': cooks,
            'delivery_agents': agents
        })

    def create_user_profiles(self):
        """Create UserProfile objects"""
        users = self.created_data.get('users', [])
        profiles = []
        
        for user in users:
            if not hasattr(user, 'profile'):
                profile = UserProfile.objects.create(
                    user=user,
                    address=user.address or f"{random.randint(100, 999)} Sample St",
                    date_of_birth=timezone.now().date() - timedelta(days=random.randint(6570, 18250)),
                    gender=user.gender.lower() if user.gender else 'other',
                    bio=f"Hello, I'm {user.name}!"
                )
                profiles.append(profile)
        
        self.created_data['profiles'] = profiles

    def create_document_types(self):
        """Create document types"""
        doc_types_data = [
            {'name': 'Driving License', 'category': 'delivery_agent', 'required': True},
            {'name': 'Vehicle Registration', 'category': 'delivery_agent', 'required': True},
            {'name': 'Food Safety Certificate', 'category': 'cook', 'required': True},
            {'name': 'Kitchen License', 'category': 'cook', 'required': False},
        ]
        
        doc_types = []
        for data in doc_types_data:
            if not DocumentType.objects.filter(name=data['name'], category=data['category']).exists():
                doc_type = DocumentType.objects.create(
                    name=data['name'],
                    category=data['category'],
                    is_required=data['required'],
                    allowed_file_types=['pdf', 'jpg', 'png'],
                    max_file_size_mb=5
                )
                doc_types.append(doc_type)
        
        self.created_data['document_types'] = doc_types

    def create_cuisines(self):
        """Create cuisines"""
        cuisines_data = [
            'Italian', 'Chinese', 'Mexican', 'Indian', 'American',
            'Japanese', 'Thai', 'French', 'Mediterranean', 'Korean'
        ]
        
        cuisines = []
        for i, name in enumerate(cuisines_data):
            if not Cuisine.objects.filter(name=name).exists():
                cuisine = Cuisine.objects.create(
                    name=name,
                    description=f"Authentic {name} cuisine",
                    is_active=True,
                    sort_order=i + 1
                )
                cuisines.append(cuisine)
        
        self.created_data['cuisines'] = cuisines

    def create_food_categories(self):
        """Create food categories"""
        cuisines = self.created_data.get('cuisines', [])
        categories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages']
        
        food_categories = []
        for cuisine in cuisines:
            for i, category_name in enumerate(categories):
                if not FoodCategory.objects.filter(name=category_name, cuisine=cuisine).exists():
                    category = FoodCategory.objects.create(
                        name=category_name,
                        cuisine=cuisine,
                        description=f"{category_name} from {cuisine.name} cuisine",
                        is_active=True,
                        sort_order=i + 1
                    )
                    food_categories.append(category)
        
        self.created_data['food_categories'] = food_categories

    def create_foods(self):
        """Create food items"""
        cuisines = self.created_data.get('cuisines', [])
        cooks = self.created_data.get('cooks', [])
        admins = self.created_data.get('admins', [])
        
        food_samples = {
            'Italian': ['Margherita Pizza', 'Spaghetti Carbonara', 'Lasagna'],
            'Chinese': ['Sweet and Sour Pork', 'Kung Pao Chicken', 'Fried Rice'],
            'Mexican': ['Chicken Tacos', 'Beef Burrito', 'Quesadilla'],
            'Indian': ['Chicken Tikka Masala', 'Biryani', 'Naan Bread'],
        }
        
        foods = []
        for cuisine in cuisines[:4]:  # First 4 cuisines
            if cuisine.name in food_samples and cooks:
                main_course = next((cat for cat in self.created_data.get('food_categories', [])
                                 if cat.cuisine == cuisine and cat.name == 'Main Course'), None)
                
                if main_course:
                    for food_name in food_samples[cuisine.name]:
                        food = Food.objects.create(
                            name=food_name,
                            category=random.choice(['Main Course', 'Appetizer']),
                            description=f"Delicious {food_name}",
                            status='Approved',
                            admin=random.choice(admins).user if admins else None,
                            chef=random.choice(cooks).user,
                            food_category=main_course,
                            is_available=True,
                            preparation_time=random.randint(15, 45),
                            calories_per_serving=random.randint(300, 800),
                            is_vegetarian=random.choice([True, False]),
                            rating_average=round(random.uniform(4.0, 5.0), 1)
                        )
                        foods.append(food)
        
        self.created_data['foods'] = foods

    def create_food_prices(self):
        """Create food prices"""
        foods = self.created_data.get('foods', [])
        food_prices = []
        
        for food in foods:
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
                    cook=food.chef,
                    image_url=f'https://example.com/food_{food.food_id}_{size.lower()}.jpg'
                )
                food_prices.append(food_price)
        
        self.created_data['food_prices'] = food_prices

    def create_food_images(self):
        """Create food images"""
        foods = self.created_data.get('foods', [])
        
        for food in foods[:5]:  # First 5 foods
            for i in range(2):
                FoodImage.objects.create(
                    food=food,
                    caption=f"{food.name} - Image {i+1}",
                    is_primary=i == 0,
                    sort_order=i + 1
                )

    def create_offers(self):
        """Create offers"""
        food_prices = self.created_data.get('food_prices', [])
        
        for food_price in food_prices[:10]:
            if random.choice([True, False]):
                Offer.objects.create(
                    description=f"Special offer on {food_price.food.name}",
                    discount=Decimal(str(random.randint(10, 30))),
                    valid_until=timezone.now().date() + timedelta(days=30),
                    price=food_price
                )

    def create_orders(self):
        """Create orders"""
        customers = [c.user for c in self.created_data.get('customers', [])]
        cooks = [c.user for c in self.created_data.get('cooks', [])]
        
        orders = []
        if customers and cooks:
            for i in range(10):
                order = Order.objects.create(
                    customer=random.choice(customers),
                    chef=random.choice(cooks),
                    status=random.choice(['pending', 'confirmed', 'delivered']),
                    payment_status='paid',
                    delivery_address=f"{random.randint(100, 999)} Delivery St",
                    subtotal=Decimal('25.00'),
                    tax_amount=Decimal('2.50'),
                    delivery_fee=Decimal('3.99'),
                    total_amount=Decimal('31.49')
                )
                orders.append(order)
        
        self.created_data['orders'] = orders

    def create_order_items(self):
        """Create order items"""
        orders = self.created_data.get('orders', [])
        food_prices = self.created_data.get('food_prices', [])
        
        if orders and food_prices:
            for order in orders:
                for _ in range(random.randint(1, 3)):
                    food_price = random.choice(food_prices)
                    quantity = random.randint(1, 2)
                    
                    OrderItem.objects.create(
                        order=order,
                        price=food_price,
                        quantity=quantity,
                        unit_price=food_price.price,
                        total_price=quantity * food_price.price,
                        food_name=food_price.food.name,
                        food_description=food_price.food.description
                    )

    def create_deliveries(self):
        """Create deliveries"""
        orders = self.created_data.get('orders', [])
        agents = [a.user for a in self.created_data.get('delivery_agents', [])]
        
        if orders and agents:
            for order in orders[:5]:  # First 5 orders
                Delivery.objects.create(
                    status=random.choice(['Pending', 'On the way', 'Delivered']),
                    address=order.delivery_address,
                    order=order,
                    agent=random.choice(agents) if random.choice([True, False]) else None
                )

    def create_reviews(self):
        """Create reviews"""
        customers = [c.user for c in self.created_data.get('customers', [])]
        food_prices = self.created_data.get('food_prices', [])
        
        if customers and food_prices:
            for _ in range(15):
                customer = random.choice(customers)
                food_price = random.choice(food_prices)
                
                if not FoodReview.objects.filter(customer=customer, price=food_price).exists():
                    FoodReview.objects.create(
                        price=food_price,
                        customer=customer,
                        rating=random.randint(4, 5),
                        comment=f"Great {food_price.food.name}! Highly recommended."
                    )

    def create_payments(self):
        """Create payments"""
        orders = self.created_data.get('orders', [])
        
        for order in orders:
            if random.choice([True, False]):
                Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    payment_method='card',
                    status='completed',
                    payment_id=f"PAY_{random.randint(100000, 999999)}",
                    currency='USD'
                )

    def create_communications(self):
        """Create communications"""
        users = self.created_data.get('users', [])
        
        # Create categories and tags first
        CommunicationCategory.objects.get_or_create(
            name='General Inquiry',
            defaults={'description': 'General questions'}
        )
        CommunicationTag.objects.get_or_create(
            name='urgent',
            defaults={'color': '#ff0000'}
        )
        
        # Create contacts
        for user in users[:5]:
            Contact.objects.create(
                name=user.name,
                email=user.email,
                message=f"Hello, I have a question about your service.",
                user=user
            )

    def create_notifications(self):
        """Create notifications"""
        users = self.created_data.get('users', [])
        
        for user in users:
            Notification.objects.create(
                subject=f"Welcome to ChefSync",
                message=f"Thank you for joining ChefSync, {user.name}!",
                user=user,
                status='Unread'
            )

    def create_admin_data(self):
        """Create admin-specific data"""
        # Create admin notifications
        for i in range(5):
            AdminNotification.objects.create(
                title=f"System Alert #{i+1}",
                message=f"Sample admin notification #{i+1}",
                notification_type='system_alert',
                priority='medium'
            )
        
        # Create system settings
        settings_data = [
            ('site_name', 'ChefSync', 'string', 'general'),
            ('delivery_fee', '3.99', 'float', 'general'),
        ]
        
        for key, value, setting_type, category in settings_data:
            AdminSystemSettings.objects.get_or_create(
                key=key,
                defaults={
                    'value': value,
                    'setting_type': setting_type,
                    'category': category,
                    'description': f"Setting for {key.replace('_', ' ')}"
                }
            )