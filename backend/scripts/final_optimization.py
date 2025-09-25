#!/usr/bin/env python3
"""
Final optimization: Remove duplicate prices and ensure unique constraints
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
from apps.food.models import FoodPrice, FoodReview

def clean_duplicate_prices():
    """Remove duplicate prices for the same food-size-cook combination"""
    print("🧹 Removing duplicate prices...")
    
    # Group prices by food, size, and cook
    price_groups = defaultdict(list)
    for price in FoodPrice.objects.all():
        key = (price.food_id, price.size, price.cook_id)
        price_groups[key].append(price)
    
    removed_count = 0
    
    for (food_id, size, cook_id), price_list in price_groups.items():
        if len(price_list) > 1:
            print(f"Found {len(price_list)} duplicate prices for food_id={food_id}, size={size}")
            
            # Keep the first price (usually has more data)
            primary_price = price_list[0]
            duplicates = price_list[1:]
            
            # Move all reviews from duplicates to primary price
            for duplicate in duplicates:
                reviews = FoodReview.objects.filter(price=duplicate)
                for review in reviews:
                    # Check if customer already reviewed the primary price
                    existing_review = FoodReview.objects.filter(
                        customer=review.customer,
                        price=primary_price
                    ).first()
                    
                    if not existing_review:
                        review.price = primary_price
                        review.save()
                        print(f"  Moved review to primary price")
                    else:
                        review.delete()  # Remove duplicate review
                        print(f"  Removed duplicate review")
                
                duplicate.delete()
                removed_count += 1
                print(f"  Removed duplicate price: {duplicate.price}")
    
    return removed_count

def main():
    print("🔧 Final database optimization...")
    
    # Clean duplicate prices
    removed = clean_duplicate_prices()
    
    print("\n" + "="*50)
    print("✅ Final optimization complete!")
    print(f"🗑️  Removed duplicate prices: {removed}")
    
    # Final stats
    print("\nOptimized Database Statistics:")
    print(f"- Total Food Items: {models.Count('food')}")
    print(f"- Total Unique Prices: {FoodPrice.objects.count()}")
    print(f"- Total Reviews: {FoodReview.objects.count()}")

if __name__ == '__main__':
    main()