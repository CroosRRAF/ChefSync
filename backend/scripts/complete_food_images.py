#!/usr/bin/env python3
"""
Add high-quality images for remaining foods with missing or broken images
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

# Additional high-quality working image URLs
ADDITIONAL_FOOD_IMAGES = {
    'Spaghetti Carbonara': [
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    ],
    'Pad Thai': [
        'https://images.unsplash.com/photo-1559314809-0f31657def5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1559314809-0f31657def5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    ]
}

# Fallback URLs for foods that might need backup images
FALLBACK_URLS = {
    'Spaghetti Carbonara': [
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    ],
    'Pad Thai': [
        'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    ]
}

def check_image_url(url):
    """Check if image URL is accessible"""
    try:
        response = requests.head(url, timeout=10, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def add_missing_images():
    """Add images for foods with missing or broken images"""
    print("🔧 Adding images for remaining foods...")
    
    added_count = 0
    error_count = 0
    
    with transaction.atomic():
        # Process primary URLs
        for food_name, urls in ADDITIONAL_FOOD_IMAGES.items():
            try:
                food = Food.objects.get(name=food_name)
                print(f"\n🍽️ Processing: {food_name}")
                
                main_url = urls[0]
                thumb_url = urls[1]
                
                # Check if URLs work
                main_working = check_image_url(main_url)
                thumb_working = check_image_url(thumb_url)
                
                print(f"   Primary URLs - Main: {'✅' if main_working else '❌'}, Thumb: {'✅' if thumb_working else '❌'}")
                
                # If primary URLs don't work, try fallback
                if not (main_working and thumb_working) and food_name in FALLBACK_URLS:
                    fallback_urls = FALLBACK_URLS[food_name]
                    main_url = fallback_urls[0]
                    thumb_url = fallback_urls[1]
                    main_working = check_image_url(main_url)
                    thumb_working = check_image_url(thumb_url)
                    print(f"   Fallback URLs - Main: {'✅' if main_working else '❌'}, Thumb: {'✅' if thumb_working else '❌'}")
                
                if main_working and thumb_working:
                    # Update the existing broken image or create new one
                    images = food.images.all()
                    
                    if images.exists():
                        # Update first image
                        first_image = images.first()
                        first_image.image_url = main_url
                        first_image.thumbnail_url = thumb_url
                        first_image.cloudinary_public_id = f"sample_{food_name.lower().replace(' ', '_')}_updated"
                        first_image.alt_text = f"A beautifully prepared {food_name}"
                        first_image.save()
                        print(f"   ✅ Updated existing image")
                    else:
                        # Create new image
                        FoodImage.objects.create(
                            food=food,
                            image_url=main_url,
                            thumbnail_url=thumb_url,
                            cloudinary_public_id=f"sample_{food_name.lower().replace(' ', '_')}_new",
                            alt_text=f"A beautifully prepared {food_name}",
                            is_primary=True
                        )
                        print(f"   ✅ Created new image")
                    
                    added_count += 1
                else:
                    print(f"   ⚠️ No working URLs found for {food_name}")
                    error_count += 1
                    
            except Food.DoesNotExist:
                print(f"   ❌ Food '{food_name}' not found")
                error_count += 1
            except Exception as e:
                print(f"   ❌ Error processing {food_name}: {str(e)}")
                error_count += 1
    
    print(f"\n🎯 SUMMARY:")
    print(f"   ✅ Added/Updated: {added_count}")
    print(f"   ❌ Errors: {error_count}")

def final_verification():
    """Final verification of all food images"""
    print("\n🔍 Final verification of all food images...")
    
    foods = Food.objects.all().order_by('name')
    working_count = 0
    broken_count = 0
    missing_count = 0
    
    print("\n📋 DETAILED STATUS:")
    for food in foods:
        images = food.images.all()
        if not images.exists():
            print(f"❌ {food.name}: No images")
            missing_count += 1
            continue
            
        image = images.first()
        if image.image_url:
            if check_image_url(image.image_url):
                print(f"✅ {food.name}: Working image")
                working_count += 1
            else:
                print(f"❌ {food.name}: Broken image")
                broken_count += 1
        else:
            print(f"⚠️ {food.name}: No image URL")
            missing_count += 1
    
    total = working_count + broken_count + missing_count
    success_rate = (working_count / total * 100) if total > 0 else 0
    
    print(f"\n📊 FINAL RESULTS:")
    print(f"   ✅ Working: {working_count}")
    print(f"   ❌ Broken: {broken_count}")
    print(f"   📝 Missing: {missing_count}")
    print(f"   📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Excellent! Almost all images are working!")
    elif success_rate >= 75:
        print("👍 Good! Most images are working!")
    else:
        print("⚠️ Need more work on images!")

if __name__ == "__main__":
    print("🖼️ FOOD IMAGE COMPLETION TOOL")
    print("=" * 50)
    
    # Add missing images
    add_missing_images()
    
    # Final verification
    final_verification()
    
    print("\n✅ Image completion process finished!")