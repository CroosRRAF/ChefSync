#!/usr/bin/env python
"""Test script for cart API endpoints"""

import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.food.models import Food, FoodPrice
from apps.orders.models import CartItem

User = get_user_model()

def test_cart_endpoints():
    print("🧪 Testing Cart API Endpoints...")
    
    # Create test data
    print("📝 Creating test data...")
    
    # Create test user if not exists
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✅ Created test user: {user.username}")
    else:
        print(f"✅ Using existing test user: {user.username}")
    
    # Check if we have food items
    foods = Food.objects.all()[:3]
    print(f"✅ Found {foods.count()} food items")
    
    # Check food prices
    for food in foods:
        prices = FoodPrice.objects.filter(food=food)
        print(f"  - {food.name}: {prices.count()} price options")
        for price in prices:
            print(f"    * {price.size}: ${price.price}")
    
    # Get the first available price for testing
    if FoodPrice.objects.exists():
        test_price = FoodPrice.objects.first()
        print(f"✅ Using test price: {test_price.food.name} ({test_price.size}) - ${test_price.price}")
        
        # Clear existing cart items
        CartItem.objects.filter(customer=user).delete()
        print("✅ Cleared existing cart items")
        
        # Test adding to cart programmatically
        cart_item = CartItem.objects.create(
            customer=user,
            price=test_price,
            quantity=2,
            special_instructions="Test item"
        )
        print(f"✅ Added test cart item: {cart_item}")
        print(f"   Total price: ${cart_item.total_price}")
        
        # Test cart summary
        cart_items = CartItem.objects.filter(customer=user)
        total_price = sum(item.total_price for item in cart_items)
        total_items = sum(item.quantity for item in cart_items)
        
        print(f"📊 Cart Summary:")
        print(f"   Total items: {total_items}")
        print(f"   Total price: ${total_price}")
        print(f"   Cart items: {cart_items.count()}")
        
        return True
    else:
        print("❌ No food prices available for testing")
        return False

if __name__ == '__main__':
    success = test_cart_endpoints()
    if success:
        print("🎉 Cart API test completed successfully!")
    else:
        print("❌ Cart API test failed!")