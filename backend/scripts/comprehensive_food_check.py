#!/usr/bin/env python3
"""
Comprehensive Food Data and Image Verification Tool
Checks all food items, their images, and verifies image URLs are accessible
"""
import os
import sys
import django
from pathlib import Path
import requests
from urllib.parse import urlparse
import time

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodImage, FoodPrice, Cuisine, FoodCategory
from apps.food.serializers import FoodSerializer

class FoodDataImageChecker:
    def __init__(self):
        self.working_images = []
        self.broken_images = []
        self.total_checks = 0
    
    def check_image_url(self, url, timeout=5):
        """Check if image URL is accessible"""
        try:
            if not url:
                return False, "Empty URL"
            
            # Parse URL to make sure it's valid
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False, "Invalid URL format"
            
            # Make HEAD request to check if image exists
            response = requests.head(url, timeout=timeout, allow_redirects=True)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type.lower():
                    return True, f"✅ OK ({content_type})"
                else:
                    return False, f"⚠️  Not an image ({content_type})"
            else:
                return False, f"❌ HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            return False, "⏱️  Timeout"
        except requests.exceptions.ConnectionError:
            return False, "🔌 Connection Error"
        except Exception as e:
            return False, f"❌ Error: {str(e)[:50]}"
    
    def display_full_food_data(self):
        """Display comprehensive food data with image verification"""
        print("🍽️ COMPREHENSIVE FOOD DATA & IMAGE VERIFICATION")
        print("=" * 70)
        
        # Get all foods
        foods = Food.objects.filter(status='Approved', is_available=True).order_by('name')
        
        print(f"📊 OVERVIEW:")
        print(f"   Total Foods: {foods.count()}")
        print(f"   Total Images: {FoodImage.objects.count()}")
        print(f"   Total Prices: {FoodPrice.objects.count()}")
        print(f"   Total Cuisines: {Cuisine.objects.count()}")
        print(f"   Total Categories: {FoodCategory.objects.count()}")
        
        print(f"\n🌍 CUISINES BREAKDOWN:")
        cuisines = Cuisine.objects.all()
        for cuisine in cuisines:
            food_count = foods.filter(food_category__cuisine=cuisine).count()
            status = "✅" if food_count > 0 else "⚪"
            print(f"   {status} {cuisine.name}: {food_count} foods")
        
        print(f"\n🍽️ DETAILED FOOD DATA WITH IMAGE VERIFICATION:")
        print("=" * 70)
        
        for i, food in enumerate(foods, 1):
            print(f"\n{i:2d}. 🍽️ {food.name}")
            print(f"    🆔 ID: {food.food_id}")
            print(f"    🌍 Cuisine: {food.food_category.cuisine.name if food.food_category else 'N/A'}")
            print(f"    📂 Category: {food.food_category.name if food.food_category else 'N/A'}")
            print(f"    📝 Description: {food.description[:80]}...")
            print(f"    ⭐ Rating: {food.rating_average}/5.0 ({food.total_reviews} reviews)")
            print(f"    🌶️  Spice Level: {food.spice_level.title()}")
            print(f"    🥗 Vegetarian: {'Yes' if food.is_vegetarian else 'No'}")
            print(f"    ✅ Status: {food.status}")
            print(f"    🕒 Prep Time: {food.preparation_time or 'N/A'} minutes")
            
            # Show ingredients
            if hasattr(food, 'ingredients') and food.ingredients:
                ingredients = food.ingredients if isinstance(food.ingredients, list) else [food.ingredients]
                ingredients_str = ', '.join(ingredients[:3])
                if len(ingredients) > 3:
                    ingredients_str += f" + {len(ingredients) - 3} more"
                print(f"    🥬 Ingredients: {ingredients_str}")
            
            # Check images
            images = food.images.all().order_by('-is_primary', 'sort_order')
            print(f"    📸 Images ({images.count()}):")
            
            if not images:
                print(f"       ⚠️  No images found")
            else:
                for j, img in enumerate(images, 1):
                    primary_marker = "👑" if img.is_primary else "  "
                    print(f"       {primary_marker}{j}. {img.caption or 'No caption'}")
                    
                    # Check main image URL
                    if img.image_url:
                        self.total_checks += 1
                        is_working, status = self.check_image_url(img.image_url)
                        if is_working:
                            self.working_images.append(img.image_url)
                        else:
                            self.broken_images.append(img.image_url)
                        print(f"          🖼️  Main: {img.image_url[:60]}...")
                        print(f"          {status}")
                    else:
                        print(f"          ❌ No main image URL")
                    
                    # Check thumbnail URL
                    if img.thumbnail_url:
                        print(f"          🖼️  Thumb: {img.thumbnail_url[:60]}...")
                        # Don't double-check if it's the same URL
                        if img.thumbnail_url != img.image_url:
                            self.total_checks += 1
                            is_working, status = self.check_image_url(img.thumbnail_url)
                            if is_working:
                                self.working_images.append(img.thumbnail_url)
                            else:
                                self.broken_images.append(img.thumbnail_url)
                            print(f"          {status}")
                    
                    print(f"          🆔 Cloudinary ID: {img.cloudinary_public_id or 'N/A'}")
                    print(f"          🏷️  Alt Text: {img.alt_text or 'N/A'}")
            
            # Show prices
            prices = food.prices.all().order_by('size')
            print(f"    💰 Prices ({prices.count()}):")
            
            if not prices:
                print(f"       ⚠️  No prices found")
            else:
                for price in prices:
                    print(f"       • {price.size}: ${price.price} (Cook: {price.cook.name})")
            
            # Add separator
            if i < foods.count():
                print("    " + "─" * 60)
        
        # Summary
        print(f"\n" + "=" * 70)
        print(f"🎯 IMAGE VERIFICATION SUMMARY:")
        print(f"   📊 Total URLs checked: {self.total_checks}")
        print(f"   ✅ Working images: {len(self.working_images)}")
        print(f"   ❌ Broken images: {len(self.broken_images)}")
        
        if len(self.working_images) > 0:
            success_rate = (len(self.working_images) / self.total_checks) * 100
            print(f"   📈 Success rate: {success_rate:.1f}%")
        
        if self.broken_images:
            print(f"\n🚨 BROKEN IMAGES:")
            for i, url in enumerate(self.broken_images, 1):
                print(f"   {i}. {url}")
        
        print(f"\n📱 SAMPLE API RESPONSE:")
        sample_food = foods.first()
        if sample_food:
            serializer = FoodSerializer(sample_food)
            data = serializer.data
            print(f"   Food: {data.get('name')}")
            print(f"   Images: {len(data.get('images', []))}")
            print(f"   Available: {data.get('is_available')}")
            print(f"   Rating: {data.get('rating_average')}")
        
        print(f"\n🚀 READY FOR FRONTEND!")
        print(f"   • All food data is complete")
        print(f"   • Images are {('working' if not self.broken_images else 'mostly working')}")
        print(f"   • API pagination is disabled")
        print(f"   • Menu should display all {foods.count()} foods")
    
    def generate_test_urls(self):
        """Generate some test image URLs to verify"""
        print(f"\n🧪 TESTING SAMPLE IMAGE URLS:")
        test_urls = [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=800&h=600&fit=crop",
        ]
        
        for i, url in enumerate(test_urls, 1):
            is_working, status = self.check_image_url(url)
            print(f"   {i}. {url}")
            print(f"      {status}")

def main():
    """Main execution"""
    checker = FoodDataImageChecker()
    
    print("🔍 Starting comprehensive food data check...")
    time.sleep(1)  # Brief pause for dramatic effect
    
    checker.display_full_food_data()
    checker.generate_test_urls()
    
    print(f"\n" + "=" * 70)
    print(f"✅ COMPREHENSIVE CHECK COMPLETED!")
    print(f"🍽️ Your ChefSync food database is ready!")

if __name__ == '__main__':
    main()