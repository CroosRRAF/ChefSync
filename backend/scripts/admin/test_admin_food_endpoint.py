#!/usr/bin/env python3
"""
Test script for Admin Food Management endpoint
Tests the new /api/food/admin/foods/ endpoint
"""

import os
import sys
import django
import requests
import json

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.food.models import Food, FoodCategory, Cuisine
from apps.authentication.models import User

def test_admin_food_endpoint():
    """Test the admin food management endpoint"""
    
    print("🧪 Testing Admin Food Management Endpoint")
    print("=" * 50)
    
    # Create test admin user if not exists
    User = get_user_model()
    admin_user, created = User.objects.get_or_create(
        username='test_admin',
        defaults={
            'email': 'admin@test.com',
            'first_name': 'Test',
            'last_name': 'Admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        admin_user.set_password('testpass123')
        admin_user.save()
        print("✅ Created test admin user")
    else:
        print("✅ Using existing test admin user")
    
    # Get admin token
    token_url = 'http://localhost:8000/api/auth/login/'
    login_data = {
        'username': 'test_admin',
        'password': 'testpass123'
    }
    
    try:
        response = requests.post(token_url, json=login_data)
        if response.status_code == 200:
            token = response.json().get('access')
            print("✅ Successfully obtained admin token")
        else:
            print(f"❌ Failed to get token: {response.status_code}")
            print(response.text)
            return
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running on port 8000")
        return
    
    # Test admin foods endpoint
    admin_foods_url = 'http://localhost:8000/api/food/admin/foods/'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n📋 Testing GET /api/food/admin/foods/")
    try:
        response = requests.get(admin_foods_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully retrieved {len(data.get('results', []))} foods")
            print(f"Total count: {data.get('count', 0)}")
        else:
            print(f"❌ Failed to get foods: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server")
        return
    
    # Test PATCH method (update food)
    if Food.objects.exists():
        food = Food.objects.first()
        update_url = f'http://localhost:8000/api/food/admin/foods/{food.id}/'
        
        print(f"\n📝 Testing PATCH /api/food/admin/foods/{food.id}/")
        update_data = {
            'name': f'{food.name} (Updated)',
            'description': 'Updated description for testing'
        }
        
        try:
            response = requests.patch(update_url, json=update_data, headers=headers)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Successfully updated food item")
                updated_food = response.json().get('food', {})
                print(f"Updated name: {updated_food.get('name')}")
            else:
                print(f"❌ Failed to update food: {response.text}")
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to server")
    else:
        print("⚠️  No foods found to test update functionality")
    
    print("\n🎉 Admin Food Management Endpoint Test Complete!")

if __name__ == '__main__':
    test_admin_food_endpoint()
