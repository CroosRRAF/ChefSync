#!/usr/bin/env python3
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

from apps.food.models import Cuisine, FoodCategory, Food, FoodPrice, FoodReview, FoodImage, Offer

print("🍽️  Current Food Database Summary:")
print("=" * 50)

# Cuisines
cuisines = Cuisine.objects.all()
print(f"Cuisines ({cuisines.count()}):")
for cuisine in cuisines:
    print(f"  - {cuisine.name}")

print()

# Food Categories
categories = FoodCategory.objects.all()
print(f"Food Categories ({categories.count()}):")
for category in categories:
    print(f"  - {category.cuisine.name}: {category.name}")

print()

# Foods
foods = Food.objects.all().order_by('food_category__cuisine__name', 'name')
print(f"Food Items ({foods.count()}):")
for food in foods:
    cuisine_name = food.food_category.cuisine.name if food.food_category else "No Category"
    print(f"  - {cuisine_name}: {food.name}")
    
    # Show prices
    prices = FoodPrice.objects.filter(food=food)
    if prices.exists():
        price_str = ", ".join([f"{p.size}: ${p.price}" for p in prices])
        print(f"    Prices: {price_str}")
    
    # Show reviews count
    review_count = FoodReview.objects.filter(price__food=food).count()
    if review_count > 0:
        print(f"    Reviews: {review_count}")

print()

# Summary stats
total_prices = FoodPrice.objects.count()
total_reviews = FoodReview.objects.count()
total_images = FoodImage.objects.count()
total_offers = Offer.objects.count()

print("Database Statistics:")
print(f"  - Total Food Items: {foods.count()}")
print(f"  - Total Prices: {total_prices}")
print(f"  - Total Reviews: {total_reviews}")
print(f"  - Total Images: {total_images}")
print(f"  - Total Offers: {total_offers}")
print(f"  - Total Cuisines: {cuisines.count()}")
print(f"  - Total Categories: {categories.count()}")