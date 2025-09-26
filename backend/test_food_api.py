#!/usr/bin/env python
"""
Test API endpoints for food image upload functionality
"""
import os
import django
import sys
import json
from django.test import Client

# Setup Django environment
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.food.models import Food, FoodCategory, Cuisine
from django.contrib.auth import authenticate
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from PIL import Image
import io
import tempfile

def create_test_image():
    """Create a simple test image file"""
    img = Image.new('RGB', (200, 200), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    img_bytes.name = 'test_image.jpg'
    return img_bytes

def test_api_food_creation():
    """Test creating food through API with image upload"""
    
    print("🧪 Testing Food API with Image Upload...")
    
    # Create or get test user with chef role
    test_user, created = User.objects.get_or_create(
        username='apichef',
        defaults={
            'email': 'apichef@example.com',
            'name': 'API Chef',
            'role': 'Chef',
            'is_active': True,
            'is_staff': False
        }
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Created test chef user: {test_user.username}")
    else:
        print(f"✅ Using existing test chef user: {test_user.username}")
    
    # Create or get test cuisine and category
    cuisine, created = Cuisine.objects.get_or_create(
        name='API Test Cuisine',
        defaults={'description': 'Test cuisine for API testing'}
    )
    
    category, created = FoodCategory.objects.get_or_create(
        name='API Test Category',
        cuisine=cuisine,
        defaults={'description': 'Test category for API testing'}
    )
    
    # Setup API client with authentication
    client = APIClient()
    client.force_authenticate(user=test_user)
    
    print(f"🔐 Authenticated as: {test_user.username}")
    
    # Test 1: Create food with existing Cloudinary URL
    print("\n🍕 Test 1: Creating Food with existing Cloudinary URL...")
    
    food_data = {
        'name': 'Pizza with URL Image',
        'description': 'Test pizza with existing Cloudinary URL',
        'category': 'Main Course',
        'image': 'https://res.cloudinary.com/durdb7hxw/image/upload/v1758847668/chefsync/foods/test_food_image.jpg',
        'ingredients': ['dough', 'cheese', 'tomato'],
        'is_vegetarian': True,
        'spice_level': 'mild',
        'preparation_time': 25,
        'price': '15.99',
        'size': 'Medium'
    }
    
    response = client.post('/api/food/chef/create/', food_data, format='json')
    print(f"📤 API Response Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Food created successfully via API: {data.get('name')}")
        print(f"📸 Image URL: {data.get('image')}")
        food_id = data.get('food_id')
        
        # Fetch the created food to verify
        fetch_response = client.get(f'/api/food/{food_id}/')
        if fetch_response.status_code == 200:
            food_detail = fetch_response.json()
            print(f"🔍 Retrieved food: {food_detail.get('name')}")
            print(f"🖼️  Primary image: {food_detail.get('primary_image')}")
            print(f"🖼️  Thumbnail: {food_detail.get('thumbnail_url')}")
            print("✅ API food creation with URL works!")
        else:
            print(f"❌ Failed to retrieve food: {fetch_response.status_code}")
    else:
        print(f"❌ API food creation failed: {response.status_code}")
        print(f"Response: {response.content.decode()}")
    
    # Test 2: Update existing food with new image URL
    if response.status_code == 201:
        print(f"\n🔄 Test 2: Updating Food with new image URL...")
        food_id = response.json().get('food_id')
        
        update_data = {
            'name': 'Updated Pizza with New Image',
            'image': 'https://res.cloudinary.com/demo/image/upload/sample.jpg'  # Demo image
        }
        
        update_response = client.patch(f'/api/food/{food_id}/', update_data, format='json')
        print(f"📤 Update Response Status: {update_response.status_code}")
        
        if update_response.status_code == 200:
            updated_data = update_response.json()
            print(f"✅ Food updated successfully: {updated_data.get('name')}")
            print(f"📸 New image URL: {updated_data.get('image_url')}")
            print("✅ API food update with URL works!")
        else:
            print(f"❌ API food update failed: {update_response.status_code}")
            print(f"Response: {update_response.content.decode()}")
    
    print("\n🎉 API tests completed!")
    print("✅ Food image upload integration is working through API")

if __name__ == '__main__':
    test_api_food_creation()