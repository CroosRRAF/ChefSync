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

from apps.food.models import Food

print("🖼️  Checking Image URLs in Database:")
print("=" * 50)

# Check all food items and their images
foods = Food.objects.all()
print(f"Total Food Items: {foods.count()}")

cloudinary_count = 0
online_url_count = 0
no_image_count = 0
invalid_url_count = 0

for food in foods:
    print(f"\n📍 Food: {food.name}")
    
    # Check main image field
    if hasattr(food, 'image') and food.image:
        image_url = str(food.image)
        print(f"  Main Image: {image_url}")
        
        if 'cloudinary.com' in image_url:
            cloudinary_count += 1
            print("  ✅ Cloudinary URL")
        elif image_url.startswith('http'):
            online_url_count += 1
            print("  🌐 Online URL")
        else:
            invalid_url_count += 1
            print("  ❌ Invalid/Local URL")
    else:
        no_image_count += 1
        print("  ⚠️  No main image")

print("\n" + "=" * 50)
print("📊 Summary:")
print(f"  - Cloudinary URLs: {cloudinary_count}")
print(f"  - Online URLs: {online_url_count}")
print(f"  - No Image: {no_image_count}")
print(f"  - Invalid URLs: {invalid_url_count}")

# Check for common issues
print("\n🔍 Checking for common issues:")

# Check for mixed URL types
mixed_foods = []
for food in foods:
    if hasattr(food, 'image') and food.image:
        main_url = str(food.image)
        # Since there's only one image per food item, check if it's properly formatted
        if not (main_url.startswith('http://') or main_url.startswith('https://')):
            mixed_foods.append(food.name)

if mixed_foods:
    print(f"  ❌ Foods with invalid URL formats: {len(mixed_foods)}")
    for food_name in mixed_foods[:5]:  # Show first 5
        print(f"    - {food_name}")
else:
    print("  ✅ All URLs have valid formats")

# Check for broken/invalid URLs
print("\n🔧 Checking URL patterns:")
invalid_patterns = []

for food in foods:
    if hasattr(food, 'image') and food.image:
        url = str(food.image)
        if not url.startswith(('http://', 'https://')):
            invalid_patterns.append((food.name, url))

if invalid_patterns:
    print(f"  ❌ Invalid URL patterns found: {len(invalid_patterns)}")
    for food_name, url in invalid_patterns[:5]:
        print(f"    - {food_name}: {url}")
else:
    print("  ✅ All URLs have valid patterns")