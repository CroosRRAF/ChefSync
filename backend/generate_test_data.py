#!/usr/bin/env python
"""
Standalone script to generate test data for ChefSync
Run this from the backend directory: python generate_test_data.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random
import json
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

# Import models
try:
    from apps.food.models import Food, FoodPrice, FoodCategory, Cuisine
    from apps.orders.models import Order, OrderItem, UserAddress
    from apps.payments.models import Payment
    from apps.users.models import UserProfile
    User = get_user_model()
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)


def create_cuisines():
    """Create cuisine types"""
    cuisines_data = [
        {'name': 'Sri Lankan', 'description': 'Traditional Sri Lankan cuisine'},
        {'name': 'Indian', 'description': 'Authentic Indian dishes'},
        {'name': 'Chinese', 'description': 'Chinese cuisine and fusion'},
        {'name': 'Italian', 'description': 'Italian pasta and pizza'},
        {'name': 'Thai', 'description': 'Thai cuisine with authentic flavors'},
        {'name': 'American', 'description': 'American comfort food'},
        {'name': 'Mexican', 'description': 'Mexican and Tex-Mex dishes'},
        {'name': 'Japanese', 'description': 'Japanese sushi and ramen'},
    ]
    
    cuisines = []
    for cuisine_data in cuisines_data:
        cuisine, created = Cuisine.objects.get_or_create(
            name=cuisine_data['name'],
            defaults={'description': cuisine_data['description']}
        )
        cuisines.append(cuisine)
        
    print(f'Created {len(cuisines)} cuisines')
    return cuisines


def create_categories(cuisines):
    """Create food categories"""
    categories_data = [
        # Sri Lankan
        {'name': 'Rice & Curry', 'cuisine': 'Sri Lankan'},
        {'name': 'Hoppers & String Hoppers', 'cuisine': 'Sri Lankan'},
        {'name': 'Kottu', 'cuisine': 'Sri Lankan'},
        {'name': 'Short Eats', 'cuisine': 'Sri Lankan'},
        
        # Indian
        {'name': 'Biryani', 'cuisine': 'Indian'},
        {'name': 'Curries', 'cuisine': 'Indian'},
        {'name': 'Tandoori', 'cuisine': 'Indian'},
        {'name': 'Street Food', 'cuisine': 'Indian'},
        
        # Chinese
        {'name': 'Noodles', 'cuisine': 'Chinese'},
        {'name': 'Fried Rice', 'cuisine': 'Chinese'},
        {'name': 'Dim Sum', 'cuisine': 'Chinese'},
        
        # Italian
        {'name': 'Pasta', 'cuisine': 'Italian'},
        {'name': 'Pizza', 'cuisine': 'Italian'},
        {'name': 'Risotto', 'cuisine': 'Italian'},
        
        # Thai
        {'name': 'Pad Thai', 'cuisine': 'Thai'},
        {'name': 'Curries', 'cuisine': 'Thai'},
        {'name': 'Stir Fry', 'cuisine': 'Thai'},
        
        # American
        {'name': 'Burgers', 'cuisine': 'American'},
        {'name': 'Sandwiches', 'cuisine': 'American'},
        {'name': 'BBQ', 'cuisine': 'American'},
        
        # Mexican
        {'name': 'Tacos', 'cuisine': 'Mexican'},
        {'name': 'Burritos', 'cuisine': 'Mexican'},
        {'name': 'Quesadillas', 'cuisine': 'Mexican'},
        
        # Japanese
        {'name': 'Sushi', 'cuisine': 'Japanese'},
        {'name': 'Ramen', 'cuisine': 'Japanese'},
        {'name': 'Teriyaki', 'cuisine': 'Japanese'},
    ]
    
    categories = []
    for cat_data in categories_data:
        cuisine = next((c for c in cuisines if c.name == cat_data['cuisine']), cuisines[0])
        category, created = FoodCategory.objects.get_or_create(
            name=cat_data['name'],
            cuisine=cuisine,
            defaults={
                'description': f'Delicious {cat_data["name"].lower()}',
                'is_active': True,
                'sort_order': len(categories)
            }
        )
        categories.append(category)
        
    print(f'Created {len(categories)} food categories')
    return categories


def create_customers(num_customers=50):
    """Create customer users"""
    first_names = [
        'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily',
        'James', 'Jessica', 'William', 'Ashley', 'Richard', 'Amanda', 'Joseph',
        'Jennifer', 'Thomas', 'Michelle', 'Christopher', 'Kimberly', 'Charles',
        'Donna', 'Daniel', 'Carol', 'Matthew', 'Sandra', 'Anthony', 'Ruth',
        'Mark', 'Sharon', 'Donald', 'Nancy', 'Steven', 'Betty', 'Paul', 'Helen',
        'Andrew', 'Shirley', 'Joshua', 'Diane', 'Kenneth', 'Brenda', 'Kevin',
        'Pamela', 'Brian', 'Frances', 'George', 'Christine', 'Timothy', 'Samantha'
    ]
    
    last_names = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
        'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
        'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
        'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
        'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
        'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell'
    ]
    
    customers = []
    for i in range(num_customers):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}{i}@example.com"
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name': f"{first_name} {last_name}",
                'first_name': first_name,
                'last_name': last_name,
                'role': 'customer',
                'phone_no': f"077{random.randint(1000000, 9999999)}",
                'is_active': True,
                'email_verified': True,
                'created_at': timezone.now() - timedelta(days=random.randint(1, 60)),
                'updated_at': timezone.now(),
            }
        )
        
        if created:
            # Create user profile
            try:
                UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'bio': f"Food lover from {random.choice(['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna'])}",
                        'date_of_birth': timezone.now().date() - timedelta(days=random.randint(6570, 21900)),  # 18-60 years old
                        'gender': random.choice(['male', 'female', 'other']),
                        'address': f"{random.randint(1, 999)} {random.choice(['Main St', 'High St', 'Park Ave', 'Oak St', 'Pine St'])}, {random.choice(['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna'])}",
                        'preferences': json.dumps({
                            'email_notifications': True,
                            'sms_notifications': False,
                            'push_notifications': True
                        })
                    }
                )
            except Exception as e:
                print(f"Warning: Could not create user profile for {user.email}: {e}")
            
            # Create user address
            try:
                UserAddress.objects.get_or_create(
                    user=user,
                    label='Home',
                    defaults={
                        'address_line1': f"{random.randint(1, 999)} {random.choice(['Main St', 'High St', 'Park Ave', 'Oak St', 'Pine St'])}",
                        'city': random.choice(['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna']),
                        'pincode': f"{random.randint(10000, 99999)}",
                        'latitude': Decimal(str(6.9271 + random.uniform(-0.1, 0.1))),
                        'longitude': Decimal(str(79.8612 + random.uniform(-0.1, 0.1))),
                        'is_default': True,
                    }
                )
            except Exception as e:
                print(f"Warning: Could not create user address for {user.email}: {e}")
        
        customers.append(user)
        
    print(f'Created {len(customers)} customers')
    return customers


def create_chefs(num_chefs=15):
    """Create chef users"""
    chef_names = [
        'Chef Raj', 'Chef Priya', 'Chef Kumar', 'Chef Nisha', 'Chef Arjun',
        'Chef Meera', 'Chef Suresh', 'Chef Kavitha', 'Chef Ravi', 'Chef Deepa',
        'Chef Manoj', 'Chef Sunita', 'Chef Vijay', 'Chef Anjali', 'Chef Sanjay',
        'Chef Rekha', 'Chef Gopal', 'Chef Uma', 'Chef Ramesh', 'Chef Lakshmi'
    ]
    
    chefs = []
    for i in range(num_chefs):
        chef_name = random.choice(chef_names)
        email = f"chef.{chef_name.lower().replace(' ', '.')}{i}@chefsync.com"
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name': chef_name,
                'first_name': chef_name.split()[1] if len(chef_name.split()) > 1 else chef_name,
                'last_name': chef_name.split()[0],
                'role': 'chef',
                'phone_no': f"077{random.randint(1000000, 9999999)}",
                'is_active': True,
                'email_verified': True,
                'created_at': timezone.now() - timedelta(days=random.randint(1, 90)),
                'updated_at': timezone.now(),
            }
        )
        
        if created:
            # Create chef profile
            try:
                UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'bio': f"Professional chef specializing in {random.choice(['Sri Lankan', 'Indian', 'Chinese', 'Italian', 'Thai'])} cuisine",
                        'date_of_birth': timezone.now().date() - timedelta(days=random.randint(10950, 18250)),  # 30-50 years old
                        'gender': random.choice(['male', 'female']),
                        'address': f"{random.randint(1, 999)} {random.choice(['Main St', 'High St', 'Park Ave', 'Oak St', 'Pine St'])}, {random.choice(['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna'])}",
                        'preferences': json.dumps({
                            'email_notifications': True,
                            'sms_notifications': True,
                            'push_notifications': True
                        })
                    }
                )
            except Exception as e:
                print(f"Warning: Could not create chef profile for {user.email}: {e}")
        
        chefs.append(user)
        
    print(f'Created {len(chefs)} chefs')
    return chefs


def create_food_items(chefs, categories):
    """Create food items with prices"""
    food_data = [
        # Sri Lankan
        {'name': 'Chicken Curry with Rice', 'category': 'Rice & Curry', 'price': 450, 'prep_time': 25},
        {'name': 'Fish Curry with Rice', 'category': 'Rice & Curry', 'price': 500, 'prep_time': 30},
        {'name': 'Egg Hoppers (6 pieces)', 'category': 'Hoppers & String Hoppers', 'price': 300, 'prep_time': 15},
        {'name': 'Chicken Kottu', 'category': 'Kottu', 'price': 400, 'prep_time': 20},
        {'name': 'Vegetable Kottu', 'category': 'Kottu', 'price': 350, 'prep_time': 18},
        {'name': 'Fish Cutlets (4 pieces)', 'category': 'Short Eats', 'price': 250, 'prep_time': 12},
        
        # Indian
        {'name': 'Chicken Biryani', 'category': 'Biryani', 'price': 600, 'prep_time': 35},
        {'name': 'Mutton Biryani', 'category': 'Biryani', 'price': 700, 'prep_time': 40},
        {'name': 'Butter Chicken', 'category': 'Curries', 'price': 550, 'prep_time': 25},
        {'name': 'Tandoori Chicken', 'category': 'Tandoori', 'price': 500, 'prep_time': 30},
        {'name': 'Samosa (3 pieces)', 'category': 'Street Food', 'price': 200, 'prep_time': 10},
        
        # Chinese
        {'name': 'Chicken Noodles', 'category': 'Noodles', 'price': 400, 'prep_time': 20},
        {'name': 'Vegetable Fried Rice', 'category': 'Fried Rice', 'price': 350, 'prep_time': 15},
        {'name': 'Chicken Fried Rice', 'category': 'Fried Rice', 'price': 450, 'prep_time': 18},
        {'name': 'Pork Dumplings (6 pieces)', 'category': 'Dim Sum', 'price': 300, 'prep_time': 12},
        
        # Italian
        {'name': 'Spaghetti Carbonara', 'category': 'Pasta', 'price': 500, 'prep_time': 20},
        {'name': 'Margherita Pizza', 'category': 'Pizza', 'price': 600, 'prep_time': 25},
        {'name': 'Chicken Alfredo Pasta', 'category': 'Pasta', 'price': 550, 'prep_time': 22},
        {'name': 'Mushroom Risotto', 'category': 'Risotto', 'price': 450, 'prep_time': 30},
        
        # Thai
        {'name': 'Pad Thai', 'category': 'Pad Thai', 'price': 400, 'prep_time': 18},
        {'name': 'Green Curry', 'category': 'Curries', 'price': 450, 'prep_time': 25},
        {'name': 'Chicken Stir Fry', 'category': 'Stir Fry', 'price': 380, 'prep_time': 15},
        
        # American
        {'name': 'Beef Burger', 'category': 'Burgers', 'price': 500, 'prep_time': 20},
        {'name': 'Chicken Sandwich', 'category': 'Sandwiches', 'price': 400, 'prep_time': 15},
        {'name': 'BBQ Ribs', 'category': 'BBQ', 'price': 800, 'prep_time': 45},
        
        # Mexican
        {'name': 'Chicken Tacos (3 pieces)', 'category': 'Tacos', 'price': 350, 'prep_time': 15},
        {'name': 'Beef Burrito', 'category': 'Burritos', 'price': 450, 'prep_time': 18},
        {'name': 'Cheese Quesadilla', 'category': 'Quesadillas', 'price': 300, 'prep_time': 12},
        
        # Japanese
        {'name': 'Salmon Sushi Roll', 'category': 'Sushi', 'price': 600, 'prep_time': 25},
        {'name': 'Chicken Ramen', 'category': 'Ramen', 'price': 500, 'prep_time': 20},
        {'name': 'Teriyaki Chicken', 'category': 'Teriyaki', 'price': 450, 'prep_time': 18},
    ]
    
    foods = []
    for food_info in food_data:
        category = next((c for c in categories if c.name == food_info['category']), categories[0])
        chef = random.choice(chefs)
        
        food, created = Food.objects.get_or_create(
            name=food_info['name'],
            chef=chef,
            defaults={
                'category': food_info['category'],
                'description': f"Delicious {food_info['name'].lower()} prepared by {chef.name}",
                'status': 'active',
                'is_available': True,
                'is_featured': random.choice([True, False]),
                'preparation_time': food_info['prep_time'],
                'calories_per_serving': random.randint(200, 800),
                'ingredients': json.dumps([
                    'Fresh ingredients', 'Spices', 'Herbs', 'Oil', 'Salt'
                ]),
                'allergens': json.dumps(['May contain nuts', 'Dairy']),
                'nutritional_info': json.dumps({
                    'protein': f"{random.randint(15, 40)}g",
                    'carbs': f"{random.randint(30, 60)}g",
                    'fat': f"{random.randint(10, 25)}g"
                }),
                'is_vegetarian': 'vegetable' in food_info['name'].lower() or 'mushroom' in food_info['name'].lower(),
                'is_vegan': False,
                'is_gluten_free': random.choice([True, False]),
                'spice_level': random.choice(['Mild', 'Medium', 'Hot']),
                'rating_average': round(random.uniform(3.5, 5.0), 2),
                'total_reviews': random.randint(5, 50),
                'total_orders': random.randint(10, 100),
                'created_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                'updated_at': timezone.now(),
            }
        )
        
        if created:
            # Create food prices
            FoodPrice.objects.get_or_create(
                food=food,
                cook=chef,
                size='Regular',
                defaults={
                    'price': Decimal(str(food_info['price'])),
                    'preparation_time': food_info['prep_time'],
                    'created_at': timezone.now(),
                    'updated_at': timezone.now(),
                }
            )
            
            # Add large size for some items
            if random.choice([True, False]):
                FoodPrice.objects.get_or_create(
                    food=food,
                    cook=chef,
                    size='Large',
                    defaults={
                        'price': Decimal(str(food_info['price'] + 100)),
                        'preparation_time': food_info['prep_time'] + 5,
                        'created_at': timezone.now(),
                        'updated_at': timezone.now(),
                    }
                )
        
        foods.append(food)
        
    print(f'Created {len(foods)} food items')
    return foods


def create_orders_over_time(days=30, orders_per_day=25, customers=None, chefs=None, foods=None):
    """Create orders distributed over time"""
    if not customers:
        customers = User.objects.filter(role='customer')
    if not chefs:
        chefs = User.objects.filter(role='chef')
    if not foods:
        foods = Food.objects.all()
    
    start_date = timezone.now() - timedelta(days=days)
    total_orders = 0
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        
        # Vary orders per day (weekends have more orders)
        day_of_week = current_date.weekday()
        if day_of_week >= 5:  # Weekend
            daily_orders = int(orders_per_day * random.uniform(1.2, 1.8))
        else:  # Weekday
            daily_orders = int(orders_per_day * random.uniform(0.7, 1.3))
        
        # Create orders for this day
        for _ in range(daily_orders):
            order = create_single_order(current_date, customers, chefs, foods)
            if order:
                total_orders += 1
    
    print(f'Created {total_orders} orders over {days} days')


def create_single_order(order_date, customers, chefs, foods):
    """Create a single order"""
    customer = random.choice(customers)
    chef = random.choice(chefs)
    
    # Random time during the day
    hour = random.randint(8, 22)
    minute = random.randint(0, 59)
    order_time = order_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    # Order status based on time
    if order_time > timezone.now():
        status = 'pending'
    elif order_time > timezone.now() - timedelta(hours=2):
        status = random.choice(['confirmed', 'preparing'])
    elif order_time > timezone.now() - timedelta(hours=4):
        status = random.choice(['preparing', 'ready_for_delivery'])
    else:
        status = random.choice(['delivered', 'completed'])
    
    # Generate order number
    order_number = f"ORD-{random.randint(10000000, 99999999):08X}"
    
    try:
        # Create order
        order = Order.objects.create(
            order_number=order_number,
            status=status,
            payment_status='paid',
            payment_method=random.choice(['cash', 'card', 'online']),
            subtotal=Decimal('0.00'),
            tax_amount=Decimal('0.00'),
            delivery_fee=Decimal('40.00'),
            discount_amount=Decimal('0.00'),
            total_amount=Decimal('0.00'),
            delivery_address=f"{random.randint(1, 999)} {random.choice(['Main St', 'High St', 'Park Ave'])}",
            delivery_instructions=random.choice([
                'Call when arrived', 'Ring the doorbell', 'Leave at door', 'Meet at gate'
            ]),
            delivery_latitude=Decimal(str(6.9271 + random.uniform(-0.1, 0.1))),
            delivery_longitude=Decimal(str(79.8612 + random.uniform(-0.1, 0.1))),
            distance_km=Decimal(str(round(random.uniform(1.0, 15.0), 2))),
            customer_notes=random.choice([
                'Extra spicy please', 'Mild spice level', 'No onions', 'Extra sauce', ''
            ]),
            chef_notes='',
            admin_notes='',
            created_at=order_time,
            updated_at=order_time,
            confirmed_at=order_time + timedelta(minutes=random.randint(5, 15)) if status in ['confirmed', 'preparing', 'ready_for_delivery', 'delivered', 'completed'] else None,
            chef_id=chef.user_id,
            customer_id=customer.user_id,
        )
        
        # Add order items
        num_items = random.randint(1, 4)
        selected_foods = random.sample(list(foods), min(num_items, len(foods)))
        
        subtotal = Decimal('0.00')
        for food in selected_foods:
            # Get food price
            try:
                food_price = FoodPrice.objects.filter(food=food, cook=chef).first()
                if not food_price:
                    continue
                    
                quantity = random.randint(1, 3)
                unit_price = food_price.price
                total_price = unit_price * quantity
                
                OrderItem.objects.create(
                    order=order,
                    price=food_price,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    special_instructions=random.choice([
                        'Extra spicy', 'Mild spice', 'No onions', 'Extra sauce', ''
                    ]),
                    food_name=food.name,
                    food_description=food.description,
                )
                
                subtotal += total_price
                
            except Exception as e:
                continue
        
        # Calculate totals
        tax_amount = subtotal * Decimal('0.10')  # 10% tax
        total_amount = subtotal + tax_amount + order.delivery_fee - order.discount_amount
        
        # Update order totals
        order.subtotal = subtotal
        order.tax_amount = tax_amount
        order.total_amount = total_amount
        order.save()
        
        # Create payment record
        if status in ['confirmed', 'preparing', 'ready_for_delivery', 'delivered', 'completed']:
            Payment.objects.get_or_create(
                order=order,
                defaults={
                    'amount': total_amount,
                    'payment_method': order.payment_method,
                    'status': 'completed',
                    'provider_transaction_id': f"TXN-{random.randint(10000000, 99999999):08X}",
                    'created_at': order_time,
                    'updated_at': order_time,
                }
            )
        
        return order
        
    except Exception as e:
        print(f"Error creating order: {e}")
        return None


def main():
    """Main function to generate test data"""
    print("🚀 Starting ChefSync Test Data Generation...")
    print("=" * 50)
    
    try:
        with transaction.atomic():
            # Generate cuisines and categories first
            print("📋 Creating cuisines and categories...")
            cuisines = create_cuisines()
            categories = create_categories(cuisines)
            
            # Generate users
            print("👥 Creating users...")
            customers = create_customers(50)
            chefs = create_chefs(15)
            
            # Generate food items
            print("🍽️ Creating food items...")
            foods = create_food_items(chefs, categories)
            
            # Generate orders over time
            print("📦 Creating orders over time...")
            create_orders_over_time(30, 25, customers, chefs, foods)
        
        print("=" * 50)
        print("✅ Test data generation completed successfully!")
        print(f"📊 Summary:")
        print(f"   - Cuisines: {Cuisine.objects.count()}")
        print(f"   - Categories: {FoodCategory.objects.count()}")
        print(f"   - Customers: {User.objects.filter(role='customer').count()}")
        print(f"   - Chefs: {User.objects.filter(role='chef').count()}")
        print(f"   - Food Items: {Food.objects.count()}")
        print(f"   - Orders: {Order.objects.count()}")
        print(f"   - Payments: {Payment.objects.count()}")
        
    except Exception as e:
        print(f"❌ Error generating test data: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
