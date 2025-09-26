#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.orders.models import CartItem
from apps.food.models import Food, FoodPrice
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

User = get_user_model()

def test_api_order_placement():
    """Test order placement via API"""
    print("Testing order placement API...")
    
    # Get or create a test customer
    try:
        customer = User.objects.get(username='testcustomer')
    except User.DoesNotExist:
        customer = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123'
        )
        print(f"Created customer: {customer.username}")
    
    # Get or create token for authentication
    token, created = Token.objects.get_or_create(user=customer)
    print(f"Customer token: {token.key}")
    
    # Get a chef with food
    try:
        chef = User.objects.get(username='testchef')
    except User.DoesNotExist:
        print("No test chef found. Creating one...")
        chef = User.objects.create_user(
            username='testchef',
            email='chef@test.com',
            password='testpass123'
        )
    
    # Get some food items
    food_prices = FoodPrice.objects.filter(food__status='Approved')[:2]
    if not food_prices.exists():
        print("No approved food items found. Cannot test order placement.")
        return False
    
    # Clear existing cart items
    CartItem.objects.filter(customer=customer).delete()
    
    # Add items to cart
    for food_price in food_prices:
        CartItem.objects.create(
            customer=customer,
            price=food_price,
            quantity=1,
            total_price=food_price.price
        )
    
    print(f"Added {CartItem.objects.filter(customer=customer).count()} items to cart")
    
    # Use APIClient instead of direct HTTP request
    client = APIClient()
    client.force_authenticate(user=customer)
    
    # Order data
    order_data = {
        'chef_id': chef.user_id,
        'delivery_latitude': 19.076,
        'delivery_longitude': 72.8777,
        'customer_notes': 'Test order via API',
        'chef_latitude': 19.076,
        'chef_longitude': 72.8777,
        'chef_address': 'Test Kitchen Mumbai',
        'chef_city': 'Mumbai'
    }
    
    print(f"Placing order with data: {json.dumps(order_data, indent=2)}")
    
    # Make API request
    response = client.post('/api/orders/place/', order_data, format='json')
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.json() if response.content else 'No content'}")
    
    return response.status_code == 201 or response.status_code == 200

if __name__ == "__main__":
    success = test_api_order_placement()
    print(f"\nAPI Test {'PASSED' if success else 'FAILED'}")