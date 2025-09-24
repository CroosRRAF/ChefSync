#!/usr/bin/env python3
"""
Complete any missing food data and add more variety
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
from django.core.files.base import ContentFile
import base64

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.food.models import (
    Cuisine, FoodCategory, Food, FoodImage, 
    FoodPrice, Offer, FoodReview
)

def get_sample_image_base64():
    """Generate a simple colored square image as base64"""
    from PIL import Image
    import io
    
    # Create a simple 200x200 colored image
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
    color = random.choice(colors)
    
    # Create image
    img = Image.new('RGB', (200, 200), color)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def complete_missing_data():
    """Complete any missing prices, images, or other data"""
    print("🔍 Checking for incomplete food data...")
    
    foods = Food.objects.all()
    users = list(User.objects.all())
    customer_users = [u for u in users if u.role in ['Customer', 'customer']]
    
    completed_count = 0
    
    for food in foods:
        print(f"Checking {food.name}...")
        
        # Check if all price sizes exist
        existing_sizes = set(FoodPrice.objects.filter(food=food).values_list('size', flat=True))
        required_sizes = {'Small', 'Medium', 'Large'}
        missing_sizes = required_sizes - existing_sizes
        
        if missing_sizes:
            print(f"  Adding missing prices for sizes: {missing_sizes}")
            base_price = FoodPrice.objects.filter(food=food).first().price if existing_sizes else Decimal('15.99')
            
            for size in missing_sizes:
                # Calculate price based on size
                if size == 'Small':
                    price = base_price * Decimal('0.8')
                elif size == 'Medium':
                    price = base_price
                else:  # Large
                    price = base_price * Decimal('1.3')
                
                food_price = FoodPrice.objects.create(
                    size=size,
                    price=price,
                    food=food,
                    cook=food.chef
                )
                
                # Add some reviews for the new price
                if customer_users:
                    for i in range(random.randint(1, 3)):
                        customer = random.choice(customer_users)
                        # Check if this customer already reviewed this price
                        if not FoodReview.objects.filter(customer=customer, price=food_price).exists():
                            FoodReview.objects.create(
                                rating=random.randint(3, 5),
                                comment=f"Excellent {food.name} in {size.lower()} size!",
                                price=food_price,
                                customer=customer,
                                taste_rating=random.randint(3, 5),
                                presentation_rating=random.randint(3, 5),
                                value_rating=random.randint(3, 5),
                                is_verified_purchase=True,
                                helpful_votes=random.randint(0, 10)
                            )
                            break  # Only one review per price to avoid duplicates
                
                # Maybe add an offer
                if random.choice([True, False]):
                    Offer.objects.create(
                        description=f"Limited time offer on {food.name} ({size})",
                        discount=Decimal(str(random.randint(10, 25))),
                        valid_until=(timezone.now() + timedelta(days=random.randint(7, 60))).date(),
                        price=food_price
                    )
            
            completed_count += 1
        
        # Check if food has images
        if not FoodImage.objects.filter(food=food).exists():
            print(f"  Adding images for {food.name}")
            for i in range(random.randint(1, 2)):
                image_data = get_sample_image_base64()
                # Extract base64 data
                image_data = image_data.split(',')[1]
                image_content = ContentFile(
                    base64.b64decode(image_data),
                    name=f'{food.name.lower().replace(" ", "_")}_{i+1}.png'
                )
                
                FoodImage.objects.create(
                    food=food,
                    image=image_content,
                    caption=f"Delicious {food.name}",
                    is_primary=(i == 0),
                    sort_order=i
                )
    
    return completed_count

def add_more_foods():
    """Add even more diverse food items"""
    print("🍽️ Adding more diverse food items...")
    
    additional_foods = [
        # Korean
        {
            'name': 'Korean BBQ Bulgogi',
            'cuisine': 'Korean',
            'category': 'Main Course',
            'description': 'Marinated beef short ribs grilled to perfection with Korean spices',
            'preparation_time': 25,
            'calories_per_serving': 520,
            'spice_level': 'medium',
            'prices': {'Small': 19.99, 'Medium': 25.99, 'Large': 31.99}
        },
        {
            'name': 'Kimchi Fried Rice',
            'cuisine': 'Korean',
            'category': 'Main Course', 
            'description': 'Spicy fermented cabbage fried rice with vegetables and egg',
            'preparation_time': 15,
            'calories_per_serving': 380,
            'is_vegetarian': True,
            'spice_level': 'hot',
            'prices': {'Small': 12.99, 'Medium': 15.99, 'Large': 18.99}
        },
        
        # Greek
        {
            'name': 'Greek Moussaka',
            'cuisine': 'Greek',
            'category': 'Main Course',
            'description': 'Layered eggplant and meat casserole with béchamel sauce',
            'preparation_time': 90,
            'calories_per_serving': 580,
            'spice_level': 'mild',
            'prices': {'Small': 18.99, 'Medium': 23.99, 'Large': 28.99}
        },
        {
            'name': 'Greek Salad',
            'cuisine': 'Greek', 
            'category': 'Appetizer',
            'description': 'Fresh tomatoes, cucumbers, olives, and feta cheese with olive oil',
            'preparation_time': 10,
            'calories_per_serving': 180,
            'is_vegetarian': True,
            'spice_level': 'mild',
            'prices': {'Small': 9.99, 'Medium': 12.99, 'Large': 15.99}
        },
        
        # Mediterranean
        {
            'name': 'Mediterranean Hummus Platter',
            'cuisine': 'Mediterranean',
            'category': 'Appetizer', 
            'description': 'Creamy hummus served with fresh vegetables and pita bread',
            'preparation_time': 10,
            'calories_per_serving': 220,
            'is_vegetarian': True,
            'is_vegan': True,
            'spice_level': 'mild',
            'prices': {'Small': 8.99, 'Medium': 11.99, 'Large': 14.99}
        },
        
        # American
        {
            'name': 'Classic Burger',
            'cuisine': 'American',
            'category': 'Main Course',
            'description': 'Juicy beef patty with lettuce, tomato, and special sauce',
            'preparation_time': 15,
            'calories_per_serving': 650,
            'spice_level': 'mild',
            'prices': {'Small': 13.99, 'Medium': 17.99, 'Large': 21.99}
        },
        {
            'name': 'BBQ Ribs',
            'cuisine': 'American',
            'category': 'Main Course',
            'description': 'Slow-cooked pork ribs with tangy BBQ sauce',
            'preparation_time': 180,
            'calories_per_serving': 720,
            'spice_level': 'medium',
            'prices': {'Small': 22.99, 'Medium': 28.99, 'Large': 34.99}
        },
        {
            'name': 'New York Cheesecake',
            'cuisine': 'American',
            'category': 'Dessert',
            'description': 'Rich and creamy cheesecake with berry compote',
            'preparation_time': 20,
            'calories_per_serving': 450,
            'is_vegetarian': True,
            'spice_level': None,
            'prices': {'Small': 7.99, 'Medium': 10.99, 'Large': 13.99}
        }
    ]
    
    # Get existing data
    cuisines = list(Cuisine.objects.all())
    categories = list(FoodCategory.objects.all())
    users = list(User.objects.all())
    admin_users = [u for u in users if u.role in ['Admin', 'admin']]
    cook_users = [u for u in users if u.role in ['Cook', 'cook']]
    customer_users = [u for u in users if u.role in ['Customer', 'customer']]
    
    created_count = 0
    
    for food_data in additional_foods:
        try:
            # Check if food already exists
            if Food.objects.filter(name=food_data['name']).exists():
                print(f"⏭️  Skipping {food_data['name']} - already exists")
                continue
            
            # Get or create cuisine
            cuisine = None
            for c in cuisines:
                if c.name.lower() == food_data['cuisine'].lower():
                    cuisine = c
                    break
            
            if not cuisine:
                cuisine = Cuisine.objects.create(
                    name=food_data['cuisine'],
                    description=f"Authentic {food_data['cuisine']} cuisine",
                    is_active=True,
                    sort_order=len(cuisines)
                )
                cuisines.append(cuisine)
                print(f"Created new cuisine: {cuisine.name}")
            
            # Get or create category
            category = None
            for cat in categories:
                if (cat.cuisine == cuisine and 
                    cat.name.lower() == food_data['category'].lower()):
                    category = cat
                    break
            
            if not category:
                category = FoodCategory.objects.create(
                    name=food_data['category'],
                    cuisine=cuisine,
                    description=f"{food_data['category']} dishes from {cuisine.name} cuisine",
                    is_active=True,
                    sort_order=len([c for c in categories if c.cuisine == cuisine])
                )
                categories.append(category)
                print(f"Created new category: {category.name}")
            
            # Create the food item
            chef = random.choice(cook_users)
            admin = random.choice(admin_users)
            
            food = Food.objects.create(
                name=food_data['name'],
                category=food_data['category'],
                description=food_data['description'],
                status='Approved',
                admin=admin,
                chef=chef,
                food_category=category,
                is_available=True,
                is_featured=random.choice([True, False]),
                preparation_time=food_data['preparation_time'],
                calories_per_serving=food_data['calories_per_serving'],
                ingredients=['fresh ingredients', 'spices', 'herbs'],
                allergens=random.choice([[], ['nuts'], ['dairy'], ['gluten']]),
                nutritional_info={
                    'protein': random.randint(15, 35),
                    'carbs': random.randint(20, 60),
                    'fat': random.randint(10, 30),
                    'fiber': random.randint(2, 15)
                },
                is_vegetarian=food_data.get('is_vegetarian', False),
                is_vegan=food_data.get('is_vegan', False),
                is_gluten_free=food_data.get('is_gluten_free', False),
                spice_level=food_data.get('spice_level'),
                rating_average=round(random.uniform(4.0, 5.0), 1),
                total_reviews=random.randint(5, 50),
                total_orders=random.randint(10, 200)
            )
            
            # Create prices for all sizes
            for size, price in food_data['prices'].items():
                food_price = FoodPrice.objects.create(
                    size=size,
                    price=Decimal(str(price)),
                    food=food,
                    cook=chef
                )
                
                # Add reviews (avoiding duplicates)
                reviewed_customers = set()
                for _ in range(random.randint(1, 2)):
                    available_customers = [c for c in customer_users if c.pk not in reviewed_customers]
                    if available_customers:
                        customer = random.choice(available_customers)
                        reviewed_customers.add(customer.pk)
                        FoodReview.objects.create(
                            rating=random.randint(4, 5),
                            comment=f"Amazing {food.name}! The {size.lower()} portion was perfect.",
                            price=food_price,
                            customer=customer,
                            taste_rating=random.randint(4, 5),
                            presentation_rating=random.randint(4, 5),
                            value_rating=random.randint(3, 5),
                            is_verified_purchase=True,
                            helpful_votes=random.randint(0, 15)
                        )
                
                # Add occasional offers
                if random.choice([True, False]):
                    Offer.objects.create(
                        description=f"Special promotion on {food.name} ({size})",
                        discount=Decimal(str(random.randint(15, 35))),
                        valid_until=(timezone.now() + timedelta(days=random.randint(14, 45))).date(),
                        price=food_price
                    )
            
            # Create food images
            for i in range(random.randint(1, 2)):
                image_data = get_sample_image_base64()
                image_data = image_data.split(',')[1]
                image_content = ContentFile(
                    base64.b64decode(image_data),
                    name=f'{food.name.lower().replace(" ", "_")}_{i+1}.png'
                )
                
                FoodImage.objects.create(
                    food=food,
                    image=image_content,
                    caption=f"Delicious {food.name}",
                    is_primary=(i == 0),
                    sort_order=i
                )
            
            print(f"✅ Created food: {food.name} ({food.food_category.cuisine.name})")
            created_count += 1
            
        except Exception as e:
            print(f"❌ Error creating {food_data['name']}: {str(e)}")
            continue
    
    return created_count

def main():
    print("🍽️ Completing and expanding food database...")
    
    # Complete missing data for existing foods
    completed = complete_missing_data()
    
    # Add more diverse foods
    new_foods = add_more_foods()
    
    # Final summary
    print("\n" + "="*50)
    print("🎉 Food Database Enhancement Complete!")
    print(f"✅ Completed missing data for existing foods: {completed}")
    print(f"✅ Added new diverse food items: {new_foods}")
    
    # Show final stats
    print("\nFinal Database Statistics:")
    print(f"- Total Cuisines: {Cuisine.objects.count()}")
    print(f"- Total Categories: {FoodCategory.objects.count()}")
    print(f"- Total Food Items: {Food.objects.count()}")
    print(f"- Total Prices: {FoodPrice.objects.count()}")
    print(f"- Total Reviews: {FoodReview.objects.count()}")
    print(f"- Total Images: {FoodImage.objects.count()}")
    print(f"- Total Offers: {Offer.objects.count()}")

if __name__ == '__main__':
    main()