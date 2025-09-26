#!/usr/bin/env python
"""
Test script to verify food image upload functionality
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
import tempfile
from PIL import Image
import io

def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (200, 200), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_food_image_upload():
    """Test creating a food item with image upload"""
    
    print("🧪 Testing Food Image Upload to Cloudinary...")
    
    # Create or get test user
    test_user, created = User.objects.get_or_create(
        username='testchef',
        defaults={
            'email': 'testchef@example.com',
            'name': 'Test Chef',
            'role': 'Chef',
            'is_active': True
        }
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Created test user: {test_user.username}")
    else:
        print(f"✅ Using existing test user: {test_user.username}")
    
    # Create or get test cuisine and category
    cuisine, created = Cuisine.objects.get_or_create(
        name='Test Cuisine',
        defaults={'description': 'Test cuisine for image upload'}
    )
    
    category, created = FoodCategory.objects.get_or_create(
        name='Test Category',
        cuisine=cuisine,
        defaults={'description': 'Test category for image upload'}
    )
    
    # Test 1: Upload image directly to Cloudinary
    print("\n📤 Test 1: Direct Cloudinary Upload...")
    test_image = create_test_image()
    
    result = upload_image_to_cloudinary(
        image_data=test_image,
        folder='chefsync/foods',
        public_id='test_food_image',
        tags=['test', 'food']
    )
    
    if result and result.get('secure_url'):
        print(f"✅ Image uploaded successfully: {result['secure_url']}")
        cloudinary_url = result['secure_url']
    else:
        print("❌ Failed to upload image to Cloudinary")
        return
    
    # Test 2: Create Food with Cloudinary URL
    print("\n🍔 Test 2: Creating Food with Cloudinary Image URL...")
    
    food_data = {
        'name': 'Test Food with Image',
        'description': 'This is a test food item with Cloudinary image',
        'category': 'Main Course',
        'image': cloudinary_url,  # Use the uploaded URL
        'chef': test_user,
        'food_category': category,
        'is_available': True,
        'preparation_time': 30,
        'ingredients': ['ingredient1', 'ingredient2'],
        'is_vegetarian': True,
        'spice_level': 'medium'
    }
    
    try:
        food = Food.objects.create(**food_data)
        print(f"✅ Food created successfully: {food.name} (ID: {food.food_id})")
        print(f"📸 Image URL: {food.image}")
        print(f"🔗 Image URL property: {food.image_url}")
        print(f"🖼️  Optimized URL: {food.optimized_image_url}")
        print(f"🖼️  Thumbnail URL: {food.thumbnail_url}")
        
        # Test the model properties
        if food.image_url:
            print("✅ image_url property works")
        else:
            print("❌ image_url property not working")
            
        if food.optimized_image_url:
            print("✅ optimized_image_url property works")
        else:
            print("❌ optimized_image_url property not working")
            
    except Exception as e:
        print(f"❌ Failed to create food: {e}")
        return
    
    print("\n🎉 All tests completed successfully!")
    print(f"Food ID {food.food_id} is ready with Cloudinary image integration")

if __name__ == '__main__':
    test_food_image_upload()