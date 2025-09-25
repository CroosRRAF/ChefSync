#!/usr/bin/env python3
"""
Complete Sample Food Data Creator with Cloudinary Images
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

class CompleteFoodDataCreator:
    def __init__(self):
        self.cuisines_data = [
            {'name': 'Italian', 'description': 'Traditional Italian cuisine', 'is_popular': True},
            {'name': 'Chinese', 'description': 'Authentic Chinese dishes', 'is_popular': True},
            {'name': 'Mexican', 'description': 'Spicy Mexican flavors', 'is_popular': True},
            {'name': 'Indian', 'description': 'Rich Indian spices', 'is_popular': True},
            {'name': 'Japanese', 'description': 'Fresh Japanese cuisine', 'is_popular': True},
            {'name': 'Thai', 'description': 'Sweet and spicy Thai food', 'is_popular': True},
            {'name': 'French', 'description': 'Classic French cooking', 'is_popular': False},
            {'name': 'Korean', 'description': 'Traditional Korean dishes', 'is_popular': False},
            {'name': 'Greek', 'description': 'Mediterranean Greek food', 'is_popular': False},
            {'name': 'American', 'description': 'Classic American dishes', 'is_popular': True},
            {'name': 'Mediterranean', 'description': 'Healthy Mediterranean diet', 'is_popular': False}
        ]
        
        self.categories_data = [
            {'name': 'Appetizers', 'description': 'Start your meal right'},
            {'name': 'Main Courses', 'description': 'Hearty main dishes'},
            {'name': 'Desserts', 'description': 'Sweet endings'},
            {'name': 'Beverages', 'description': 'Refreshing drinks'},
            {'name': 'Salads', 'description': 'Fresh and healthy'},
            {'name': 'Soups', 'description': 'Warm and comforting'},
            {'name': 'Seafood', 'description': 'Fresh from the sea'},
            {'name': 'Vegetarian', 'description': 'Plant-based options'},
            {'name': 'Vegan', 'description': 'Completely plant-based'}
        ]
        
        self.foods_data = [
            # Italian
            {'name': 'Margherita Pizza', 'cuisine': 'Italian', 'category': 'Main Courses', 
             'description': 'Classic pizza with fresh mozzarella, tomatoes, and basil', 
             'ingredients': 'Pizza dough, mozzarella, tomatoes, basil, olive oil',
             'allergens': 'Gluten, Dairy', 'spice_level': 'Mild', 'is_vegetarian': True},
            
            {'name': 'Spaghetti Carbonara', 'cuisine': 'Italian', 'category': 'Main Courses',
             'description': 'Creamy pasta with eggs, cheese, pancetta, and pepper',
             'ingredients': 'Spaghetti, eggs, pecorino cheese, pancetta, black pepper',
             'allergens': 'Gluten, Dairy, Eggs', 'spice_level': 'Mild', 'is_vegetarian': False},
            
            {'name': 'Tiramisu', 'cuisine': 'Italian', 'category': 'Desserts',
             'description': 'Classic Italian dessert with coffee-soaked ladyfingers',
             'ingredients': 'Ladyfingers, coffee, mascarpone, eggs, cocoa powder',
             'allergens': 'Gluten, Dairy, Eggs', 'spice_level': 'None', 'is_vegetarian': True},
            
            # Chinese
            {'name': 'Peking Duck', 'cuisine': 'Chinese', 'category': 'Main Courses',
             'description': 'Crispy duck served with pancakes, spring onions, and hoisin sauce',
             'ingredients': 'Duck, pancakes, spring onions, hoisin sauce, cucumber',
             'allergens': 'Gluten, Soy', 'spice_level': 'Mild', 'is_vegetarian': False},
            
            {'name': 'Xiaolongbao', 'cuisine': 'Chinese', 'category': 'Appetizers',
             'description': 'Steamed soup dumplings with pork filling',
             'ingredients': 'Flour, pork, ginger, soy sauce, chicken broth',
             'allergens': 'Gluten, Soy', 'spice_level': 'Mild', 'is_vegetarian': False},
            
            {'name': 'Mapo Tofu', 'cuisine': 'Chinese', 'category': 'Main Courses',
             'description': 'Spicy Sichuan tofu in fermented bean sauce',
             'ingredients': 'Tofu, ground pork, fermented black beans, chili oil',
             'allergens': 'Soy', 'spice_level': 'Hot', 'is_vegetarian': False},
            
            # Mexican
            {'name': 'Tacos al Pastor', 'cuisine': 'Mexican', 'category': 'Main Courses',
             'description': 'Marinated pork tacos with pineapple and cilantro',
             'ingredients': 'Pork, corn tortillas, pineapple, onions, cilantro',
             'allergens': 'None', 'spice_level': 'Medium', 'is_vegetarian': False},
            
            {'name': 'Ceviche', 'cuisine': 'Mexican', 'category': 'Appetizers',
             'description': 'Fresh fish cured in citrus juices with vegetables',
             'ingredients': 'White fish, lime juice, onions, tomatoes, cilantro',
             'allergens': 'Fish', 'spice_level': 'Mild', 'is_vegetarian': False},
            
            # Indian
            {'name': 'Butter Chicken', 'cuisine': 'Indian', 'category': 'Main Courses',
             'description': 'Creamy tomato-based chicken curry with aromatic spices',
             'ingredients': 'Chicken, tomatoes, cream, butter, garam masala',
             'allergens': 'Dairy', 'spice_level': 'Medium', 'is_vegetarian': False},
            
            {'name': 'Vegetable Biryani', 'cuisine': 'Indian', 'category': 'Main Courses',
             'description': 'Fragrant basmati rice with mixed vegetables and spices',
             'ingredients': 'Basmati rice, mixed vegetables, saffron, yogurt, spices',
             'allergens': 'Dairy', 'spice_level': 'Medium', 'is_vegetarian': True},
            
            # Japanese
            {'name': 'Chirashi Bowl', 'cuisine': 'Japanese', 'category': 'Main Courses',
             'description': 'Fresh sashimi over seasoned sushi rice',
             'ingredients': 'Sushi rice, assorted fish, nori, wasabi, soy sauce',
             'allergens': 'Fish, Soy', 'spice_level': 'Mild', 'is_vegetarian': False},
            
            {'name': 'Ramen', 'cuisine': 'Japanese', 'category': 'Soups',
             'description': 'Rich broth with noodles, pork, and vegetables',
             'ingredients': 'Ramen noodles, pork broth, chashu pork, green onions',
             'allergens': 'Gluten, Soy, Eggs', 'spice_level': 'Mild', 'is_vegetarian': False},
            
            # Thai
            {'name': 'Pad Thai', 'cuisine': 'Thai', 'category': 'Main Courses',
             'description': 'Stir-fried rice noodles with shrimp and vegetables',
             'ingredients': 'Rice noodles, shrimp, bean sprouts, eggs, tamarind',
             'allergens': 'Shellfish, Eggs', 'spice_level': 'Medium', 'is_vegetarian': False},
            
            {'name': 'Green Curry', 'cuisine': 'Thai', 'category': 'Main Courses',
             'description': 'Spicy coconut curry with chicken and vegetables',
             'ingredients': 'Chicken, coconut milk, green curry paste, thai basil',
             'allergens': 'None', 'spice_level': 'Hot', 'is_vegetarian': False}
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
                'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1518047601542-79f18c655718?w=800&h=600&fit=crop'
            ],
            'duck': [
                'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1565299634757-75dd29a60dc4?w=800&h=600&fit=crop'
            ],
            'dumplings': [
                'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop'
            ],
            'tofu': [
                'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571197707303-bacdce64bc7c?w=800&h=600&fit=crop'
            ],
            'tacos': [
                'https://images.unsplash.com/photo-1565299585323-38174c0ac3d5?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop'
            ],
            'ceviche': [
                'https://images.unsplash.com/photo-1534482421815-d4236d9bbb5b?w=800&h=600&fit=crop'
            ],
            'curry': [
                'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop'
            ],
            'biryani': [
                'https://images.unsplash.com/photo-1563379091339-03246963d7d3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571407982449-05c6c44b3a3e?w=800&h=600&fit=crop'
            ],
            'sushi': [
                'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800&h=600&fit=crop'
            ],
            'ramen': [
                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop'
            ],
            'pad_thai': [
                'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1582169296194-339515ba95b8?w=800&h=600&fit=crop'
            ],
            'green_curry': [
                'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop'
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
        elif 'tacos' in food_name_lower:
            return self.food_images.get('tacos', [])
        elif 'ceviche' in food_name_lower:
            return self.food_images.get('ceviche', [])
        elif 'butter chicken' in food_name_lower:
            return self.food_images.get('curry', [])
        elif 'biryani' in food_name_lower:
            return self.food_images.get('biryani', [])
        elif 'chirashi' in food_name_lower:
            return self.food_images.get('sushi', [])
        elif 'ramen' in food_name_lower:
            return self.food_images.get('ramen', [])
        elif 'pad thai' in food_name_lower:
            return self.food_images.get('pad_thai', [])
        elif 'green curry' in food_name_lower:
            return self.food_images.get('green_curry', [])
        else:
            # Return a random image
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
                defaults=cuisine_data
            )
            if created:
                created_count += 1
                print(f"✅ Created cuisine: {cuisine.name}")
        
        return created_count
    
    def create_categories(self):
        """Create category data"""
        print("📂 Creating categories...")
        created_count = 0
        
        for category_data in self.categories_data:
            category, created = FoodCategory.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            if created:
                created_count += 1
                print(f"✅ Created category: {category.name}")
        
        return created_count
    
    def create_foods(self):
        """Create food items"""
        print("🍽️ Creating foods...")
        created_count = 0
        
        for food_data in self.foods_data:
            try:
                cuisine = Cuisine.objects.get(name=food_data['cuisine'])
                category = FoodCategory.objects.get(name=food_data['category'])
                
                food, created = Food.objects.get_or_create(
                    name=food_data['name'],
                    defaults={
                        'description': food_data['description'],
                        'ingredients': food_data['ingredients'],
                        'allergens': food_data['allergens'],
                        'cuisine': cuisine,
                        'category': category,
                        'spice_level': food_data['spice_level'],
                        'is_vegetarian': food_data['is_vegetarian'],
                        'is_available': True,
                        'preparation_time': random.randint(15, 60),
                        'serving_size': random.choice([1, 2, 3, 4]),
                        'calories': random.randint(200, 800),
                        'protein': random.randint(10, 50),
                        'carbs': random.randint(20, 100),
                        'fat': random.randint(5, 30),
                        'rating': round(random.uniform(3.5, 5.0), 1)
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
                        alt_text=f"A beautifully prepared {food.name}",
                        is_primary=(i == 0),
                        sort_order=i
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
        size_options = [
            ('Small', 0.8), ('Regular', 1.0), ('Large', 1.3), ('Extra Large', 1.6)
        ]
        
        for food in foods:
            try:
                # Skip if food already has prices
                if food.prices.exists():
                    continue
                
                base_price = Decimal(str(random.uniform(8.99, 25.99)))
                
                # Add 2-3 size variations
                num_sizes = random.randint(2, 3)
                selected_sizes = random.sample(size_options, num_sizes)
                
                for size_name, multiplier in selected_sizes:
                    price = base_price * Decimal(str(multiplier))
                    
                    FoodPrice.objects.create(
                        food=food,
                        size=size_name,
                        price=round(price, 2),
                        is_default=(size_name == 'Regular')
                    )
                    created_count += 1
                
                print(f"✅ Added {num_sizes} prices to {food.name}")
                
            except Exception as e:
                print(f"❌ Error creating prices for {food.name}: {str(e)}")
                continue
        
        return created_count
    
    def create_sample_user(self):
        """Create a sample user for reviews"""
        user, created = User.objects.get_or_create(
            username='sample_reviewer',
            defaults={
                'email': 'reviewer@example.com',
                'first_name': 'Sample',
                'last_name': 'Reviewer',
                'role': 'customer',
                'phone': '+1234567890'
            }
        )
        return user
    
    def create_food_reviews(self):
        """Create sample reviews for foods"""
        print("⭐ Creating food reviews...")
        created_count = 0
        
        # Get or create sample user
        user = self.create_sample_user()
        
        foods = Food.objects.all()
        review_comments = [
            "Absolutely delicious! Will order again.",
            "Great taste and fresh ingredients.",
            "Perfect portion size and amazing flavors.",
            "Excellent quality and quick delivery.",
            "One of my favorite dishes here!",
            "Fresh, flavorful, and beautifully presented.",
            "Great value for money.",
            "Highly recommend this dish!",
            "Authentic taste and great preparation.",
            "Amazing food, exceeded expectations!"
        ]
        
        for food in foods:
            try:
                # Skip if food already has reviews
                if food.reviews.exists():
                    continue
                
                # Add 2-4 reviews per food
                num_reviews = random.randint(2, 4)
                
                for _ in range(num_reviews):
                    rating = random.randint(4, 5)  # Only good ratings for sample data
                    comment = random.choice(review_comments)
                    
                    FoodReview.objects.create(
                        food=food,
                        user=user,
                        rating=rating,
                        comment=comment,
                        created_at=datetime.now() - timedelta(days=random.randint(1, 30))
                    )
                    created_count += 1
                
                print(f"✅ Added {num_reviews} reviews to {food.name}")
                
            except Exception as e:
                print(f"❌ Error creating reviews for {food.name}: {str(e)}")
                continue
        
        return created_count
    
    def create_offers(self):
        """Create sample offers"""
        print("🎯 Creating offers...")
        created_count = 0
        
        offers_data = [
            {
                'title': 'Weekend Special',
                'description': '20% off on all orders above $30',
                'discount_percentage': 20,
                'min_order_amount': Decimal('30.00'),
                'is_active': True
            },
            {
                'title': 'First Time Customer',
                'description': '15% off on your first order',
                'discount_percentage': 15,
                'min_order_amount': Decimal('20.00'),
                'is_active': True
            },
            {
                'title': 'Lunch Deal',
                'description': 'Buy 2 main courses, get 1 free dessert',
                'discount_percentage': 10,
                'min_order_amount': Decimal('25.00'),
                'is_active': True
            }
        ]
        
        for offer_data in offers_data:
            try:
                offer, created = Offer.objects.get_or_create(
                    title=offer_data['title'],
                    defaults={
                        **offer_data,
                        'start_date': datetime.now().date(),
                        'end_date': (datetime.now() + timedelta(days=30)).date(),
                        'usage_limit': random.randint(50, 200),
                        'usage_count': random.randint(0, 10)
                    }
                )
                
                if created:
                    created_count += 1
                    print(f"✅ Created offer: {offer.title}")
                
            except Exception as e:
                print(f"❌ Error creating offer {offer_data['title']}: {str(e)}")
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
        reviews_count = self.create_food_reviews()
        offers_count = self.create_offers()
        
        # Summary
        total_foods = Food.objects.count()
        total_images = FoodImage.objects.count()
        total_prices = FoodPrice.objects.count()
        total_reviews = FoodReview.objects.count()
        total_offers = Offer.objects.count()
        
        print("\n" + "=" * 60)
        print("🎉 COMPLETE FOOD DATABASE CREATED!")
        print(f"🌍 Cuisines created: {cuisines_count}")
        print(f"📂 Categories created: {categories_count}")
        print(f"🍽️ Foods created: {foods_count}")
        print(f"📸 Images created: {images_count}")
        print(f"💰 Prices created: {prices_count}")
        print(f"⭐ Reviews created: {reviews_count}")
        print(f"🎯 Offers created: {offers_count}")
        print("\n📊 TOTAL DATABASE SUMMARY:")
        print(f"• Total Foods: {total_foods}")
        print(f"• Total Images: {total_images}")
        print(f"• Total Prices: {total_prices}")
        print(f"• Total Reviews: {total_reviews}")
        print(f"• Total Offers: {total_offers}")
        
        # Show some examples
        print("\n🎯 SAMPLE RESULTS:")
        for food in Food.objects.all()[:5]:
            primary_img = food.images.filter(is_primary=True).first()
            default_price = food.prices.filter(is_default=True).first()
            avg_rating = food.reviews.all().first()
            
            print(f"• {food.name} ({food.cuisine.name})")
            if primary_img:
                print(f"  📸 Image: {primary_img.image_url[:50]}...")
            if default_price:
                print(f"  💰 Price: ${default_price.price}")
            if avg_rating:
                print(f"  ⭐ Rating: {avg_rating.rating}/5")
        
        print("\n🚀 Database is ready with complete food data and beautiful images!")

if __name__ == '__main__':
    creator = CompleteFoodDataCreator()
    creator.run()