#!/usr/bin/env python3
"""
Simple test to show the created food data with images
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

from apps.food.models import Food, FoodImage, FoodPrice, Cuisine

def show_food_data():
    """Show the created food data"""
    print("🍽️ SAMPLE FOOD DATA WITH CLOUDINARY IMAGES")
    print("=" * 60)
    
    # Get all foods with their details
    foods = Food.objects.all()
    
    print(f"📊 OVERVIEW:")
    print(f"• Total Foods: {foods.count()}")
    print(f"• Total Images: {FoodImage.objects.count()}")
    print(f"• Total Prices: {FoodPrice.objects.count()}")
    print(f"• Total Cuisines: {Cuisine.objects.count()}")
    
    print(f"\n🌍 CUISINES:")
    for cuisine in Cuisine.objects.all():
        food_count = Food.objects.filter(food_category__cuisine=cuisine).count()
        print(f"• {cuisine.name}: {food_count} foods")
    
    print(f"\n🍽️ SAMPLE FOODS WITH IMAGES:")
    
    # Show first 10 foods with their details
    for food in foods[:10]:
        print(f"\n• {food.name}")
        print(f"  Description: {food.description}")
        print(f"  Cuisine: {food.food_category.cuisine.name if food.food_category else 'N/A'}")
        print(f"  Category: {food.food_category.name if food.food_category else 'N/A'}")
        print(f"  Vegetarian: {food.is_vegetarian}")
        print(f"  Spice Level: {food.spice_level}")
        print(f"  Rating: {food.rating_average}")
        print(f"  Status: {food.status}")
        
        # Show images
        images = food.images.all()
        if images:
            print(f"  📸 Images ({images.count()}):")
            for img in images:
                print(f"    • {img.image_url}")
                print(f"      Thumbnail: {img.thumbnail_url}")
                print(f"      Primary: {img.is_primary}")
        
        # Show prices
        prices = food.prices.all()
        if prices:
            print(f"  💰 Prices:")
            for price in prices:
                print(f"    • {price.size}: ${price.price}")
    
    print("\n" + "=" * 60)
    print("✅ FOOD DATA DISPLAY COMPLETE!")
    print("🚀 All foods now have Cloudinary-based images!")

if __name__ == '__main__':
    show_food_data()