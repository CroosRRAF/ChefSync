"""
Test complete order placement flow with chef coordinates
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.authentication.models import Cook
from apps.orders.models import CartItem
from apps.food.models import Food, FoodPrice
from django.contrib.auth import authenticate
import json

User = get_user_model()
client = Client()

def create_test_data():
    """Create test users, chef, food, and cart items"""
    
    # Create customer user
    customer, _ = User.objects.get_or_create(
        email='test_customer@example.com',
        defaults={
            'name': 'Test Customer',
            'role': 'customer',
            'username': 'test_customer',
        }
    )
    customer.set_password('testpass123')
    customer.save()
    
    # Create chef user
    chef, _ = User.objects.get_or_create(
        email='test_chef@example.com',
        defaults={
            'name': 'Test Chef',
            'role': 'cook',
            'username': 'test_chef',
        }
    )
    
    # Create Cook profile (no kitchen_location to test fallback)
    cook_profile, _ = Cook.objects.get_or_create(
        user=chef,
        defaults={
            'specialty': 'Italian',
            'kitchen_location': None  # This will trigger the fallback
        }
    )
    
    # Create test food and price
    food, _ = Food.objects.get_or_create(
        name='Test Pizza',
        defaults={
            'description': 'Test food item',
            'category': 'Italian',
            'is_vegetarian': True,
        }
    )
    
    food_price, _ = FoodPrice.objects.get_or_create(
        food=food,
        cook=chef,
        size='Medium',
        defaults={'price': 25.00}
    )
    
    # Create cart item for customer
    cart_item, _ = CartItem.objects.get_or_create(
        customer=customer,
        price=food_price,
        defaults={'quantity': 2}
    )
    
    return customer, chef, cook_profile, cart_item

def test_order_placement():
    """Test the complete order placement flow"""
    print("Setting up test data...")
    customer, chef, cook_profile, cart_item = create_test_data()
    
    print(f"Customer: {customer.name} (ID: {customer.user_id})")
    print(f"Chef: {chef.name} (ID: {chef.user_id})")
    print(f"Chef kitchen_location before: {cook_profile.kitchen_location}")
    
    # Login as customer
    client.login(email='test_customer@example.com', password='testpass123')
    
    # Prepare order data with chef coordinates (simulating frontend)
    order_data = {
        'chef_id': chef.user_id,
        'delivery_latitude': 19.0760,
        'delivery_longitude': 72.8777,
        'customer_notes': 'Test order with chef coordinates',
        'chef_latitude': 19.076,   # These should be used by fallback
        'chef_longitude': 72.8777,
        'chef_address': 'Test Kitchen Mumbai',
        'chef_city': 'Mumbai'
    }
    
    print("\nOrder data:")
    print(json.dumps(order_data, indent=2))
    
    # Make the order placement request
    print("\nPlacing order...")
    response = client.post(
        '/api/orders/place/',
        data=json.dumps(order_data),
        content_type='application/json'
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.json()}")
    
    # Check if chef profile was updated
    cook_profile.refresh_from_db()
    print(f"\nChef kitchen_location after: {cook_profile.kitchen_location}")
    
    # Check if Kitchen address was created
    from apps.orders.models import UserAddress
    kitchen_address = UserAddress.objects.filter(user=chef, label='Kitchen').first()
    if kitchen_address:
        print(f"Kitchen address created: {kitchen_address.address_line1}")
        print(f"Kitchen coordinates: {kitchen_address.latitude}, {kitchen_address.longitude}")
    
    return response.status_code == 201

if __name__ == "__main__":
    success = test_order_placement()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")