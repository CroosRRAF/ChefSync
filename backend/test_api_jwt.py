#!/usr/bin/env python
import requests
import json
import os
import sys
import django

# Setup Django environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.orders.models import CartItem
from apps.food.models import FoodPrice
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_api_with_jwt():
    """Test the place order API with JWT authentication"""
    print("Testing place order API with JWT...")
    
    # Get existing customer
    try:
        customer = User.objects.get(username='testcustomer')
        print(f"Using customer: {customer.username}")
    except User.DoesNotExist:
        print("Customer not found")
        return False
    
    # Create JWT token
    refresh = RefreshToken.for_user(customer)
    access_token = str(refresh.access_token)
    print(f"JWT token created for {customer.username}")
    
    # Make sure we have items in cart
    cart_items = CartItem.objects.filter(customer=customer)
    print(f"Cart items: {cart_items.count()}")
    
    if not cart_items.exists():
        # Add some items
        food_prices = FoodPrice.objects.filter(food__status='Approved')[:1]
        if food_prices.exists():
            CartItem.objects.create(
                customer=customer,
                price=food_prices[0],
                quantity=2
            )
            print(f"Added item to cart: {food_prices[0].food.name}")
        else:
            print("No food available to add to cart")
            return False
    
    # Get chef from cart items
    first_cart_item = CartItem.objects.filter(customer=customer).first()
    chef_user_id = first_cart_item.price.cook.user_id if first_cart_item.price.cook else None
    
    if not chef_user_id:
        print("No chef found in cart items")
        return False
    
    print(f"Chef ID from cart: {chef_user_id}")
    
    # Test data
    order_data = {
        'chef_id': chef_user_id,
        'delivery_latitude': 19.076,
        'delivery_longitude': 72.8777,
        'customer_notes': 'Test API order',
        'chef_latitude': 19.076,
        'chef_longitude': 72.8777,
        'chef_address': 'Test Kitchen Mumbai',
        'chef_city': 'Mumbai'
    }
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print("Making API request...")
    print(f"URL: http://127.0.0.1:8000/api/orders/place/")
    print(f"Data: {json.dumps(order_data, indent=2)}")
    
    try:
        response = requests.post(
            'http://127.0.0.1:8000/api/orders/place/',
            json=order_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Response text: {response.text}")
        
        return response.status_code in [200, 201]
        
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return False

if __name__ == "__main__":
    success = test_api_with_jwt()
    print(f"\nAPI Test {'PASSED' if success else 'FAILED'}")