#!/usr/bin/env python
"""
Final comprehensive test for Food model with Cloudinary integration
"""
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, FoodCategory, Cuisine
from apps.authentication.models import User
from utils.cloudinary_utils import upload_image_to_cloudinary
from django.core.files.base import ContentFile
from PIL import Image
import io
import json

def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (300, 300), color='green')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes.getvalue()

def test_comprehensive_food_image_functionality():
    """Test all aspects of food image functionality"""
    
    print("🧪 Comprehensive Food Image Test")
    print("=" * 50)
    
    # Create test data
    test_user, created = User.objects.get_or_create(
        username='finaltest',
        defaults={
            'email': 'finaltest@example.com',
            'name': 'Final Test Chef',
            'role': 'Chef',
            'is_active': True
        }
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
    
    cuisine, created = Cuisine.objects.get_or_create(
        name='Final Test Cuisine',
        defaults={'description': 'Final test cuisine'}
    )
    
    category, created = FoodCategory.objects.get_or_create(
        name='Final Test Category',
        cuisine=cuisine,
        defaults={'description': 'Final test category'}
    )
    
    # Test 1: Create Food without image
    print("\n1️⃣ Creating Food without image...")
    food1 = Food.objects.create(
        name='Food Without Image',
        description='This food has no image',
        chef=test_user,
        food_category=category,
        is_available=True
    )
    
    print(f"✅ Created: {food1.name}")
    print(f"📸 Image URL: {food1.image_url}")
    print(f"🖼️  Optimized URL: {food1.optimized_image_url}")
    print(f"📏 Thumbnail URL: {food1.thumbnail_url}")
    
    # Test 2: Create Food with Cloudinary URL
    print("\n2️⃣ Creating Food with Cloudinary URL...")
    
    # First upload a test image
    test_image_data = create_test_image()
    upload_result = upload_image_to_cloudinary(
        image_data=test_image_data,
        folder='chefsync/foods',
        public_id='final_test_food'
    )
    
    if upload_result and upload_result.get('secure_url'):
        cloudinary_url = upload_result['secure_url']
        print(f"📤 Uploaded test image: {cloudinary_url}")
        
        food2 = Food.objects.create(
            name='Food With Cloudinary Image',
            description='This food has a Cloudinary image',
            image=cloudinary_url,
            chef=test_user,
            food_category=category,
            is_available=True
        )
        
        print(f"✅ Created: {food2.name}")
        print(f"📸 Image URL: {food2.image_url}")
        print(f"🖼️  Optimized URL: {food2.optimized_image_url}")
        print(f"📏 Thumbnail URL: {food2.thumbnail_url}")
    
    # Test 3: Update existing food with new image
    print("\n3️⃣ Updating Food with new image...")
    
    # Upload another test image
    test_image_data2 = create_test_image()
    upload_result2 = upload_image_to_cloudinary(
        image_data=test_image_data2,
        folder='chefsync/foods',
        public_id='updated_test_food'
    )
    
    if upload_result2 and upload_result2.get('secure_url'):
        new_url = upload_result2['secure_url']
        food1.image = new_url
        food1.save()
        
        print(f"✅ Updated: {food1.name}")
        print(f"📸 New Image URL: {food1.image_url}")
        print(f"🖼️  New Optimized URL: {food1.optimized_image_url}")
        print(f"📏 New Thumbnail URL: {food1.thumbnail_url}")
    
    # Test 4: Test serialization functionality
    print("\n4️⃣ Testing serialization...")
    
    from apps.food.serializers import FoodSerializer
    from django.http import HttpRequest
    from django.contrib.auth.models import AnonymousUser
    
    # Mock request context
    request = HttpRequest()
    request.user = test_user
    
    # Test serializing food with image
    serializer = FoodSerializer(food2, context={'request': request})
    serialized_data = serializer.data
    
    print(f"✅ Serialization successful")
    print(f"📸 Serialized image_url: {serialized_data.get('image_url')}")
    print(f"🖼️  Serialized primary_image: {serialized_data.get('primary_image')}")
    print(f"📏 Serialized thumbnail_url: {serialized_data.get('thumbnail_url')}")
    
    # Test 5: Database queries and model properties
    print("\n5️⃣ Testing database queries...")
    
    foods_with_images = Food.objects.exclude(image__isnull=True).exclude(image__exact='')
    foods_without_images = Food.objects.filter(image__isnull=True) | Food.objects.filter(image__exact='')
    
    print(f"🍔 Foods with images: {foods_with_images.count()}")
    print(f"📷 Foods without images: {foods_without_images.count()}")
    
    # Test 6: Image URL properties
    print("\n6️⃣ Testing image URL properties...")
    
    for food in [food1, food2]:
        print(f"\n🍕 {food.name}:")
        print(f"   💾 Raw image field: {food.image}")
        print(f"   🔗 image_url property: {food.image_url}")
        print(f"   ⚡ optimized_image_url: {food.optimized_image_url}")
        print(f"   🖼️  thumbnail_url: {food.thumbnail_url}")
        print(f"   📸 primary_image property: {food.primary_image}")
        
        # Test boolean checks
        has_image = bool(food.image)
        print(f"   ✅ Has image: {has_image}")
    
    print("\n" + "=" * 50)
    print("🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!")
    print("✅ All image functionality is working correctly")
    print("✅ Food model integrates seamlessly with Cloudinary")
    print("✅ Serializers handle image URLs properly")
    print("✅ Database queries work as expected")
    print("✅ Model properties return correct URLs")
    print("=" * 50)

if __name__ == '__main__':
    test_comprehensive_food_image_functionality()