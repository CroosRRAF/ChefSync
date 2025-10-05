#!/usr/bin/env python
"""
Safe version of test data generation script with better error handling
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

try:
    django.setup()
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

# Import models with better error handling
try:
    from apps.food.models import Food, FoodPrice, FoodCategory, Cuisine
    print("✅ Food models imported")
except ImportError as e:
    print(f"❌ Food models import failed: {e}")
    sys.exit(1)

try:
    from apps.orders.models import Order, OrderItem, UserAddress
    print("✅ Order models imported")
except ImportError as e:
    print(f"❌ Order models import failed: {e}")
    sys.exit(1)

try:
    from apps.payments.models import Payment
    print("✅ Payment models imported")
except ImportError as e:
    print(f"❌ Payment models import failed: {e}")
    sys.exit(1)

try:
    from apps.users.models import UserProfile
    print("✅ UserProfile model imported")
except ImportError as e:
    print(f"❌ UserProfile model import failed: {e}")
    sys.exit(1)

User = get_user_model()
print("✅ User model loaded")


def create_cuisines():
    """Create cuisine types"""
    cuisines_data = [
        {'name': 'Sri Lankan', 'description': 'Traditional Sri Lankan cuisine'},
        {'name': 'Indian', 'description': 'Authentic Indian dishes'},
        {'name': 'Chinese', 'description': 'Chinese cuisine and fusion'},
        {'name': 'Italian', 'description': 'Italian pasta and pizza'},
        {'name': 'Thai', 'description': 'Thai cuisine with authentic flavors'},
    ]
    
    cuisines = []
    for cuisine_data in cuisines_data:
        try:
            cuisine, created = Cuisine.objects.get_or_create(
                name=cuisine_data['name'],
                defaults={'description': cuisine_data['description']}
            )
            cuisines.append(cuisine)
            if created:
                print(f"  ✅ Created cuisine: {cuisine.name}")
        except Exception as e:
            print(f"  ❌ Failed to create cuisine {cuisine_data['name']}: {e}")
        
    print(f'✅ Created {len(cuisines)} cuisines')
    return cuisines


def create_categories(cuisines):
    """Create food categories"""
    categories_data = [
        {'name': 'Rice & Curry', 'cuisine': 'Sri Lankan'},
        {'name': 'Kottu', 'cuisine': 'Sri Lankan'},
        {'name': 'Biryani', 'cuisine': 'Indian'},
        {'name': 'Noodles', 'cuisine': 'Chinese'},
        {'name': 'Pasta', 'cuisine': 'Italian'},
    ]
    
    categories = []
    for cat_data in categories_data:
        try:
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
            if created:
                print(f"  ✅ Created category: {category.name}")
        except Exception as e:
            print(f"  ❌ Failed to create category {cat_data['name']}: {e}")
        
    print(f'✅ Created {len(categories)} food categories')
    return categories


def create_customers(num_customers=10):
    """Create customer users"""
    first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Jessica']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    
    customers = []
    for i in range(num_customers):
        try:
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
                    'created_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                    'updated_at': timezone.now(),
                }
            )
            
            if created:
                print(f"  ✅ Created customer: {user.name}")
                
                # Create user profile
                try:
                    UserProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'bio': f"Food lover from {random.choice(['Colombo', 'Kandy', 'Galle'])}",
                            'date_of_birth': timezone.now().date() - timedelta(days=random.randint(6570, 21900)),
                            'gender': random.choice(['male', 'female', 'other']),
                            'address': f"{random.randint(1, 999)} Main St, Colombo",
                            'preferences': json.dumps({
                                'email_notifications': True,
                                'sms_notifications': False,
                                'push_notifications': True
                            })
                        }
                    )
                except Exception as e:
                    print(f"  ⚠️ Could not create user profile for {user.email}: {e}")
                
                # Create user address
                try:
                    UserAddress.objects.get_or_create(
                        user=user,
                        label='Home',
                        defaults={
                            'address_line1': f"{random.randint(1, 999)} Main St",
                            'city': 'Colombo',
                            'pincode': f"{random.randint(10000, 99999)}",
                            'latitude': Decimal(str(6.9271 + random.uniform(-0.1, 0.1))),
                            'longitude': Decimal(str(79.8612 + random.uniform(-0.1, 0.1))),
                            'is_default': True,
                        }
                    )
                except Exception as e:
                    print(f"  ⚠️ Could not create user address for {user.email}: {e}")
            
            customers.append(user)
            
        except Exception as e:
            print(f"  ❌ Failed to create customer {i}: {e}")
        
    print(f'✅ Created {len(customers)} customers')
    return customers


def create_chefs(num_chefs=5):
    """Create chef users"""
    chef_names = ['Chef Raj', 'Chef Priya', 'Chef Kumar', 'Chef Nisha', 'Chef Arjun']
    
    chefs = []
    for i in range(num_chefs):
        try:
            chef_name = chef_names[i]
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
                    'created_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                    'updated_at': timezone.now(),
                }
            )
            
            if created:
                print(f"  ✅ Created chef: {user.name}")
                
                # Create chef profile
                try:
                    UserProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'bio': f"Professional chef specializing in {random.choice(['Sri Lankan', 'Indian', 'Chinese'])} cuisine",
                            'date_of_birth': timezone.now().date() - timedelta(days=random.randint(10950, 18250)),
                            'gender': random.choice(['male', 'female']),
                            'address': f"{random.randint(1, 999)} Main St, Colombo",
                            'preferences': json.dumps({
                                'email_notifications': True,
                                'sms_notifications': True,
                                'push_notifications': True
                            })
                        }
                    )
                except Exception as e:
                    print(f"  ⚠️ Could not create chef profile for {user.email}: {e}")
            
            chefs.append(user)
            
        except Exception as e:
            print(f"  ❌ Failed to create chef {i}: {e}")
        
    print(f'✅ Created {len(chefs)} chefs')
    return chefs


def create_food_items(chefs, categories):
    """Create food items with prices"""
    food_data = [
        {'name': 'Chicken Curry with Rice', 'category': 'Rice & Curry', 'price': 450, 'prep_time': 25},
        {'name': 'Chicken Kottu', 'category': 'Kottu', 'price': 400, 'prep_time': 20},
        {'name': 'Chicken Biryani', 'category': 'Biryani', 'price': 600, 'prep_time': 35},
        {'name': 'Chicken Noodles', 'category': 'Noodles', 'price': 400, 'prep_time': 20},
        {'name': 'Spaghetti Carbonara', 'category': 'Pasta', 'price': 500, 'prep_time': 20},
    ]
    
    foods = []
    for food_info in food_data:
        try:
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
                    'ingredients': json.dumps(['Fresh ingredients', 'Spices', 'Herbs', 'Oil', 'Salt']),
                    'allergens': json.dumps(['May contain nuts', 'Dairy']),
                    'nutritional_info': json.dumps({
                        'protein': f"{random.randint(15, 40)}g",
                        'carbs': f"{random.randint(30, 60)}g",
                        'fat': f"{random.randint(10, 25)}g"
                    }),
                    'is_vegetarian': 'vegetable' in food_info['name'].lower(),
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
                print(f"  ✅ Created food item: {food.name}")
                
                # Create food prices
                try:
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
                except Exception as e:
                    print(f"  ⚠️ Could not create food price for {food.name}: {e}")
            
            foods.append(food)
            
        except Exception as e:
            print(f"  ❌ Failed to create food item {food_info['name']}: {e}")
        
    print(f'✅ Created {len(foods)} food items')
    return foods


def create_sample_orders(customers, chefs, foods, num_orders=20):
    """Create sample orders"""
    orders_created = 0
    
    for i in range(num_orders):
        try:
            customer = random.choice(customers)
            chef = random.choice(chefs)
            
            # Random time in the past week
            order_time = timezone.now() - timedelta(days=random.randint(1, 7), hours=random.randint(0, 23))
            
            # Generate order number
            order_number = f"ORD-{random.randint(10000000, 99999999):08X}"
            
            # Create order
            order = Order.objects.create(
                order_number=order_number,
                status=random.choice(['delivered', 'completed']),
                payment_status='paid',
                payment_method=random.choice(['cash', 'card', 'online']),
                subtotal=Decimal('0.00'),
                tax_amount=Decimal('0.00'),
                delivery_fee=Decimal('40.00'),
                discount_amount=Decimal('0.00'),
                total_amount=Decimal('0.00'),
                delivery_address=f"{random.randint(1, 999)} Main St, Colombo",
                delivery_instructions=random.choice(['Call when arrived', 'Ring the doorbell', 'Leave at door']),
                delivery_latitude=Decimal(str(6.9271 + random.uniform(-0.1, 0.1))),
                delivery_longitude=Decimal(str(79.8612 + random.uniform(-0.1, 0.1))),
                distance_km=Decimal(str(round(random.uniform(1.0, 15.0), 2))),
                customer_notes=random.choice(['Extra spicy please', 'Mild spice level', 'No onions', '']),
                chef_notes='',
                admin_notes='',
                created_at=order_time,
                updated_at=order_time,
                confirmed_at=order_time + timedelta(minutes=random.randint(5, 15)),
                chef_id=chef.user_id,
                customer_id=customer.user_id,
            )
            
            # Add order items
            num_items = random.randint(1, 3)
            selected_foods = random.sample(list(foods), min(num_items, len(foods)))
            
            subtotal = Decimal('0.00')
            for food in selected_foods:
                try:
                    food_price = FoodPrice.objects.filter(food=food, cook=chef).first()
                    if not food_price:
                        continue
                        
                    quantity = random.randint(1, 2)
                    unit_price = food_price.price
                    total_price = unit_price * quantity
                    
                    OrderItem.objects.create(
                        order=order,
                        price=food_price,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        special_instructions=random.choice(['Extra spicy', 'Mild spice', 'No onions', '']),
                        food_name=food.name,
                        food_description=food.description,
                    )
                    
                    subtotal += total_price
                    
                except Exception as e:
                    print(f"  ⚠️ Could not create order item for {food.name}: {e}")
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
            try:
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
            except Exception as e:
                print(f"  ⚠️ Could not create payment for order {order.order_number}: {e}")
            
            orders_created += 1
            if orders_created % 5 == 0:
                print(f"  ✅ Created {orders_created} orders...")
            
        except Exception as e:
            print(f"  ❌ Failed to create order {i}: {e}")
    
    print(f'✅ Created {orders_created} orders')
    return orders_created


def main():
    """Main function to generate test data"""
    print("🚀 Starting ChefSync Test Data Generation (Safe Version)...")
    print("=" * 60)
    
    try:
        with transaction.atomic():
            # Generate cuisines and categories first
            print("📋 Creating cuisines and categories...")
            cuisines = create_cuisines()
            categories = create_categories(cuisines)
            
            # Generate users
            print("👥 Creating users...")
            customers = create_customers(10)
            chefs = create_chefs(5)
            
            # Generate food items
            print("🍽️ Creating food items...")
            foods = create_food_items(chefs, categories)
            
            # Generate sample orders
            print("📦 Creating sample orders...")
            create_sample_orders(customers, chefs, foods, 20)
        
        print("=" * 60)
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
