#!/usr/bin/env python3
"""
Clean up duplicate food entries and ensure data integrity
"""
import os
import sys
import django
from pathlib import Path
from collections import defaultdict

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import models
from apps.food.models import (
    Cuisine, FoodCategory, Food, FoodImage, 
    FoodPrice, Offer, FoodReview
)

def remove_duplicate_foods():
    """Remove duplicate food items and consolidate their data"""
    print("🧹 Cleaning up duplicate food entries...")
    
    # Group foods by name
    food_groups = defaultdict(list)
    for food in Food.objects.all():
        food_groups[food.name].append(food)
    
    removed_count = 0
    
    for food_name, food_list in food_groups.items():
        if len(food_list) > 1:
            print(f"Found {len(food_list)} duplicates of '{food_name}'")
            
            # Keep the first one (usually the one with more complete data)
            primary_food = food_list[0]
            duplicates = food_list[1:]
            
            for duplicate in duplicates:
                # Move prices to primary food if they don't conflict
                for price in FoodPrice.objects.filter(food=duplicate):
                    existing_price = FoodPrice.objects.filter(
                        food=primary_food, 
                        size=price.size, 
                        cook=price.cook
                    ).first()
                    
                    if not existing_price:
                        # Move the price to primary food
                        price.food = primary_food
                        price.save()
                        print(f"  Moved {price.size} price to primary food")
                    else:
                        # Delete duplicate price (but keep its reviews)
                        for review in FoodReview.objects.filter(price=price):
                            # Try to move review to equivalent price on primary food
                            equivalent_price = FoodPrice.objects.filter(
                                food=primary_food,
                                size=price.size
                            ).first()
                            
                            if equivalent_price:
                                existing_review = FoodReview.objects.filter(
                                    customer=review.customer,
                                    price=equivalent_price
                                ).first()
                                
                                if not existing_review:
                                    review.price = equivalent_price
                                    review.save()
                                    print(f"    Moved review to primary food")
                                else:
                                    review.delete()  # Delete duplicate review
                            else:
                                review.delete()
                        
                        price.delete()
                
                # Move images to primary food
                for image in FoodImage.objects.filter(food=duplicate):
                    image.food = primary_food
                    image.save()
                    print(f"  Moved image to primary food")
                
                # Delete the duplicate food
                duplicate.delete()
                print(f"  Deleted duplicate food: {duplicate.name}")
                removed_count += 1
    
    return removed_count

def update_food_statistics():
    """Update food statistics based on actual reviews and orders"""
    print("📊 Updating food statistics...")
    
    updated_count = 0
    
    for food in Food.objects.all():
        # Get all reviews for this food
        all_reviews = FoodReview.objects.filter(price__food=food)
        
        if all_reviews.exists():
            # Calculate average rating
            avg_rating = all_reviews.aggregate(
                avg_rating=models.Avg('rating')
            )['avg_rating'] or 0
            
            # Update food statistics
            food.rating_average = round(avg_rating, 1)
            food.total_reviews = all_reviews.count()
            food.save()
            updated_count += 1
            
            print(f"Updated {food.name}: {food.rating_average}⭐ ({food.total_reviews} reviews)")
    
    return updated_count

def main():
    print("🛠️  Starting database cleanup and optimization...")
    
    # Remove duplicates
    removed = remove_duplicate_foods()
    
    # Update statistics
    updated = update_food_statistics()
    
    print("\n" + "="*50)
    print("✅ Database cleanup complete!")
    print(f"🗑️  Removed duplicate foods: {removed}")
    print(f"📊 Updated food statistics: {updated}")
    
    # Show final clean stats
    print("\nFinal Clean Database Statistics:")
    print(f"- Total Cuisines: {Cuisine.objects.count()}")
    print(f"- Total Categories: {FoodCategory.objects.count()}")
    print(f"- Total Food Items: {Food.objects.count()}")
    print(f"- Total Prices: {FoodPrice.objects.count()}")
    print(f"- Total Reviews: {FoodReview.objects.count()}")
    print(f"- Total Images: {FoodImage.objects.count()}")
    print(f"- Total Offers: {Offer.objects.count()}")
    
    # Show some sample foods
    print("\nSample Food Items by Cuisine:")
    for cuisine in Cuisine.objects.all()[:5]:  # Show first 5 cuisines
        foods = Food.objects.filter(food_category__cuisine=cuisine)[:2]  # Show 2 foods per cuisine
        if foods:
            print(f"\n{cuisine.name}:")
            for food in foods:
                price_range = FoodPrice.objects.filter(food=food).aggregate(
                    min_price=models.Min('price'),
                    max_price=models.Max('price')
                )
                min_price = price_range['min_price'] or 0
                max_price = price_range['max_price'] or 0
                
                if min_price == max_price:
                    price_str = f"${min_price}"
                else:
                    price_str = f"${min_price} - ${max_price}"
                
                print(f"  • {food.name} ({price_str}) - {food.rating_average}⭐")

if __name__ == '__main__':
    main()