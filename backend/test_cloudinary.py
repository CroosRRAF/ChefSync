#!/usr/bin/env python
"""
Quick script to test Cloudinary integration and image migration
"""
import os
import sys
import django

# Setup Django environment
sys.path.append('/app/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.cloudinary_utils import upload_image_to_cloudinary, migrate_blob_to_cloudinary
from apps.food.models import Food, Cuisine, FoodCategory


def test_cloudinary_connection():
    """Test basic Cloudinary connection"""
    print("Testing Cloudinary connection...")
    
    # Test with a simple base64 image (1x1 pixel red dot)
    test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    result = upload_image_to_cloudinary(
        image_data=test_image,
        folder='test',
        tags=['test', 'connection']
    )
    
    if result and 'secure_url' in result:
        print(f"✅ Cloudinary connection successful!")
        print(f"Test image URL: {result['secure_url']}")
        return True
    else:
        print("❌ Cloudinary connection failed!")
        return False


def check_blob_data():
    """Check for existing blob data in the database"""
    print("\nChecking for blob data in models...")
    
    # Check Foods with potential blob data
    foods_with_images = Food.objects.exclude(image__isnull=True).exclude(image='')
    blob_count = 0
    
    for food in foods_with_images[:5]:  # Check first 5
        if hasattr(food, 'image') and food.image:
            image_str = str(food.image)
            if not image_str.startswith(('http', 'data:')) and len(image_str) > 100:
                blob_count += 1
                print(f"Found potential blob data in Food '{food.name}': {len(image_str)} chars")
    
    # Check Cuisines
    cuisines_with_images = Cuisine.objects.exclude(image__isnull=True).exclude(image='')
    for cuisine in cuisines_with_images[:5]:
        if cuisine.image:
            image_str = str(cuisine.image)
            if not image_str.startswith(('http', 'data:')) and len(image_str) > 100:
                blob_count += 1
                print(f"Found potential blob data in Cuisine '{cuisine.name}': {len(image_str)} chars")
    
    print(f"Total potential blob data items found: {blob_count}")
    return blob_count > 0


if __name__ == "__main__":
    print("🚀 Testing ChefSync Cloudinary Integration")
    print("=" * 50)
    
    # Test connection
    connection_ok = test_cloudinary_connection()
    
    if connection_ok:
        # Check for blob data
        has_blob_data = check_blob_data()
        
        if has_blob_data:
            print("\n📋 Next steps:")
            print("1. Run migration command: python manage.py migrate_images_to_cloudinary --dry-run")
            print("2. If dry-run looks good, run: python manage.py migrate_images_to_cloudinary")
            print("3. Test the API endpoints with new image uploads")
        else:
            print("\n✅ No blob data found. System is ready for Cloudinary uploads!")
    
    print("\n" + "=" * 50)
    print("Test completed!")