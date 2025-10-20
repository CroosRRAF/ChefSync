#!/usr/bin/env python3
"""
Migrate external image URLs to Cloudinary for better performance and control.
This script will download external images and upload them to Cloudinary.
"""
import os
import sys
import django
import requests
from pathlib import Path
import tempfile

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food
from utils.cloudinary_utils import upload_image_to_cloudinary

def download_image(url, timeout=30):
    """Download image from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
        return None

def migrate_external_urls():
    """Migrate all external URLs to Cloudinary"""
    print("🔄 Starting image migration to Cloudinary...")
    print("=" * 50)
    
    # Get all foods with external URLs
    foods = Food.objects.all()
    external_url_foods = []
    
    for food in foods:
        if food.image and str(food.image):
            image_url = str(food.image)
            if not 'cloudinary.com' in image_url and image_url.startswith('http'):
                external_url_foods.append(food)
    
    print(f"Found {len(external_url_foods)} foods with external URLs")
    
    if not external_url_foods:
        print("✅ No external URLs found. All images are already on Cloudinary.")
        return
    
    successful_migrations = 0
    failed_migrations = 0
    
    for i, food in enumerate(external_url_foods, 1):
        print(f"\n📸 Migrating {i}/{len(external_url_foods)}: {food.name}")
        
        original_url = str(food.image)
        print(f"  Original URL: {original_url}")
        
        # Download the image
        image_data = download_image(original_url)
        if not image_data:
            print(f"  ❌ Failed to download image")
            failed_migrations += 1
            continue
        
        # Generate a clean name for Cloudinary
        clean_name = "".join(c for c in food.name if c.isalnum() or c in (' ', '-', '_')).strip()
        clean_name = clean_name.replace(' ', '_').lower()
        
        # Upload to Cloudinary
        cloudinary_result = upload_image_to_cloudinary(
            image_data,
            folder='chefsync/foods',
            public_id=f"food_{food.food_id}_{clean_name}",
            tags=['chefsync', 'food', 'migrated']
        )
        
        if cloudinary_result and 'secure_url' in cloudinary_result:
            # Update the food record
            old_url = food.image
            food.image = cloudinary_result['secure_url']
            food.save()
            
            print(f"  ✅ Successfully migrated to Cloudinary")
            print(f"  New URL: {cloudinary_result['secure_url']}")
            successful_migrations += 1
        else:
            print(f"  ❌ Failed to upload to Cloudinary")
            failed_migrations += 1
    
    print("\n" + "=" * 50)
    print("📊 Migration Summary:")
    print(f"  ✅ Successful migrations: {successful_migrations}")
    print(f"  ❌ Failed migrations: {failed_migrations}")
    print(f"  📈 Success rate: {successful_migrations / len(external_url_foods) * 100:.1f}%")
    
    if successful_migrations > 0:
        print("\n🎉 Migration completed! Your food images are now hosted on Cloudinary.")
        print("   This will provide better performance, optimization, and reliability.")

def verify_migration():
    """Verify the migration results"""
    print("\n🔍 Verifying migration results...")
    
    foods = Food.objects.all()
    cloudinary_count = 0
    external_count = 0
    no_image_count = 0
    
    for food in foods:
        if food.image and str(food.image):
            image_url = str(food.image)
            if 'cloudinary.com' in image_url:
                cloudinary_count += 1
            else:
                external_count += 1
        else:
            no_image_count += 1
    
    print(f"  📊 Results:")
    print(f"    - Cloudinary URLs: {cloudinary_count}")
    print(f"    - External URLs: {external_count}")
    print(f"    - No images: {no_image_count}")
    
    if external_count == 0:
        print("  ✅ All images are now on Cloudinary!")
    else:
        print(f"  ⚠️  {external_count} images still use external URLs")

if __name__ == "__main__":
    # Check if user wants to proceed
    foods_with_external = Food.objects.filter(
        image__isnull=False
    ).exclude(image__contains='cloudinary.com')
    
    if foods_with_external.exists():
        print(f"Found {foods_with_external.count()} foods with external image URLs.")
        print("This script will download these images and upload them to Cloudinary.")
        print("This will improve performance and give you better control over image optimization.")
        
        response = input("\nDo you want to proceed with the migration? (y/N): ")
        if response.lower() in ['y', 'yes']:
            migrate_external_urls()
            verify_migration()
        else:
            print("Migration cancelled.")
    else:
        print("✅ All images are already on Cloudinary. No migration needed.")
        verify_migration()