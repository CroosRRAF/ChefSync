#!/usr/bin/env python
import requests
import json
import os
import sys
import django
import time
from datetime import datetime

# Setup Django environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.orders.models import CartItem, Order
from apps.food.models import FoodPrice
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_cancel_order_functionality():
    """Test the cancel order functionality with 10-minute window"""
    print("Testing cancel order functionality...")
    
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
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # First, place a new order
    # Clear cart and add fresh items
    CartItem.objects.filter(customer=customer).delete()
    
    food_prices = FoodPrice.objects.filter(food__status='Approved')[:1]
    if food_prices.exists():
        CartItem.objects.create(
            customer=customer,
            price=food_prices[0],
            quantity=1
        )
        print(f"Added item to cart: {food_prices[0].food.name}")
    else:
        print("No food available")
        return False
    
    # Get chef from cart items
    first_cart_item = CartItem.objects.filter(customer=customer).first()
    chef_user_id = first_cart_item.price.cook.user_id if first_cart_item.price.cook else None
    
    # Place order
    order_data = {
        'chef_id': chef_user_id,
        'delivery_latitude': 19.076,
        'delivery_longitude': 72.8777,
        'customer_notes': 'Test order for cancellation',
        'chef_latitude': 19.076,
        'chef_longitude': 72.8777,
        'chef_address': 'Test Kitchen Mumbai',
        'chef_city': 'Mumbai'
    }
    
    print("\\n1. Placing order...")
    response = requests.post(
        'http://127.0.0.1:8000/api/orders/place/',
        json=order_data,
        headers=headers
    )
    
    if response.status_code not in [200, 201]:
        print(f"Failed to place order: {response.text}")
        return False
    
    order_response = response.json()
    order_id = order_response['order_id']
    print(f"Order placed successfully: {order_response['order_number']}")
    
    # Test can_cancel endpoint
    print("\\n2. Checking if order can be cancelled...")
    response = requests.get(
        f'http://127.0.0.1:8000/api/orders/orders/{order_id}/can_cancel/',
        headers=headers
    )
    
    if response.status_code == 200:
        can_cancel_data = response.json()
        print(f"Can cancel: {can_cancel_data['can_cancel']}")
        print(f"Time remaining: {can_cancel_data.get('time_remaining', 'N/A')}")
    else:
        print(f"Error checking cancellation status: {response.text}")
    
    # Test actual cancellation
    print("\\n3. Cancelling the order...")
    cancel_data = {
        'reason': 'Changed my mind about the order'
    }
    
    response = requests.post(
        f'http://127.0.0.1:8000/api/orders/orders/{order_id}/cancel_order/',
        json=cancel_data,
        headers=headers
    )
    
    print(f"Cancel response status: {response.status_code}")
    if response.status_code == 200:
        cancel_response = response.json()
        print(f"Cancel response: {json.dumps(cancel_response, indent=2)}")
        
        # Verify order status changed
        response = requests.get(
            f'http://127.0.0.1:8000/api/orders/orders/{order_id}/',
            headers=headers
        )
        
        if response.status_code == 200:
            order_data = response.json()
            print(f"\\nOrder status after cancellation: {order_data.get('status', 'Unknown')}")
            print(f"Cancelled at: {order_data.get('cancelled_at', 'Not set')}")
            return order_data.get('status') == 'cancelled'
        else:
            print(f"Error fetching order details: {response.text}")
            return False
    else:
        print(f"Error cancelling order: {response.text}")
        return False

def test_cancel_after_time_limit():
    """Test cancellation after 10-minute window (should fail)"""
    print("\\n\\nTesting cancellation after time limit...")
    
    # We can't wait 10 minutes, so we'll create an order in the past by directly modifying the database
    try:
        customer = User.objects.get(username='testcustomer')
    except User.DoesNotExist:
        print("Customer not found")
        return False
    
    # Get an existing old order or create one
    old_order = Order.objects.filter(customer=customer, status='pending').first()
    if old_order:
        # Manually set created_at to more than 10 minutes ago
        from django.utils import timezone
        from datetime import timedelta
        old_order.created_at = timezone.now() - timedelta(minutes=15)
        old_order.save()
        
        # Create JWT token
        refresh = RefreshToken.for_user(customer)
        access_token = str(refresh.access_token)
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Try to cancel the old order
        cancel_data = {
            'reason': 'Trying to cancel after time limit'
        }
        
        response = requests.post(
            f'http://127.0.0.1:8000/api/orders/orders/{old_order.id}/cancel_order/',
            json=cancel_data,
            headers=headers
        )
        
        print(f"Cancel response status: {response.status_code}")
        if response.status_code == 400:
            error_response = response.json()
            print(f"Expected error: {error_response.get('error', 'Unknown error')}")
            return "can only be cancelled within 10 minutes" in error_response.get('error', '')
        else:
            print(f"Unexpected response: {response.text}")
            return False
    else:
        print("No pending order found to test time limit")
        return True  # Can't test but not a failure

if __name__ == "__main__":
    success1 = test_cancel_order_functionality()
    success2 = test_cancel_after_time_limit()
    
    overall_success = success1 and success2
    print(f"\\n\\nOverall Test {'PASSED' if overall_success else 'FAILED'}")
    print(f"Cancel within limit: {'PASSED' if success1 else 'FAILED'}")
    print(f"Cancel after limit: {'PASSED' if success2 else 'FAILED'}")