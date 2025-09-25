#!/usr/bin/env python3
"""
Create sample food data with Cloudinary-based images
This script adds realistic food images to existing food items
"""
import os
import sys
import django
from pathlib import Path
import random

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodImage

class SampleFoodImageCreator:
    def __init__(self):
        # High-quality food images from Unsplash (public domain)
        self.food_images = {
            # Italian
            'pizza': [
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571407982449-05c6c44b3a3e?w=800&h=600&fit=crop'
            ],
            'pasta': [
                'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1563379091339-03246963d7d3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&h=600&fit=crop'
            ],
            'risotto': [
                'https://images.unsplash.com/photo-1567429816459-ca4c8f8e5004?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1580959019303-0ef8c4e2db43?w=800&h=600&fit=crop'
            ],
            
            # Chinese
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
            
            # Mexican
            'tacos': [
                'https://images.unsplash.com/photo-1565299585323-38174c0ac3d5?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop'
            ],
            'ceviche': [
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1534482421815-d4236d9bbb5b?w=800&h=600&fit=crop'
            ],
            'mole': [
                'https://images.unsplash.com/photo-1585582267537-6d4d7c17c3c2?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1572441713132-51c7a9d5b9b5?w=800&h=600&fit=crop'
            ],
            
            # Indian
            'curry': [
                'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop'
            ],
            'biryani': [
                'https://images.unsplash.com/photo-1563379091339-03246963d7d3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571407982449-05c6c44b3a3e?w=800&h=600&fit=crop'
            ],
            'dosa': [
                'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1534482421815-d4236d9bbb5b?w=800&h=600&fit=crop'
            ],
            
            # Japanese
            'sushi': [
                'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1564489563729-3f296c8c8cd7?w=800&h=600&fit=crop'
            ],
            'ramen': [
                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop'
            ],
            'mochi': [
                'https://images.unsplash.com/photo-1518047601542-79f18c655718?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop'
            ],
            
            # Thai
            'pad_thai': [
                'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1582169296194-339515ba95b8?w=800&h=600&fit=crop'
            ],
            'green_curry': [
                'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop'
            ],
            'mango_rice': [
                'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1518047601542-79f18c655718?w=800&h=600&fit=crop'
            ],
            
            # French
            'coq_au_vin': [
                'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop'
            ],
            'creme_brulee': [
                'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1518047601542-79f18c655718?w=800&h=600&fit=crop'
            ],
            
            # Korean
            'bulgogi': [
                'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1585582267537-6d4d7c17c3c2?w=800&h=600&fit=crop'
            ],
            'kimchi': [
                'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571197707303-bacdce64bc7c?w=800&h=600&fit=crop'
            ],
            
            # Greek
            'moussaka': [
                'https://images.unsplash.com/photo-1560963689-b8ec58bcda4c?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1572441713132-51c7a9d5b9b5?w=800&h=600&fit=crop'
            ],
            'greek_salad': [
                'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
            ],
            
            # Mediterranean
            'hummus': [
                'https://images.unsplash.com/photo-1571197707303-bacdce64bc7c?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop'
            ],
            
            # American
            'burger': [
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&h=600&fit=crop'
            ],
            'bbq_ribs': [
                'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1572441713132-51c7a9d5b9b5?w=800&h=600&fit=crop'
            ],
            'cheesecake': [
                'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop'
            ],
            
            # Generic categories
            'dessert': [
                'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1518047601542-79f18c655718?w=800&h=600&fit=crop'
            ],
            'appetizer': [
                'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571197707303-bacdce64bc7c?w=800&h=600&fit=crop'
            ],
            'main_course': [
                'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop'
            ]
        }
    
    def get_images_for_food(self, food_name):
        """Get appropriate images for a food based on its name"""
        food_name_lower = food_name.lower()
        
        # Match specific food types
        if any(word in food_name_lower for word in ['pizza', 'margherita']):
            return self.food_images.get('pizza', [])
        elif any(word in food_name_lower for word in ['pasta', 'spaghetti', 'carbonara', 'lasagna']):
            return self.food_images.get('pasta', [])
        elif 'risotto' in food_name_lower:
            return self.food_images.get('risotto', [])
        elif any(word in food_name_lower for word in ['osso', 'buco']):
            return self.food_images.get('main_course', [])
        elif any(word in food_name_lower for word in ['panna', 'cotta']):
            return self.food_images.get('dessert', [])
            
        # Chinese
        elif any(word in food_name_lower for word in ['duck', 'peking']):
            return self.food_images.get('duck', [])
        elif any(word in food_name_lower for word in ['xiaolongbao', 'dumpling']):
            return self.food_images.get('dumplings', [])
        elif 'tofu' in food_name_lower:
            return self.food_images.get('tofu', [])
            
        # Mexican
        elif any(word in food_name_lower for word in ['taco', 'burrito']):
            return self.food_images.get('tacos', [])
        elif 'ceviche' in food_name_lower:
            return self.food_images.get('ceviche', [])
        elif 'mole' in food_name_lower:
            return self.food_images.get('mole', [])
        elif 'churros' in food_name_lower:
            return self.food_images.get('dessert', [])
            
        # Indian
        elif any(word in food_name_lower for word in ['curry', 'masala', 'vindaloo', 'paneer']):
            return self.food_images.get('curry', [])
        elif 'biryani' in food_name_lower:
            return self.food_images.get('biryani', [])
        elif 'dosa' in food_name_lower:
            return self.food_images.get('dosa', [])
            
        # Japanese
        elif any(word in food_name_lower for word in ['sushi', 'sashimi', 'chirashi']):
            return self.food_images.get('sushi', [])
        elif 'ramen' in food_name_lower:
            return self.food_images.get('ramen', [])
        elif 'mochi' in food_name_lower:
            return self.food_images.get('mochi', [])
            
        # Thai
        elif 'pad thai' in food_name_lower:
            return self.food_images.get('pad_thai', [])
        elif 'green curry' in food_name_lower:
            return self.food_images.get('green_curry', [])
        elif 'mango' in food_name_lower and 'rice' in food_name_lower:
            return self.food_images.get('mango_rice', [])
            
        # French
        elif 'coq au vin' in food_name_lower:
            return self.food_images.get('coq_au_vin', [])
        elif any(word in food_name_lower for word in ['creme', 'brulee']):
            return self.food_images.get('creme_brulee', [])
            
        # Korean
        elif 'bulgogi' in food_name_lower:
            return self.food_images.get('bulgogi', [])
        elif 'kimchi' in food_name_lower:
            return self.food_images.get('kimchi', [])
            
        # Greek
        elif 'moussaka' in food_name_lower:
            return self.food_images.get('moussaka', [])
        elif 'greek salad' in food_name_lower or 'salad' in food_name_lower:
            return self.food_images.get('greek_salad', [])
            
        # Mediterranean
        elif 'hummus' in food_name_lower:
            return self.food_images.get('hummus', [])
            
        # American
        elif 'burger' in food_name_lower:
            return self.food_images.get('burger', [])
        elif any(word in food_name_lower for word in ['bbq', 'ribs']):
            return self.food_images.get('bbq_ribs', [])
        elif 'cheesecake' in food_name_lower:
            return self.food_images.get('cheesecake', [])
            
        # Default by category
        elif any(word in food_name_lower for word in ['dessert', 'cake', 'ice cream', 'sweet']):
            return self.food_images.get('dessert', [])
        elif any(word in food_name_lower for word in ['appetizer', 'starter']):
            return self.food_images.get('appetizer', [])
        else:
            return self.food_images.get('main_course', [])
    
    def create_sample_images(self):
        """Create sample images for all foods"""
        print("📸 Creating sample food images with Cloudinary URLs...")
        
        foods = Food.objects.all()
        created_count = 0
        updated_count = 0
        
        for food in foods:
            try:
                # Get appropriate images for this food
                image_urls = self.get_images_for_food(food.name)
                
                if not image_urls:
                    print(f"⚠️  No images found for {food.name}")
                    continue
                
                # Remove existing images (clean slate)
                existing_count = food.images.count()
                if existing_count > 0:
                    food.images.all().delete()
                    updated_count += 1
                    print(f"🗑️  Removed {existing_count} old images for {food.name}")
                
                # Add 1-3 images per food
                num_images = min(len(image_urls), random.randint(1, 3))
                selected_images = random.sample(image_urls, num_images) if len(image_urls) > num_images else image_urls
                
                for i, image_url in enumerate(selected_images):
                    FoodImage.objects.create(
                        food=food,
                        image_url=image_url,
                        thumbnail_url=f"{image_url}&w=300&h=200&fit=crop",  # Create thumbnail URL
                        cloudinary_public_id=f"sample_{food.name.lower().replace(' ', '_')}_{i+1}",
                        caption=f"Delicious {food.name}",
                        alt_text=f"A beautifully prepared {food.name}",
                        is_primary=(i == 0),  # First image is primary
                        sort_order=i
                    )
                
                created_count += len(selected_images)
                print(f"✅ Added {len(selected_images)} images to {food.name}")
                
            except Exception as e:
                print(f"❌ Error processing {food.name}: {str(e)}")
                continue
        
        return created_count, updated_count
    
    def run(self):
        """Main execution method"""
        print("🍽️ CREATING SAMPLE FOOD IMAGES")
        print("=" * 50)
        
        created, updated = self.create_sample_images()
        
        # Summary
        total_foods = Food.objects.count()
        foods_with_images = Food.objects.filter(images__isnull=False).distinct().count()
        total_images = FoodImage.objects.count()
        
        print("\n" + "=" * 50)
        print("🎉 SAMPLE IMAGE CREATION COMPLETE!")
        print(f"✅ Images created: {created}")
        print(f"🔄 Foods updated: {updated}")
        print(f"📊 Total foods: {total_foods}")
        print(f"📸 Foods with images: {foods_with_images}")
        print(f"🖼️  Total images: {total_images}")
        print(f"📈 Coverage: {(foods_with_images/total_foods)*100:.1f}%")
        
        # Show some examples
        print("\n🎯 SAMPLE RESULTS:")
        for food in Food.objects.filter(images__isnull=False)[:5]:
            primary_img = food.images.filter(is_primary=True).first()
            if primary_img:
                print(f"• {food.name}: {primary_img.image_url[:60]}...")
        
        print("\n🚀 Ready to use! All foods now have beautiful images!")

if __name__ == '__main__':
    creator = SampleFoodImageCreator()
    creator.run()