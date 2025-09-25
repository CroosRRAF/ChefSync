#!/usr/bin/env python3
"""
Add new sample food data to all related tables
This script adds 20 new comprehensive food items with all related data
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
import base64

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from apps.authentication.models import User
from apps.food.models import (
    Cuisine, FoodCategory, Food, FoodImage, 
    FoodPrice, Offer, FoodReview
)

class NewSampleFoodCreator:
    def __init__(self):
        self.created_foods = []
        
    def get_sample_image_base64(self):
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

    def create_sample_users(self):
        """Create sample users if they don't exist"""
        admin_users = User.objects.filter(role__in=['Admin', 'admin']).count()
        cook_users = User.objects.filter(role__in=['Cook', 'cook']).count() 
        customer_users = User.objects.filter(role__in=['Customer', 'customer']).count()
        
        # Create cook users if none exist
        if cook_users == 0:
            print("Creating sample cook users...")
            cook_names = ['chef_mario', 'chef_wang', 'chef_jose', 'chef_raj', 'chef_yuki']
            for i, name in enumerate(cook_names):
                User.objects.create_user(
                    username=name,
                    email=f'{name}@chefsync.com',
                    password='password123',
                    role='Cook',
                    first_name=name.split('_')[1].title(),
                    last_name='Chef',
                    is_active=True
                )
                print(f"Created cook: {name}")
        
        # Create customer users if none exist  
        if customer_users == 0:
            print("Creating sample customer users...")
            customer_names = ['john_doe', 'jane_smith', 'mike_johnson', 'sarah_wilson', 'david_brown']
            for i, name in enumerate(customer_names):
                names = name.split('_')
                User.objects.create_user(
                    username=name,
                    email=f'{name}@example.com',
                    password='password123', 
                    role='Customer',
                    first_name=names[0].title(),
                    last_name=names[1].title(),
                    is_active=True
                )
                print(f"Created customer: {name}")

    def run(self):
        """Main execution method"""
        print("🍽️  Adding new sample food data...")
        
        # First ensure we have the necessary users
        self.create_sample_users()
        
        # New comprehensive food data with varied cuisines and categories
        new_food_data = [
            # Italian Cuisine
            {
                'name': 'Truffle Risotto',
                'cuisine': 'Italian',
                'category': 'Main Course',
                'description': 'Creamy Arborio rice cooked with white wine and topped with black truffle shavings',
                'preparation_time': 35,
                'calories_per_serving': 520,
                'ingredients': ['arborio rice', 'white wine', 'parmesan', 'black truffle', 'onion', 'vegetable stock'],
                'allergens': ['dairy', 'alcohol'],
                'is_vegetarian': True,
                'spice_level': 'mild',
                'prices': {'Small': 24.99, 'Medium': 32.99, 'Large': 39.99}
            },
            {
                'name': 'Osso Buco',
                'cuisine': 'Italian',
                'category': 'Main Course', 
                'description': 'Braised veal shanks with vegetables, white wine and broth',
                'preparation_time': 180,
                'calories_per_serving': 680,
                'ingredients': ['veal shanks', 'carrots', 'celery', 'onion', 'white wine', 'tomatoes'],
                'allergens': ['alcohol'],
                'spice_level': 'mild',
                'prices': {'Small': 28.99, 'Medium': 36.99, 'Large': 44.99}
            },
            {
                'name': 'Panna Cotta',
                'cuisine': 'Italian',
                'category': 'Dessert',
                'description': 'Silky smooth vanilla custard topped with berry compote',
                'preparation_time': 20,
                'calories_per_serving': 280,
                'ingredients': ['heavy cream', 'vanilla', 'gelatin', 'sugar', 'berries'],
                'allergens': ['dairy'],
                'is_vegetarian': True,
                'spice_level': None,
                'prices': {'Small': 7.99, 'Medium': 9.99, 'Large': 12.99}
            },
            
            # Chinese Cuisine
            {
                'name': 'Peking Duck',
                'cuisine': 'Chinese',
                'category': 'Main Course',
                'description': 'Crispy roasted duck served with pancakes, scallions, and hoisin sauce',
                'preparation_time': 240,
                'calories_per_serving': 590,
                'ingredients': ['whole duck', 'five-spice', 'hoisin sauce', 'scallions', 'pancakes'],
                'allergens': ['gluten'],
                'spice_level': 'medium',
                'prices': {'Small': 32.99, 'Medium': 45.99, 'Large': 58.99}
            },
            {
                'name': 'Mapo Tofu',
                'cuisine': 'Chinese',
                'category': 'Main Course',
                'description': 'Spicy Sichuan tofu in fermented bean and chili oil sauce',
                'preparation_time': 25,
                'calories_per_serving': 320,
                'ingredients': ['silken tofu', 'ground pork', 'doubanjiang', 'sichuan peppercorns', 'scallions'],
                'allergens': ['soy'],
                'spice_level': 'very_hot',
                'prices': {'Small': 13.99, 'Medium': 17.99, 'Large': 21.99}
            },
            {
                'name': 'Xiaolongbao',
                'cuisine': 'Chinese',
                'category': 'Appetizer',
                'description': 'Steamed pork soup dumplings with thin delicate wrapper',
                'preparation_time': 45,
                'calories_per_serving': 380,
                'ingredients': ['pork filling', 'pork gelatin', 'dumpling wrapper', 'ginger', 'soy sauce'],
                'allergens': ['gluten', 'soy'],
                'spice_level': 'mild',
                'prices': {'Small': 12.99, 'Medium': 16.99, 'Large': 20.99}
            },
            
            # Mexican Cuisine
            {
                'name': 'Mole Poblano',
                'cuisine': 'Mexican',
                'category': 'Main Course',
                'description': 'Traditional chicken in complex chocolate and chili sauce with over 20 ingredients',
                'preparation_time': 180,
                'calories_per_serving': 620,
                'ingredients': ['chicken', 'various chilies', 'chocolate', 'nuts', 'spices', 'tomatoes'],
                'allergens': ['nuts'],
                'spice_level': 'medium',
                'prices': {'Small': 19.99, 'Medium': 25.99, 'Large': 31.99}
            },
            {
                'name': 'Ceviche',
                'cuisine': 'Mexican',
                'category': 'Appetizer',
                'description': 'Fresh fish marinated in citrus juice with onion, cilantro, and jalapeño',
                'preparation_time': 30,
                'calories_per_serving': 180,
                'ingredients': ['fresh fish', 'lime juice', 'red onion', 'cilantro', 'jalapeño', 'tomato'],
                'allergens': ['fish'],
                'spice_level': 'medium',
                'prices': {'Small': 14.99, 'Medium': 18.99, 'Large': 23.99}
            },
            {
                'name': 'Churros',
                'cuisine': 'Mexican',
                'category': 'Dessert',
                'description': 'Fried dough pastry rolled in cinnamon sugar, served with chocolate dipping sauce',
                'preparation_time': 20,
                'calories_per_serving': 340,
                'ingredients': ['flour', 'sugar', 'cinnamon', 'chocolate', 'oil'],
                'allergens': ['gluten', 'dairy'],
                'is_vegetarian': True,
                'spice_level': None,
                'prices': {'Small': 6.99, 'Medium': 8.99, 'Large': 11.99}
            },
            
            # Indian Cuisine
            {
                'name': 'Lamb Vindaloo',
                'cuisine': 'Indian',
                'category': 'Main Course',
                'description': 'Fiery Goan curry with tender lamb in vinegar and spice marinade',
                'preparation_time': 120,
                'calories_per_serving': 580,
                'ingredients': ['lamb', 'vinegar', 'red chilies', 'garlic', 'ginger', 'spices'],
                'allergens': [],
                'spice_level': 'very_hot',
                'prices': {'Small': 21.99, 'Medium': 27.99, 'Large': 33.99}
            },
            {
                'name': 'Palak Paneer',
                'cuisine': 'Indian',
                'category': 'Main Course',
                'description': 'Homemade cheese cubes in creamy spiced spinach gravy',
                'preparation_time': 30,
                'calories_per_serving': 420,
                'ingredients': ['paneer', 'spinach', 'cream', 'tomatoes', 'garam masala', 'ginger-garlic'],
                'allergens': ['dairy'],
                'is_vegetarian': True,
                'spice_level': 'medium',
                'prices': {'Small': 16.99, 'Medium': 20.99, 'Large': 24.99}
            },
            {
                'name': 'Masala Dosa',
                'cuisine': 'Indian',
                'category': 'Main Course',
                'description': 'Crispy fermented crepe filled with spiced potato curry, served with chutneys',
                'preparation_time': 25,
                'calories_per_serving': 350,
                'ingredients': ['rice batter', 'urad dal', 'potatoes', 'mustard seeds', 'curry leaves', 'turmeric'],
                'allergens': [],
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'medium',
                'prices': {'Small': 11.99, 'Medium': 14.99, 'Large': 17.99}
            },
            
            # Japanese Cuisine
            {
                'name': 'Chirashi Bowl',
                'cuisine': 'Japanese',
                'category': 'Main Course',
                'description': 'Assorted sashimi over seasoned sushi rice with wasabi and pickled ginger',
                'preparation_time': 20,
                'calories_per_serving': 480,
                'ingredients': ['sushi rice', 'assorted fish', 'nori', 'wasabi', 'pickled ginger', 'soy sauce'],
                'allergens': ['fish', 'soy'],
                'spice_level': 'mild',
                'prices': {'Small': 22.99, 'Medium': 28.99, 'Large': 34.99}
            },
            {
                'name': 'Ramen Tonkotsu',
                'cuisine': 'Japanese',
                'category': 'Main Course',
                'description': 'Rich pork bone broth ramen with chashu pork, soft-boiled egg, and nori',
                'preparation_time': 15,
                'calories_per_serving': 650,
                'ingredients': ['ramen noodles', 'pork broth', 'chashu pork', 'soft-boiled egg', 'nori', 'scallions'],
                'allergens': ['gluten', 'eggs', 'soy'],
                'spice_level': 'mild',
                'prices': {'Small': 16.99, 'Medium': 19.99, 'Large': 23.99}
            },
            {
                'name': 'Mochi Ice Cream',
                'cuisine': 'Japanese',
                'category': 'Dessert',
                'description': 'Sweet rice dough wrapped around premium ice cream in various flavors',
                'preparation_time': 10,
                'calories_per_serving': 120,
                'ingredients': ['glutinous rice flour', 'ice cream', 'sugar', 'food coloring'],
                'allergens': ['dairy'],
                'is_vegetarian': True,
                'spice_level': None,
                'prices': {'Small': 5.99, 'Medium': 8.99, 'Large': 12.99}
            },
            
            # Thai Cuisine
            {
                'name': 'Pad Thai',
                'cuisine': 'Thai',
                'category': 'Main Course',
                'description': 'Stir-fried rice noodles with shrimp, tofu, bean sprouts, and tamarind sauce',
                'preparation_time': 15,
                'calories_per_serving': 540,
                'ingredients': ['rice noodles', 'shrimp', 'tofu', 'bean sprouts', 'tamarind', 'fish sauce'],
                'allergens': ['shellfish', 'soy', 'fish'],
                'spice_level': 'medium',
                'prices': {'Small': 14.99, 'Medium': 18.99, 'Large': 22.99}
            },
            {
                'name': 'Green Curry',
                'cuisine': 'Thai',
                'category': 'Main Course',
                'description': 'Spicy coconut curry with chicken, Thai basil, and vegetables',
                'preparation_time': 25,
                'calories_per_serving': 490,
                'ingredients': ['green curry paste', 'coconut milk', 'chicken', 'thai basil', 'eggplant', 'fish sauce'],
                'allergens': ['fish'],
                'spice_level': 'hot',
                'prices': {'Small': 16.99, 'Medium': 20.99, 'Large': 24.99}
            },
            {
                'name': 'Mango Sticky Rice',
                'cuisine': 'Thai',
                'category': 'Dessert',
                'description': 'Sweet coconut sticky rice topped with fresh mango slices',
                'preparation_time': 15,
                'calories_per_serving': 380,
                'ingredients': ['glutinous rice', 'coconut milk', 'palm sugar', 'fresh mango', 'salt'],
                'allergens': [],
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': None,
                'prices': {'Small': 7.99, 'Medium': 9.99, 'Large': 12.99}
            },
            
            # French Cuisine
            {
                'name': 'Coq au Vin',
                'cuisine': 'French',
                'category': 'Main Course',
                'description': 'Braised chicken in red wine with mushrooms, pearl onions, and bacon',
                'preparation_time': 90,
                'calories_per_serving': 620,
                'ingredients': ['chicken', 'red wine', 'mushrooms', 'pearl onions', 'bacon', 'thyme'],
                'allergens': ['alcohol'],
                'spice_level': 'mild',
                'prices': {'Small': 26.99, 'Medium': 33.99, 'Large': 40.99}
            },
            {
                'name': 'Crème Brûlée',
                'cuisine': 'French',
                'category': 'Dessert',
                'description': 'Rich vanilla custard topped with a layer of caramelized sugar',
                'preparation_time': 25,
                'calories_per_serving': 320,
                'ingredients': ['heavy cream', 'vanilla beans', 'egg yolks', 'sugar'],
                'allergens': ['dairy', 'eggs'],
                'is_vegetarian': True,
                'spice_level': None,
                'prices': {'Small': 8.99, 'Medium': 11.99, 'Large': 14.99}
            }
        ]
        
        # Get existing data
        cuisines = list(Cuisine.objects.all())
        categories = list(FoodCategory.objects.all())
        users = list(User.objects.all())
        admin_users = [u for u in users if u.role in ['Admin', 'admin']]
        cook_users = [u for u in users if u.role in ['Cook', 'cook']]
        customer_users = [u for u in users if u.role in ['Customer', 'customer']]
        
        if not admin_users or not cook_users:
            print("❌ Error: Need at least one admin and one cook user")
            return
        
        created_count = 0
        
        for food_data in new_food_data:
            try:
                # Get or create cuisine
                cuisine = None
                for c in cuisines:
                    if c.name.lower() == food_data['cuisine'].lower():
                        cuisine = c
                        break
                
                if not cuisine:
                    # Create new cuisine if it doesn't exist
                    cuisine = Cuisine.objects.create(
                        name=food_data['cuisine'],
                        description=f"Authentic {food_data['cuisine']} cuisine",
                        is_active=True,
                        sort_order=len(cuisines)
                    )
                    cuisines.append(cuisine)
                    print(f"Created new cuisine: {cuisine.name}")
                
                # Get or create food category
                category = None
                for cat in categories:
                    if (cat.cuisine == cuisine and 
                        cat.name.lower() == food_data['category'].lower()):
                        category = cat
                        break
                
                if not category:
                    # Create new category if it doesn't exist
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
                    ingredients=food_data['ingredients'],
                    allergens=food_data.get('allergens', []),
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
                
                self.created_foods.append(food)
                
                # Create food prices for all sizes
                for size, price in food_data['prices'].items():
                    food_price = FoodPrice.objects.create(
                        size=size,
                        price=Decimal(str(price)),
                        food=food,
                        cook=chef
                    )
                    
                    # Add some reviews for each price (avoid duplicates)
                    reviewed_customers = set()
                    for _ in range(random.randint(1, 3)):
                        if customer_users:
                            available_customers = [c for c in customer_users if c.id not in reviewed_customers]
                            if available_customers:
                                customer = random.choice(available_customers)
                                reviewed_customers.add(customer.id)
                                FoodReview.objects.create(
                                    rating=random.randint(3, 5),
                                    comment=f"Great {food.name}! Really enjoyed the {size.lower()} portion.",
                                    price=food_price,
                                    customer=customer,
                                    taste_rating=random.randint(3, 5),
                                    presentation_rating=random.randint(3, 5),
                                    value_rating=random.randint(3, 5),
                                    is_verified_purchase=True,
                                    helpful_votes=random.randint(0, 10)
                                )
                    
                    # Add some offers occasionally
                    if random.choice([True, False]):
                        Offer.objects.create(
                            description=f"Special discount on {food.name} ({size})",
                            discount=Decimal(str(random.randint(10, 30))),
                            valid_until=(timezone.now() + timedelta(days=30)).date(),
                            price=food_price
                        )
                
                # Create food images
                # Create sample images using Cloudinary URLs
                for i in range(random.randint(1, 3)):
                    # Generate a Cloudinary placeholder URL for the food
                    food_name_clean = food.name.lower().replace(" ", "_").replace("'", "")
                    color_variations = ['c_fill,co_rgb:ff6b4a', 'c_fill,co_rgb:4ecdc4', 'c_fill,co_rgb:45b7d1', 'c_fill,co_rgb:96ceb4']
                    color = random.choice(color_variations)
                    
                    image_url = f"https://res.cloudinary.com/demo/image/upload/{color},w_400,h_300,g_center/l_text:Arial_40:{food_name_clean}/fl_layer_apply,co_white,g_center/sample.jpg"
                    
                    FoodImage.objects.create(
                        food=food,
                        image_url=image_url,
                        thumbnail_url=f"https://res.cloudinary.com/demo/image/upload/{color},w_200,h_150,g_center/l_text:Arial_20:{food_name_clean}/fl_layer_apply,co_white,g_center/sample.jpg",
                        cloudinary_public_id=f"sample_{food_name_clean}_{i+1}",
                        caption=f"Delicious {food.name}",
                        is_primary=(i == 0),
                        sort_order=i
                    )
                
                print(f"✅ Created food: {food.name} ({food.food_category.cuisine.name})")
                created_count += 1
                
            except Exception as e:
                print(f"❌ Error creating {food_data['name']}: {str(e)}")
                continue
        
        print(f"\n🎉 Successfully created {created_count} new food items with all related data!")
        print("\nSummary:")
        print(f"- Foods created: {created_count}")
        print(f"- Food prices created: {created_count * 3}")  # 3 sizes each
        print(f"- Food reviews created: ~{created_count * 9}")  # ~3 reviews per size
        print(f"- Food images created: ~{created_count * 2}")  # ~2 images each
        print(f"- Offers created: ~{created_count * 1.5}")  # ~50% have offers

if __name__ == '__main__':
    creator = NewSampleFoodCreator()
    creator.run()