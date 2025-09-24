#!/usr/bin/env python3
"""
Fix broken image URLs and add missing images for food items
"""
import os
import sys
import django
import requests
from django.db import transaction

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodImage

# High-quality food image URLs from reliable sources
FOOD_IMAGE_URLS = {
    # Italian Foods
    'Margherita Pizza': [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop'
    ],
    'Spaghetti Carbonara': [
        'https://images.unsplash.com/photo-1560963905-6c7c44a4dc85?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560963905-6c7c44a4dc85?w=300&h=200&fit=crop'
    ],
    'Lasagna': [
        'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=300&h=200&fit=crop'
    ],
    'Chicken Parmigiana': [
        'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&h=200&fit=crop'
    ],
    'Tiramisu': [
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop'
    ],

    # Chinese Foods (fix broken ones)
    'Beef with Broccoli': [
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop'
    ],
    'Fried Rice': [
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop'
    ],

    # Mexican Foods (fix broken ones)
    'Nachos Supreme': [
        'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&h=200&fit=crop'
    ],
    'Quesadilla': [
        'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=300&h=200&fit=crop'
    ],

    # Thai Food (fix broken one)
    'Pad Thai': [
        'https://images.unsplash.com/photo-1625938145312-56e08bd14cdb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1625938145312-56e08bd14cdb?w=300&h=200&fit=crop'
    ]
}

def check_image_url(url):
    """Check if image URL is accessible"""
    try:
        response = requests.head(url, timeout=10, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def fix_food_images():
    """Fix broken images and add missing images"""
    print("🔧 Starting food image fix process...")
    
    fixed_count = 0
    error_count = 0
    
    with transaction.atomic():
        for food_name, urls in FOOD_IMAGE_URLS.items():
            try:
                food = Food.objects.get(name=food_name)
                print(f"\n🍽️ Processing: {food_name}")
                
                # Check if URLs are working
                main_url = urls[0]
                thumb_url = urls[1]
                
                main_working = check_image_url(main_url)
                thumb_working = check_image_url(thumb_url)
                
                print(f"   Main URL: {main_url}")
                print(f"   Status: {'✅ OK' if main_working else '❌ BROKEN'}")
                print(f"   Thumb URL: {thumb_url}")
                print(f"   Status: {'✅ OK' if thumb_working else '❌ BROKEN'}")
                
                if main_working and thumb_working:
                    # Update or create food images
                    images = food.images.all()
                    
                    if images.exists():
                        # Update existing images
                        first_image = images.first()
                        first_image.image_url = main_url
                        first_image.thumbnail_url = thumb_url
                        first_image.cloudinary_public_id = f"sample_{food_name.lower().replace(' ', '_')}_fixed"
                        first_image.alt_text = f"A beautifully prepared {food_name}"
                        first_image.save()
                        print(f"   ✅ Updated existing image")
                    else:
                        # Create new image
                        FoodImage.objects.create(
                            food=food,
                            image_url=main_url,
                            thumbnail_url=thumb_url,
                            cloudinary_public_id=f"sample_{food_name.lower().replace(' ', '_')}_fixed",
                            alt_text=f"A beautifully prepared {food_name}",
                            is_primary=True
                        )
                        print(f"   ✅ Created new image")
                    
                    fixed_count += 1
                else:
                    print(f"   ⚠️ Skipping {food_name} - URLs not accessible")
                    error_count += 1
                    
            except Food.DoesNotExist:
                print(f"   ❌ Food '{food_name}' not found")
                error_count += 1
            except Exception as e:
                print(f"   ❌ Error processing {food_name}: {str(e)}")
                error_count += 1
    
    print(f"\n🎯 SUMMARY:")
    print(f"   ✅ Fixed foods: {fixed_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📊 Total processed: {len(FOOD_IMAGE_URLS)}")

def verify_all_images():
    """Verify all food images after fixes"""
    print("\n🔍 Verifying all food images...")
    
    foods = Food.objects.all().order_by('name')
    working_count = 0
    broken_count = 0
    missing_count = 0
    
    for food in foods:
        images = food.images.all()
        if not images.exists():
            print(f"❌ {food.name}: No images")
            missing_count += 1
            continue
            
        for image in images:
            if image.image_url:
                if check_image_url(image.image_url):
                    print(f"✅ {food.name}: Working image")
                    working_count += 1
                else:
                    print(f"❌ {food.name}: Broken image - {image.image_url}")
                    broken_count += 1
            else:
                print(f"⚠️ {food.name}: No main image URL")
                missing_count += 1
    
    print(f"\n📊 FINAL IMAGE STATUS:")
    print(f"   ✅ Working: {working_count}")
    print(f"   ❌ Broken: {broken_count}")
    print(f"   📝 Missing: {missing_count}")
    print(f"   📈 Success Rate: {(working_count / (working_count + broken_count + missing_count) * 100):.1f}%")

if __name__ == "__main__":
    print("🔧 FOOD IMAGE FIXER")
    print("=" * 50)
    
    # Fix the images
    fix_food_images()
    
    # Verify all images
    verify_all_images()
    
    print("\n✅ Image fix process completed!")