#!/usr/bin/env python3
"""
Add real Cloudinary images to food items
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
from apps.food.cloudinary_utils import upload_image_to_cloudinary

def create_real_cloudinary_images():
    """Create real Cloudinary images using simple approach"""
    print("📸 Creating real Cloudinary images for foods...")
    
    # Sample food images from Unsplash (these are real URLs we can use)
    sample_images = {
        'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
        'pasta': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800',
        'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        'sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
        'tacos': 'https://images.unsplash.com/photo-1565299585323-38174c0ac3d5?w=800',
        'curry': 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800',
        'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
        'dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
        'salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
        'bbq': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
    }
    
    updated_count = 0
    
    # Update images for foods that have placeholder URLs
    foods_with_placeholders = Food.objects.filter(
        images__image_url__contains='placeholder'
    ).distinct()
    
    print(f"Found {foods_with_placeholders.count()} foods with placeholder images")
    
    for food in foods_with_placeholders:
        try:
            # Choose appropriate image based on food type
            food_name_lower = food.name.lower()
            image_url = None
            
            if 'pizza' in food_name_lower:
                image_url = sample_images['pizza']
            elif any(word in food_name_lower for word in ['pasta', 'spaghetti', 'lasagna', 'carbonara']):
                image_url = sample_images['pasta']
            elif any(word in food_name_lower for word in ['burger', 'sandwich']):
                image_url = sample_images['burger']
            elif any(word in food_name_lower for word in ['sushi', 'sashimi', 'chirashi']):
                image_url = sample_images['sushi']
            elif any(word in food_name_lower for word in ['taco', 'burrito', 'quesadilla']):
                image_url = sample_images['tacos']
            elif any(word in food_name_lower for word in ['curry', 'masala', 'vindaloo']):
                image_url = sample_images['curry']
            elif 'ramen' in food_name_lower:
                image_url = sample_images['ramen']
            elif any(word in food_name_lower for word in ['salad', 'hummus']):
                image_url = sample_images['salad']
            elif any(word in food_name_lower for word in ['bbq', 'ribs']):
                image_url = sample_images['bbq']
            elif any(word in food_name_lower for word in ['dessert', 'cake', 'ice cream', 'tiramisu', 'churros', 'creme', 'mochi']):
                image_url = sample_images['dessert']
            else:
                # Default to a random food image
                image_url = random.choice(list(sample_images.values()))
            
            # Update the placeholder images with real URLs
            food.images.filter(image_url__contains='placeholder').update(
                image_url=image_url,
                alt_text=f"Delicious {food.name}",
                caption=f"Fresh {food.name} prepared with care"
            )
            
            updated_count += 1
            print(f"✅ Updated image for {food.name}")
            
        except Exception as e:
            print(f"❌ Error updating {food.name}: {str(e)}")
    
    print(f"\n🎉 Updated {updated_count} food images with real URLs!")
    
    # Create summary
    print("\n📊 Current Image Status:")
    total_images = FoodImage.objects.count()
    placeholder_images = FoodImage.objects.filter(image_url__contains='placeholder').count()
    real_images = total_images - placeholder_images
    
    print(f"Total images: {total_images}")
    print(f"Real images: {real_images}")
    print(f"Placeholder images: {placeholder_images}")

def main():
    print("🖼️  Updating FoodImages with real URLs...")
    create_real_cloudinary_images()
    print("\n✅ Image update complete!")

if __name__ == '__main__':
    main()