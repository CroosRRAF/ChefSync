#!/usr/bin/env python3
"""
Script to add real placeholder images to the sample data
"""
import os
import sys
import django
from pathlib import Path
import requests
import random
from django.core.files.base import ContentFile

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodImage, Cuisine
from apps.users.models import UserProfile


class ImageManager:
    def __init__(self):
        self.food_image_urls = {
            'Italian': [
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',  # Pizza
                'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400',  # Pasta
                'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400',  # Italian food
            ],
            'Chinese': [
                'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',  # Chinese food
                'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',  # Fried rice
                'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400',  # Chinese dish
            ],
            'Mexican': [
                'https://images.unsplash.com/photo-1565299585323-38174c55370c?w=400',  # Tacos
                'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400',  # Mexican food
                'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',  # Burrito
            ],
            'Indian': [
                'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',  # Indian curry
                'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',  # Indian food
                'https://images.unsplash.com/photo-1574653129079-4d2d8c10e7c2?w=400',  # Biryani
            ]
        }
        
        self.profile_image_urls = [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',  # Person 1
            'https://images.unsplash.com/photo-1494790108755-2616b25254e3?w=300',  # Person 2
            'https://images.unsplash.com/photo-1522075469751-3847faf34b47?w=300',  # Person 3
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',  # Person 4
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',  # Person 5
        ]

    def download_image(self, url, filename):
        """Download image from URL and return content"""
        try:
            print(f"Downloading image from: {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Create ContentFile from the downloaded content
            return ContentFile(response.content, name=filename)
        except Exception as e:
            print(f"Error downloading image {url}: {e}")
            return None

    def add_food_images(self):
        """Add images to food items"""
        print("Adding images to food items...")
        
        cuisines = Cuisine.objects.all()
        
        for cuisine in cuisines:
            foods = Food.objects.filter(food_category__cuisine=cuisine)
            image_urls = self.food_image_urls.get(cuisine.name, [])
            
            if not image_urls:
                continue
                
            for food in foods:
                # Add cuisine image if not exists
                if not cuisine.image:
                    image_url = random.choice(image_urls)
                    image_file = self.download_image(image_url, f'cuisine_{cuisine.name.lower()}.jpg')
                    if image_file:
                        cuisine.image.save(f'cuisine_{cuisine.name.lower()}.jpg', image_file)
                        cuisine.save()
                        print(f"Added image to cuisine: {cuisine.name}")
                
                # Add food images
                existing_images = FoodImage.objects.filter(food=food).count()
                if existing_images < 2:
                    for i in range(2 - existing_images):
                        image_url = random.choice(image_urls)
                        image_file = self.download_image(image_url, f'food_{food.food_id}_{i+1}.jpg')
                        
                        if image_file:
                            food_image = FoodImage.objects.create(
                                food=food,
                                caption=f"{food.name} - Image {existing_images + i + 1}",
                                is_primary=(existing_images + i) == 0,
                                sort_order=existing_images + i + 1
                            )
                            food_image.image.save(f'food_{food.food_id}_{i+1}.jpg', image_file)
                            print(f"Added image to food: {food.name}")

    def add_profile_images(self):
        """Add images to user profiles"""
        print("Adding images to user profiles...")
        
        profiles = UserProfile.objects.filter(profile_picture__isnull=True)
        
        for i, profile in enumerate(profiles[:5]):  # First 5 profiles
            if i < len(self.profile_image_urls):
                image_url = self.profile_image_urls[i]
                image_file = self.download_image(image_url, f'profile_{profile.user.id}.jpg')
                
                if image_file:
                    profile.profile_picture.save(f'profile_{profile.user.id}.jpg', image_file)
                    print(f"Added profile image for: {profile.user.name}")

    def create_placeholder_images(self):
        """Create simple placeholder images for remaining items"""
        print("Creating placeholder images for remaining items...")
        
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create placeholder for cuisines without images
        cuisines = Cuisine.objects.filter(image__isnull=True)
        for cuisine in cuisines:
            # Create a simple colored placeholder
            img = Image.new('RGB', (400, 300), color=(70, 130, 180))
            draw = ImageDraw.Draw(img)
            
            try:
                # Try to load a font, fall back to default if not available
                font = ImageFont.truetype("arial.ttf", 40)
            except:
                font = ImageFont.load_default()
            
            # Calculate text size and position
            text = cuisine.name[:10]  # Limit text length
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (400 - text_width) // 2
            y = (300 - text_height) // 2
            
            draw.text((x, y), text, fill='white', font=font)
            
            # Save to bytes
            img_io = io.BytesIO()
            img.save(img_io, format='JPEG', quality=85)
            img_io.seek(0)
            
            # Save to model
            image_file = ContentFile(img_io.read(), name=f'cuisine_{cuisine.name.lower()}_placeholder.jpg')
            cuisine.image.save(f'cuisine_{cuisine.name.lower()}_placeholder.jpg', image_file)
            print(f"Created placeholder image for cuisine: {cuisine.name}")

    def run(self):
        """Run all image creation methods"""
        print("Starting image creation process...")
        print("=" * 50)
        
        try:
            self.add_food_images()
            self.add_profile_images()
            self.create_placeholder_images()
            
            print("\n" + "=" * 50)
            print("Image creation completed successfully!")
            print("=" * 50)
            
        except Exception as e:
            print(f"Error creating images: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    manager = ImageManager()
    manager.run()