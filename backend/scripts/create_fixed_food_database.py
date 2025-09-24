#!/usr/bin/env python3
"""
Complete Sample Food Data Creator with Cloudinary Images (Fixed for actual models)
Creates comprehensive food database with images, prices, reviews, and offers
"""
import os
import sys
import django
from pathlib import Path
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodImage, FoodPrice, FoodReview, Cuisine, FoodCategory, Offer
from apps.authentication.models import User

class FixedFoodDataCreator:
    def __init__(self):
        self.cuisines_data = [
            {'name': 'Italian', 'description': 'Traditional Italian cuisine'},
            {'name': 'Chinese', 'description': 'Authentic Chinese dishes'},
            {'name': 'Mexican', 'description': 'Spicy Mexican flavors'},
            {'name': 'Indian', 'description': 'Rich Indian spices'},
            {'name': 'Japanese', 'description': 'Fresh Japanese cuisine'},
            {'name': 'Thai', 'description': 'Sweet and spicy Thai food'},
            {'name': 'French', 'description': 'Classic French cooking'},
            {'name': 'Korean', 'description': 'Traditional Korean dishes'},
            {'name': 'Greek', 'description': 'Mediterranean Greek food'},
            {'name': 'American', 'description': 'Classic American dishes'},
            {'name': 'Mediterranean', 'description': 'Healthy Mediterranean diet'}
        ]
        
        # Note: FoodCategory has a foreign key to Cuisine, so we'll create them after cuisines
        self.categories_data = [
            {'name': 'Appetizers', 'description': 'Start your meal right'},
            {'name': 'Main Courses', 'description': 'Hearty main dishes'},
            {'name': 'Desserts', 'description': 'Sweet endings'},
            {'name': 'Beverages', 'description': 'Refreshing drinks'},
            {'name': 'Salads', 'description': 'Fresh and healthy'},
            {'name': 'Soups', 'description': 'Warm and comforting'}
        ]
        
        self.foods_data = [
            # Italian foods
            {'name': 'Margherita Pizza', 'cuisine': 'Italian', 'category': 'Main Courses', 
             'description': 'Classic pizza with fresh mozzarella, tomatoes, and basil', 
             'ingredients': ['Pizza dough', 'mozzarella', 'tomatoes', 'basil', 'olive oil'],
             'allergens': ['Gluten', 'Dairy'], 'spice_level': 'mild', 'is_vegetarian': True},
            
            {'name': 'Spaghetti Carbonara', 'cuisine': 'Italian', 'category': 'Main Courses',
             'description': 'Creamy pasta with eggs, cheese, pancetta, and pepper',
             'ingredients': ['Spaghetti', 'eggs', 'pecorino cheese', 'pancetta', 'black pepper'],
             'allergens': ['Gluten', 'Dairy', 'Eggs'], 'spice_level': 'mild', 'is_vegetarian': False},
            
            {'name': 'Tiramisu', 'cuisine': 'Italian', 'category': 'Desserts',
             'description': 'Classic Italian dessert with coffee-soaked ladyfingers',
             'ingredients': ['Ladyfingers', 'coffee', 'mascarpone', 'eggs', 'cocoa powder'],
             'allergens': ['Gluten', 'Dairy', 'Eggs'], 'spice_level': 'mild', 'is_vegetarian': True},
            
            # Chinese foods
            {'name': 'Peking Duck', 'cuisine': 'Chinese', 'category': 'Main Courses',
             'description': 'Crispy duck served with pancakes, spring onions, and hoisin sauce',
             'ingredients': ['Duck', 'pancakes', 'spring onions', 'hoisin sauce', 'cucumber'],
             'allergens': ['Gluten', 'Soy'], 'spice_level': 'mild', 'is_vegetarian': False},
            
            {'name': 'Xiaolongbao', 'cuisine': 'Chinese', 'category': 'Appetizers',
             'description': 'Steamed soup dumplings with pork filling',
             'ingredients': ['Flour', 'pork', 'ginger', 'soy sauce', 'chicken broth'],
             'allergens': ['Gluten', 'Soy'], 'spice_level': 'mild', 'is_vegetarian': False},
            
            {'name': 'Mapo Tofu', 'cuisine': 'Chinese', 'category': 'Main Courses',
             'description': 'Spicy Sichuan tofu in fermented bean sauce',
             'ingredients': ['Tofu', 'ground pork', 'fermented black beans', 'chili oil'],
             'allergens': ['Soy'], 'spice_level': 'hot', 'is_vegetarian': False},
            
            # More foods...
            {'name': 'Butter Chicken', 'cuisine': 'Indian', 'category': 'Main Courses',
             'description': 'Creamy tomato-based chicken curry with aromatic spices',
             'ingredients': ['Chicken', 'tomatoes', 'cream', 'butter', 'garam masala'],
             'allergens': ['Dairy'], 'spice_level': 'medium', 'is_vegetarian': False},
            
            {'name': 'Pad Thai', 'cuisine': 'Thai', 'category': 'Main Courses',
             'description': 'Stir-fried rice noodles with shrimp and vegetables',
             'ingredients': ['Rice noodles', 'shrimp', 'bean sprouts', 'eggs', 'tamarind'],
             'allergens': ['Shellfish', 'Eggs'], 'spice_level': 'medium', 'is_vegetarian': False}
        ]
        
        # High-quality food images from Unsplash
        self.food_images = {
            'pizza': [
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop'
            ],
            'pasta': [
                'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1563379091339-03246963d7d3?w=800&h=600&fit=crop'
            ],
            'tiramisu': [
                'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800&h=600&fit=crop'
            ],
            'duck': [
                'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=800&h=600&fit=crop'
            ],
            'dumplings': [
                'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&h=600&fit=crop'
            ],
            'tofu': [
                'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop'
            ],
            'curry': [
                'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&h=600&fit=crop'
            ],
            'pad_thai': [
                'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=800&h=600&fit=crop'
            ]
        }
    
    def get_images_for_food(self, food_name):
        """Get appropriate images for a food based on its name"""
        food_name_lower = food_name.lower()
        
        if 'pizza' in food_name_lower:
            return self.food_images.get('pizza', [])
        elif 'spaghetti' in food_name_lower or 'carbonara' in food_name_lower:
            return self.food_images.get('pasta', [])
        elif 'tiramisu' in food_name_lower:
            return self.food_images.get('tiramisu', [])
        elif 'duck' in food_name_lower:
            return self.food_images.get('duck', [])
        elif 'xiaolongbao' in food_name_lower:
            return self.food_images.get('dumplings', [])
        elif 'tofu' in food_name_lower:
            return self.food_images.get('tofu', [])
        elif 'chicken' in food_name_lower or 'curry' in food_name_lower:
            return self.food_images.get('curry', [])
        elif 'pad thai' in food_name_lower:
            return self.food_images.get('pad_thai', [])
        else:
            # Return a random image from available ones
            all_images = []
            for imgs in self.food_images.values():
                all_images.extend(imgs)
            return [random.choice(all_images)] if all_images else []
    
    def create_cuisines(self):
        """Create cuisine data"""
        print("🌍 Creating cuisines...")
        created_count = 0
        
        for cuisine_data in self.cuisines_data:
            cuisine, created = Cuisine.objects.get_or_create(
                name=cuisine_data['name'],
                defaults={
                    'description': cuisine_data['description'],
                    'is_active': True,
                    'sort_order': 0
                }
            )
            if created:
                created_count += 1
                print(f"✅ Created cuisine: {cuisine.name}")
        
        return created_count
    
    def create_categories(self):
        """Create category data for each cuisine"""
        print("📂 Creating categories...")
        created_count = 0
        
        cuisines = Cuisine.objects.all()
        
        for cuisine in cuisines:
            for category_data in self.categories_data:
                category, created = FoodCategory.objects.get_or_create(
                    name=category_data['name'],
                    cuisine=cuisine,
                    defaults={
                        'description': category_data['description'],
                        'is_active': True,
                        'sort_order': 0
                    }
                )
                if created:
                    created_count += 1
                    print(f"✅ Created category: {cuisine.name} - {category.name}")
        
        return created_count
    
    def create_sample_user(self):
        """Create or get sample user for food creation"""
        user, created = User.objects.get_or_create(
            username='sample_chef',
            defaults={
                'email': 'chef@example.com',
                'name': 'Sample Chef',
                'role': 'cook',
                'phone_no': '+1234567890',
                'approval_status': 'approved'
            }
        )
        # Set password if user was created
        if created:
            user.set_password('password123')
            user.save()
        return user
    
    def create_foods(self):
        """Create food items"""
        print("🍽️ Creating foods...")
        created_count = 0
        
        sample_user = self.create_sample_user()
        
        for food_data in self.foods_data:
            try:
                cuisine = Cuisine.objects.get(name=food_data['cuisine'])
                # Get a matching category for this cuisine
                category = FoodCategory.objects.filter(
                    cuisine=cuisine, 
                    name=food_data['category']
                ).first()
                
                if not category:
                    print(f"⚠️  No category found for {food_data['name']}")
                    continue
                
                food, created = Food.objects.get_or_create(
                    name=food_data['name'],
                    defaults={
                        'description': food_data['description'],
                        'ingredients': food_data['ingredients'],
                        'allergens': food_data['allergens'],
                        'food_category': category,
                        'chef': sample_user,
                        'spice_level': food_data['spice_level'],
                        'is_vegetarian': food_data['is_vegetarian'],
                        'is_available': True,
                        'preparation_time': random.randint(15, 60),
                        'calories_per_serving': random.randint(200, 800),
                        'status': 'Approved',
                        'rating_average': round(random.uniform(3.5, 5.0), 2),
                        'total_reviews': random.randint(5, 50),
                        'total_orders': random.randint(10, 100)
                    }
                )
                
                if created:
                    created_count += 1
                    print(f"✅ Created food: {food.name}")
                
            except Exception as e:
                print(f"❌ Error creating food {food_data['name']}: {str(e)}")
                continue
        
        return created_count
    
    def create_food_images(self):
        """Create food images with Cloudinary URLs"""
        print("📸 Creating food images...")
        created_count = 0
        
        foods = Food.objects.all()
        
        for food in foods:
            try:
                # Skip if food already has images
                if food.images.exists():
                    continue
                
                image_urls = self.get_images_for_food(food.name)
                
                if not image_urls:
                    print(f"⚠️  No images found for {food.name}")
                    continue
                
                # Add 1-2 images per food
                num_images = min(len(image_urls), random.randint(1, 2))
                selected_images = random.sample(image_urls, num_images) if len(image_urls) > num_images else image_urls
                
                for i, image_url in enumerate(selected_images):
                    FoodImage.objects.create(
                        food=food,
                        image_url=image_url,
                        thumbnail_url=f"{image_url}&w=300&h=200&fit=crop",
                        cloudinary_public_id=f"sample_{food.name.lower().replace(' ', '_')}_{i+1}",
                        caption=f"Delicious {food.name}",
                        is_primary=(i == 0),
                        sort_order=i,
                        alt_text=f"A beautifully prepared {food.name}"
                    )
                
                created_count += len(selected_images)
                print(f"✅ Added {len(selected_images)} images to {food.name}")
                
            except Exception as e:
                print(f"❌ Error creating images for {food.name}: {str(e)}")
                continue
        
        return created_count
    
    def create_food_prices(self):
        """Create price variations for foods"""
        print("💰 Creating food prices...")
        created_count = 0
        
        foods = Food.objects.all()
        sample_cook = self.create_sample_user()  # Same as chef for simplicity
        
        for food in foods:
            try:
                # Skip if food already has prices
                if food.prices.exists():
                    continue
                
                base_price = round(random.uniform(8.99, 25.99), 2)
                
                # Add 2-3 size variations
                size_options = ['Small', 'Medium', 'Large']
                price_multipliers = [0.8, 1.0, 1.3]
                
                for size, multiplier in zip(size_options, price_multipliers):
                    try:
                        price = round(base_price * multiplier, 2)
                        
                        FoodPrice.objects.create(
                            food=food,
                            cook=sample_cook,
                            size=size,
                            price=Decimal(str(price))
                        )
                        created_count += 1
                        
                    except Exception as e:
                        print(f"⚠️  Could not create {size} price for {food.name}: {str(e)}")
                        continue
                
                print(f"✅ Added prices to {food.name}")
                
            except Exception as e:
                print(f"❌ Error creating prices for {food.name}: {str(e)}")
                continue
        
        return created_count
    
    def run(self):
        """Main execution method"""
        print("🍽️ CREATING COMPLETE FOOD DATABASE WITH IMAGES")
        print("=" * 60)
        
        # Create all data
        cuisines_count = self.create_cuisines()
        categories_count = self.create_categories()
        foods_count = self.create_foods()
        images_count = self.create_food_images()
        prices_count = self.create_food_prices()
        
        # Summary
        total_cuisines = Cuisine.objects.count()
        total_categories = FoodCategory.objects.count()
        total_foods = Food.objects.count()
        total_images = FoodImage.objects.count()
        total_prices = FoodPrice.objects.count()
        
        print("\n" + "=" * 60)
        print("🎉 COMPLETE FOOD DATABASE CREATED!")
        print(f"🌍 Cuisines created: {cuisines_count} (Total: {total_cuisines})")
        print(f"📂 Categories created: {categories_count} (Total: {total_categories})")
        print(f"🍽️ Foods created: {foods_count} (Total: {total_foods})")
        print(f"📸 Images created: {images_count} (Total: {total_images})")
        print(f"💰 Prices created: {prices_count} (Total: {total_prices})")
        
        # Show some examples
        print("\n🎯 SAMPLE RESULTS:")
        for food in Food.objects.all()[:5]:
            primary_img = food.images.filter(is_primary=True).first()
            prices = food.prices.all()[:3]
            
            print(f"• {food.name} ({food.food_category.cuisine.name if food.food_category else 'N/A'})")
            if primary_img:
                print(f"  📸 Image: {primary_img.image_url[:50]}...")
            if prices:
                price_list = [f"{p.size}: ${p.price}" for p in prices]
                print(f"  💰 Prices: {', '.join(price_list)}")
        
        print("\n🚀 Database is ready with complete food data and beautiful images!")

if __name__ == '__main__':
    creator = FixedFoodDataCreator()
    creator.run()