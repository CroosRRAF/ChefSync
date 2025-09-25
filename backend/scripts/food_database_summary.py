#!/usr/bin/env python3
"""
Final summary of the comprehensive food database
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

from apps.food.models import (
    Cuisine, FoodCategory, Food, FoodImage, 
    FoodPrice, Offer, FoodReview
)
from apps.authentication.models import User

def main():
    print("🍽️  CHEFSYNC COMPREHENSIVE FOOD DATABASE SUMMARY")
    print("=" * 60)
    
    # User Statistics
    print("\n👥 USER STATISTICS:")
    admin_count = User.objects.filter(role__in=['Admin', 'admin']).count()
    cook_count = User.objects.filter(role__in=['Cook', 'cook']).count()
    customer_count = User.objects.filter(role__in=['Customer', 'customer']).count()
    print(f"  • Administrators: {admin_count}")
    print(f"  • Chefs/Cooks: {cook_count}")
    print(f"  • Customers: {customer_count}")
    print(f"  • Total Users: {User.objects.count()}")
    
    # Food Database Statistics
    print("\n🍽️  FOOD DATABASE STATISTICS:")
    print(f"  • Cuisines: {Cuisine.objects.count()}")
    print(f"  • Food Categories: {FoodCategory.objects.count()}")
    print(f"  • Food Items: {Food.objects.count()}")
    print(f"  • Price Variations: {FoodPrice.objects.count()}")
    print(f"  • Customer Reviews: {FoodReview.objects.count()}")
    print(f"  • Food Images: {FoodImage.objects.count()}")
    print(f"  • Active Offers: {Offer.objects.count()}")
    
    # Cuisine Breakdown
    print("\n🌍 CUISINE BREAKDOWN:")
    for cuisine in Cuisine.objects.all():
        food_count = Food.objects.filter(food_category__cuisine=cuisine).count()
        category_count = FoodCategory.objects.filter(cuisine=cuisine).count()
        print(f"  • {cuisine.name}: {food_count} foods across {category_count} categories")
    
    # Top Rated Foods
    print("\n⭐ TOP RATED FOODS:")
    top_foods = Food.objects.filter(total_reviews__gte=5).order_by('-rating_average')[:10]
    for i, food in enumerate(top_foods, 1):
        cuisine_name = food.food_category.cuisine.name if food.food_category else "N/A"
        print(f"  {i}. {food.name} ({cuisine_name}) - {food.rating_average}⭐ ({food.total_reviews} reviews)")
    
    # Price Range Analysis
    print("\n💰 PRICE RANGE ANALYSIS:")
    prices = FoodPrice.objects.all()
    if prices:
        min_price = prices.order_by('price').first().price
        max_price = prices.order_by('-price').first().price
        avg_price = sum([p.price for p in prices]) / len(prices)
        print(f"  • Price Range: ${min_price} - ${max_price}")
        print(f"  • Average Price: ${avg_price:.2f}")
    
    # Category Distribution
    print("\n📊 FOOD CATEGORY DISTRIBUTION:")
    categories = FoodCategory.objects.all()
    for category in categories:
        food_count = Food.objects.filter(food_category=category).count()
        if food_count > 0:
            print(f"  • {category.cuisine.name} - {category.name}: {food_count} items")
    
    # Sample Menu Preview
    print("\n📋 SAMPLE MENU PREVIEW:")
    for cuisine in Cuisine.objects.all()[:5]:  # Show 5 cuisines
        print(f"\n  🍽️  {cuisine.name.upper()} CUISINE:")
        foods = Food.objects.filter(food_category__cuisine=cuisine)[:3]  # Top 3 per cuisine
        for food in foods:
            prices = FoodPrice.objects.filter(food=food)
            if prices:
                price_range = f"${prices.order_by('price').first().price} - ${prices.order_by('-price').first().price}"
                spice_emoji = {"mild": "🌶️", "medium": "🌶️🌶️", "hot": "🌶️🌶️🌶️", "very_hot": "🌶️🌶️🌶️🌶️"}.get(food.spice_level, "")
                dietary_info = []
                if food.is_vegetarian: dietary_info.append("🥕 Vegetarian")
                if food.is_vegan: dietary_info.append("🌱 Vegan")
                if food.is_gluten_free: dietary_info.append("🌾 Gluten-Free")
                dietary_str = " | ".join(dietary_info)
                
                print(f"    • {food.name} - {price_range} {spice_emoji}")
                print(f"      {food.description[:80]}...")
                if dietary_str:
                    print(f"      {dietary_str}")
                print(f"      ⭐ {food.rating_average} ({food.total_reviews} reviews) | ⏱️ {food.preparation_time} min")
    
    print("\n" + "=" * 60)
    print("✅ COMPREHENSIVE FOOD DATABASE SUCCESSFULLY CREATED!")
    print("🎉 Ready for ChefSync application deployment!")
    print("=" * 60)

if __name__ == '__main__':
    main()