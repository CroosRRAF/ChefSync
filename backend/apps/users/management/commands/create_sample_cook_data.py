from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import ChefProfile, UserProfile
from apps.food.models import Food, Cuisine, FoodCategory, FoodPrice
from apps.orders.models import Order, OrderItem
from decimal import Decimal
import random
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Create 10 sample cook-related data entries'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample cook data...'))
        
        # Create sample cuisines first
        self.create_cuisines()
        
        # Create sample chefs
        self.create_sample_chefs()
        
        # Create sample foods
        self.create_sample_foods()
        
        # Create sample orders
        self.create_sample_orders()
        
        self.stdout.write(self.style.SUCCESS('Successfully created sample cook data!'))

    def create_cuisines(self):
        """Create sample cuisines if they don't exist"""
        cuisines_data = [
            {'name': 'Italian', 'description': 'Authentic Italian cuisine with pasta, pizza and regional specialties'},
            {'name': 'Chinese', 'description': 'Traditional Chinese dishes from various regions'},
            {'name': 'Indian', 'description': 'Spicy Indian delicacies with rich flavors and aromatic spices'},
            {'name': 'Mexican', 'description': 'Flavorful Mexican food with fresh ingredients and bold spices'},
            {'name': 'Japanese', 'description': 'Fresh Japanese cuisine including sushi, ramen and traditional dishes'},
            {'name': 'French', 'description': 'Classic French cuisine with fine dining techniques'},
            {'name': 'American', 'description': 'Modern American comfort food and fusion dishes'},
            {'name': 'Middle Eastern', 'description': 'Traditional Middle Eastern and Mediterranean cuisine'},
            {'name': 'Thai', 'description': 'Authentic Thai dishes with aromatic herbs and spices'},
            {'name': 'Greek', 'description': 'Fresh Greek cuisine with Mediterranean ingredients'},
        ]
        
        for cuisine_data in cuisines_data:
            cuisine, created = Cuisine.objects.get_or_create(
                name=cuisine_data['name'],
                defaults=cuisine_data
            )
            if created:
                self.stdout.write(f'Created cuisine: {cuisine.name}')

    def create_sample_chefs(self):
        """Create 10 sample chef users with profiles"""
        chef_data = [
            {
                'username': 'chef_mario',
                'email': 'mario@chefsync.com',
                'name': 'Mario Rossi',
                'phone_no': '+1234567890',
                'specialty_cuisines': ['Italian', 'Mediterranean'],
                'experience_years': 15,
                'bio': 'Passionate Italian chef with 15 years of experience'
            },
            {
                'username': 'chef_chen',
                'email': 'chen@chefsync.com', 
                'name': 'Chen Wei',
                'phone_no': '+1234567891',
                'specialty_cuisines': ['Chinese', 'Asian'],
                'experience_years': 12,
                'bio': 'Expert in authentic Chinese cuisine and dim sum'
            },
            {
                'username': 'chef_priya',
                'email': 'priya@chefsync.com',
                'name': 'Priya Sharma',
                'phone_no': '+1234567892',
                'specialty_cuisines': ['Indian', 'Vegetarian'],
                'experience_years': 10,
                'bio': 'Specialist in Indian vegetarian and vegan dishes'
            },
            {
                'username': 'chef_carlos',
                'email': 'carlos@chefsync.com',
                'name': 'Carlos Rodriguez',
                'phone_no': '+1234567893',
                'specialty_cuisines': ['Mexican', 'Latin American'],
                'experience_years': 8,
                'bio': 'Traditional Mexican cuisine expert'
            },
            {
                'username': 'chef_akiko',
                'email': 'akiko@chefsync.com',
                'name': 'Akiko Tanaka',
                'phone_no': '+1234567894',
                'specialty_cuisines': ['Japanese', 'Sushi'],
                'experience_years': 18,
                'bio': 'Master sushi chef and Japanese cuisine specialist'
            },
            {
                'username': 'chef_pierre',
                'email': 'pierre@chefsync.com',
                'name': 'Pierre Dubois',
                'phone_no': '+1234567895',
                'specialty_cuisines': ['French', 'European'],
                'experience_years': 20,
                'bio': 'French culinary school graduate with Michelin experience'
            },
            {
                'username': 'chef_sarah',
                'email': 'sarah@chefsync.com',
                'name': 'Sarah Johnson',
                'phone_no': '+1234567896',
                'specialty_cuisines': ['American', 'Fusion'],
                'experience_years': 7,
                'bio': 'Creative fusion chef with modern American style'
            },
            {
                'username': 'chef_ahmed',
                'email': 'ahmed@chefsync.com',
                'name': 'Ahmed Hassan',
                'phone_no': '+1234567897',
                'specialty_cuisines': ['Middle Eastern', 'Mediterranean'],
                'experience_years': 14,
                'bio': 'Traditional Middle Eastern and Mediterranean cuisine'
            },
            {
                'username': 'chef_elena',
                'email': 'elena@chefsync.com',
                'name': 'Elena Popov',
                'phone_no': '+1234567898',
                'specialty_cuisines': ['Russian', 'Eastern European'],
                'experience_years': 11,
                'bio': 'Expert in traditional Russian and Eastern European dishes'
            },
            {
                'username': 'chef_michael',
                'email': 'michael@chefsync.com',
                'name': 'Michael O\'Brien',
                'phone_no': '+1234567899',
                'specialty_cuisines': ['Irish', 'British'],
                'experience_years': 9,
                'bio': 'Traditional Irish and British pub food specialist'
            }
        ]

        for chef_info in chef_data:
            # Create user if doesn't exist
            user, created = User.objects.get_or_create(
                username=chef_info['username'],
                defaults={
                    'email': chef_info['email'],
                    'name': chef_info['name'],
                    'phone_no': chef_info['phone_no'],
                    'role': 'cook',
                    'email_verified': True,
                }
            )
            
            if created:
                user.set_password('chef123')
                user.save()
                self.stdout.write(f'Created chef user: {user.username}')
                
                # Create user profile
                UserProfile.objects.create(
                    user=user,
                    bio=chef_info['bio'],
                    address='123 Chef Street, Food City, FC 12345'
                )
                
                # Create chef profile
                ChefProfile.objects.create(
                    user=user,
                    specialty_cuisines=chef_info['specialty_cuisines'],
                    experience_years=chef_info['experience_years'],
                    bio=chef_info['bio'],
                    approval_status='approved',
                    rating_average=Decimal(str(round(random.uniform(4.0, 5.0), 2))),
                    total_orders=random.randint(50, 500),
                    total_reviews=random.randint(10, 100)
                )

    def create_sample_foods(self):
        """Create sample food items for chefs"""
        # Get approved chefs
        chefs = User.objects.filter(role='cook', chef_profile__approval_status='approved')
        
        food_data = [
            {
                'name': 'Margherita Pizza',
                'category': 'Main Course',
                'description': 'Classic Italian pizza with fresh mozzarella and basil',
                'prices': {'Small': 14.99, 'Medium': 18.99, 'Large': 22.99},
                'preparation_time': 15,
                'is_vegetarian': True,
                'spice_level': 'mild',
                'ingredients': ['pizza dough', 'mozzarella', 'tomato sauce', 'basil']
            },
            {
                'name': 'Kung Pao Chicken',
                'category': 'Main Course', 
                'description': 'Spicy Chinese stir-fry with chicken and peanuts',
                'prices': {'Small': 13.50, 'Medium': 16.50, 'Large': 19.50},
                'preparation_time': 20,
                'spice_level': 'hot',
                'ingredients': ['chicken', 'peanuts', 'vegetables', 'kung pao sauce']
            },
            {
                'name': 'Butter Chicken',
                'category': 'Main Course',
                'description': 'Creamy Indian curry with tender chicken',
                'prices': {'Small': 16.99, 'Medium': 19.99, 'Large': 24.99},
                'preparation_time': 25,
                'spice_level': 'medium',
                'ingredients': ['chicken', 'tomato sauce', 'cream', 'spices']
            },
            {
                'name': 'Fish Tacos',
                'category': 'Main Course',
                'description': 'Fresh fish tacos with Mexican spices and lime',
                'prices': {'Small': 11.99, 'Medium': 14.99, 'Large': 17.99},
                'preparation_time': 12,
                'spice_level': 'mild',
                'ingredients': ['fish', 'tortillas', 'cabbage', 'lime', 'salsa']
            },
            {
                'name': 'Sushi Platter',
                'category': 'Main Course',
                'description': 'Assorted fresh sushi with wasabi and ginger',
                'prices': {'Small': 24.99, 'Medium': 28.99, 'Large': 34.99},
                'preparation_time': 30,
                'ingredients': ['fresh fish', 'sushi rice', 'nori', 'wasabi']
            },
            {
                'name': 'Coq au Vin',
                'category': 'Main Course',
                'description': 'Classic French chicken braised in red wine',
                'prices': {'Small': 21.99, 'Medium': 24.99, 'Large': 29.99},
                'preparation_time': 45,
                'ingredients': ['chicken', 'red wine', 'mushrooms', 'herbs']
            },
            {
                'name': 'BBQ Burger',
                'category': 'Main Course',
                'description': 'Juicy beef burger with BBQ sauce and fries',
                'prices': {'Small': 13.99, 'Medium': 16.99, 'Large': 19.99},
                'preparation_time': 15,
                'ingredients': ['beef patty', 'bun', 'bbq sauce', 'lettuce', 'tomato']
            },
            {
                'name': 'Hummus Platter',
                'category': 'Appetizer',
                'description': 'Fresh hummus with pita bread and vegetables',
                'prices': {'Small': 9.99, 'Medium': 12.99, 'Large': 15.99},
                'preparation_time': 10,
                'is_vegetarian': True,
                'is_vegan': True,
                'ingredients': ['chickpeas', 'tahini', 'olive oil', 'pita bread']
            },
            {
                'name': 'Borscht Soup',
                'category': 'Soup',
                'description': 'Traditional Russian beet soup with sour cream',
                'prices': {'Small': 6.99, 'Medium': 8.99, 'Large': 11.99},
                'preparation_time': 20,
                'is_vegetarian': True,
                'ingredients': ['beets', 'cabbage', 'carrots', 'sour cream']
            },
            {
                'name': 'Fish & Chips',
                'category': 'Main Course',
                'description': 'Beer-battered fish with crispy chips',
                'prices': {'Small': 14.99, 'Medium': 17.99, 'Large': 21.99},
                'preparation_time': 18,
                'ingredients': ['cod fish', 'potatoes', 'beer batter', 'mushy peas']
            },
            {
                'name': 'Pad Thai',
                'category': 'Main Course',
                'description': 'Traditional Thai stir-fried noodles with shrimp',
                'prices': {'Small': 12.99, 'Medium': 15.99, 'Large': 18.99},
                'preparation_time': 15,
                'spice_level': 'medium',
                'ingredients': ['rice noodles', 'shrimp', 'bean sprouts', 'tamarind sauce']
            },
            {
                'name': 'Greek Moussaka',
                'category': 'Main Course',
                'description': 'Traditional Greek layered casserole with eggplant and meat',
                'prices': {'Small': 16.99, 'Medium': 19.99, 'Large': 23.99},
                'preparation_time': 35,
                'ingredients': ['eggplant', 'ground lamb', 'bechamel sauce', 'cheese']
            },
            {
                'name': 'Chicken Tikka Masala',
                'category': 'Main Course',
                'description': 'Creamy tomato-based Indian curry with chicken',
                'prices': {'Small': 15.99, 'Medium': 18.99, 'Large': 22.99},
                'preparation_time': 25,
                'spice_level': 'medium',
                'ingredients': ['chicken', 'tomato sauce', 'cream', 'tikka spices']
            },
            {
                'name': 'Ramen Bowl',
                'category': 'Main Course',
                'description': 'Authentic Japanese ramen with rich broth and noodles',
                'prices': {'Small': 13.99, 'Medium': 16.99, 'Large': 19.99},
                'preparation_time': 20,
                'ingredients': ['ramen noodles', 'pork broth', 'egg', 'nori', 'green onions']
            },
            {
                'name': 'Beef Bourguignon',
                'category': 'Main Course',
                'description': 'Classic French beef stew with red wine and vegetables',
                'prices': {'Small': 22.99, 'Medium': 26.99, 'Large': 30.99},
                'preparation_time': 60,
                'ingredients': ['beef', 'red wine', 'mushrooms', 'pearl onions', 'herbs']
            },
            {
                'name': 'Falafel Wrap',
                'category': 'Main Course',
                'description': 'Middle Eastern chickpea fritters in pita with tahini sauce',
                'prices': {'Small': 9.99, 'Medium': 12.99, 'Large': 15.99},
                'preparation_time': 12,
                'is_vegetarian': True,
                'is_vegan': True,
                'ingredients': ['chickpeas', 'pita bread', 'tahini', 'vegetables']
            },
            {
                'name': 'Tom Yum Soup',
                'category': 'Soup',
                'description': 'Spicy and sour Thai soup with shrimp',
                'prices': {'Small': 8.99, 'Medium': 11.99, 'Large': 14.99},
                'preparation_time': 15,
                'spice_level': 'hot',
                'ingredients': ['shrimp', 'lemongrass', 'lime leaves', 'chilies']
            },
            {
                'name': 'Carbonara Pasta',
                'category': 'Main Course',
                'description': 'Classic Italian pasta with eggs, cheese and pancetta',
                'prices': {'Small': 14.99, 'Medium': 17.99, 'Large': 21.99},
                'preparation_time': 15,
                'ingredients': ['spaghetti', 'eggs', 'parmesan', 'pancetta', 'black pepper']
            },
            {
                'name': 'General Tso Chicken',
                'category': 'Main Course',
                'description': 'Sweet and spicy Chinese-American chicken dish',
                'prices': {'Small': 13.99, 'Medium': 16.99, 'Large': 19.99},
                'preparation_time': 18,
                'spice_level': 'medium',
                'ingredients': ['chicken', 'soy sauce', 'ginger', 'garlic', 'sweet sauce']
            }
        ]

        for i, food_info in enumerate(food_data):
            # Cycle through all available chefs, not just the first 10
            chef = chefs[i % len(chefs)]
            
            food, created = Food.objects.get_or_create(
                name=food_info['name'],
                chef=chef,
                defaults={
                    'category': food_info['category'],
                    'description': food_info['description'],
                    'status': 'Approved',
                    'is_available': True,
                    'preparation_time': food_info['preparation_time'],
                    'ingredients': food_info['ingredients'],
                    'is_vegetarian': food_info.get('is_vegetarian', False),
                    'is_vegan': food_info.get('is_vegan', False),
                    'spice_level': food_info.get('spice_level', 'mild'),
                    'rating_average': Decimal(str(round(random.uniform(4.0, 5.0), 2))),
                    'total_reviews': random.randint(5, 50),
                    'total_orders': random.randint(10, 200)
                }
            )
            
            if created:
                self.stdout.write(f'Created food: {food.name} by {chef.username}')
            else:
                self.stdout.write(f'Food already exists: {food.name} by {chef.username}')
                
            # Create FoodPrice entries for each size (whether food is new or existing)
            for size, price in food_info['prices'].items():
                food_price, price_created = FoodPrice.objects.get_or_create(
                    food=food,
                    size=size,
                    cook=chef,
                    defaults={
                        'price': Decimal(str(price))
                    }
                )
                
                if price_created:
                    self.stdout.write(f'  Created price: {size} - ${price}')
                else:
                    self.stdout.write(f'  Price already exists: {size} - ${price}')

    def create_sample_orders(self):
        """Create sample orders for testing"""
        # Get some customers and chefs
        customers = User.objects.filter(role='customer')[:5]
        chefs = User.objects.filter(role='cook')[:5]
        food_prices = FoodPrice.objects.all()[:15]
        
        if not customers.exists():
            # Create a sample customer if none exist
            customer = User.objects.create(
                username='customer_test',
                email='customer@test.com',
                name='Test Customer',
                phone_no='+1234567800',
                role='customer',
                email_verified=True
            )
            customer.set_password('test123')
            customer.save()
            customers = [customer]

        order_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
        
        for i in range(10):
            if customers and chefs and food_prices:
                customer = random.choice(customers)
                chef = random.choice(chefs)
                
                # Generate unique order number
                import uuid
                order_number = f'ORD-{uuid.uuid4().hex[:8].upper()}'
                
                order = Order.objects.create(
                    order_number=order_number,
                    customer=customer,
                    chef=chef,
                    status=random.choice(order_statuses),
                    payment_status='paid',
                    payment_method='card',
                    total_amount=Decimal(str(round(random.uniform(15.99, 45.99), 2))),
                    delivery_fee=Decimal('3.99'),
                    created_at=timezone.now() - timedelta(days=random.randint(0, 30))
                )
                
                # Add 1-3 items to each order
                selected_prices = random.sample(list(food_prices), min(random.randint(1, 3), len(food_prices)))
                for price in selected_prices:
                    OrderItem.objects.create(
                        order=order,
                        price=price,
                        quantity=random.randint(1, 3)
                    )
                
                self.stdout.write(f'Created order: {order.order_number}')