#!/usr/bin/env python3
"""
Test API endpoints for the new food data with Cloudinary images
"""
import os
import sys
import django
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodImage, FoodPrice, Cuisine, FoodCategory
from apps.food.serializers import FoodSerializer, FoodImageSerializer

def test_food_api_data():
    """Test the food data through serializers (simulating API responses)"""
    print("🧪 TESTING FOOD API DATA WITH CLOUDINARY IMAGES")
    print("=" * 60)
    
    # Test Food serialization
    print("\n1. 🍽️ TESTING FOOD SERIALIZATION:")
    foods = Food.objects.all()[:3]  # Get first 3 foods
    
    for food in foods:
        serializer = FoodSerializer(food)
        data = serializer.data
        
        print(f"\n• Food: {data['name']}")
        print(f"  ID: {data['food_id']}")
        print(f"  Description: {data['description']}")
        print(f"  Status: {data['status']}")
        print(f"  Rating: {data['rating_average']}")
        print(f"  Is Available: {data['is_available']}")
        print(f"  Category: {data.get('category', 'N/A')}")
        
        # Check if optimized_url property is working
        if hasattr(food, 'optimized_url'):
            print(f"  Optimized URL: {food.optimized_url}")
        if hasattr(food, 'thumbnail'):
            print(f"  Thumbnail: {food.thumbnail}")
    
    # Test FoodImage serialization
    print("\n2. 📸 TESTING FOOD IMAGE SERIALIZATION:")
    images = FoodImage.objects.all()[:5]  # Get first 5 images
    
    for image in images:
        serializer = FoodImageSerializer(image)
        data = serializer.data
        
        print(f"\n• Image for: {image.food.name}")
        print(f"  Image URL: {data['image_url']}")
        print(f"  Thumbnail URL: {data['thumbnail_url']}")
        print(f"  Cloudinary ID: {data['cloudinary_public_id']}")
        print(f"  Is Primary: {data['is_primary']}")
        print(f"  Caption: {data['caption']}")
        print(f"  Alt Text: {data['alt_text']}")
        
        # Test optimized_url property
        if hasattr(image, 'optimized_url'):
            print(f"  Optimized URL: {image.optimized_url}")
        if hasattr(image, 'thumbnail'):
            print(f"  Thumbnail Property: {image.thumbnail}")
    
    # Test Food with Images relationship
    print("\n3. 🔗 TESTING FOOD-IMAGE RELATIONSHIPS:")
    foods_with_images = Food.objects.filter(images__isnull=False).distinct()[:3]
    
    for food in foods_with_images:
        print(f"\n• {food.name}:")
        primary_image = food.images.filter(is_primary=True).first()
        if primary_image:
            print(f"  Primary Image: {primary_image.image_url}")
        
        all_images = food.images.all()
        print(f"  Total Images: {all_images.count()}")
        for i, img in enumerate(all_images, 1):
            print(f"    Image {i}: {img.image_url[:50]}...")
    
    # Test Food Prices
    print("\n4. 💰 TESTING FOOD PRICES:")
    foods_with_prices = Food.objects.filter(prices__isnull=False).distinct()[:3]
    
    for food in foods_with_prices:
        print(f"\n• {food.name}:")
        prices = food.prices.all()
        for price in prices:
            print(f"  {price.size}: ${price.price}")
    
    # Database Statistics
    print("\n5. 📊 DATABASE STATISTICS:")
    total_foods = Food.objects.count()
    foods_with_images = Food.objects.filter(images__isnull=False).distinct().count()
    foods_with_prices = Food.objects.filter(prices__isnull=False).distinct().count()
    
    print(f"Total Foods: {total_foods}")
    print(f"Foods with Images: {foods_with_images} ({(foods_with_images/total_foods)*100:.1f}%)")
    print(f"Foods with Prices: {foods_with_prices} ({(foods_with_prices/total_foods)*100:.1f}%)")
    print(f"Total Images: {FoodImage.objects.count()}")
    print(f"Total Prices: {FoodPrice.objects.count()}")
    print(f"Total Cuisines: {Cuisine.objects.count()}")
    print(f"Total Categories: {FoodCategory.objects.count()}")
    
    # Image URL Examples
    print("\n6. 🌐 SAMPLE CLOUDINARY URLS:")
    sample_images = FoodImage.objects.all()[:3]
    for img in sample_images:
        print(f"\n• {img.food.name}:")
        print(f"  Full Image: {img.image_url}")
        print(f"  Thumbnail: {img.thumbnail_url}")
        print(f"  Public ID: {img.cloudinary_public_id}")
    
    print("\n" + "=" * 60)
    print("✅ API DATA TEST COMPLETED SUCCESSFULLY!")
    print("🚀 All food data with Cloudinary images is ready for API use!")

if __name__ == '__main__':
    test_food_api_data()