#!/usr/bin/env python
"""
Comprehensive test for the fixed order placement and cancellation system
"""
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
from apps.orders.models import CartItem, Order
from apps.food.models import FoodPrice
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def comprehensive_order_test():
    """Comprehensive test of the order system"""
    print("=== COMPREHENSIVE ORDER SYSTEM TEST ===\\n")
    
    # Setup
    try:
        customer = User.objects.get(username='testcustomer')
        print(f"✓ Using customer: {customer.username}")
    except User.DoesNotExist:
        print("✗ Customer not found")
        return False
    
    refresh = RefreshToken.for_user(customer)
    access_token = str(refresh.access_token)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Clear cart and add items
    print("\\n1. PREPARING CART")
    CartItem.objects.filter(customer=customer).delete()
    
    food_prices = FoodPrice.objects.filter(food__status='Approved')[:2]
    if not food_prices.exists():
        print("✗ No food available")
        return False
    
    for food_price in food_prices:
        CartItem.objects.create(
            customer=customer,
            price=food_price,
            quantity=1
        )
        print(f"✓ Added to cart: {food_price.food.name} (₹{food_price.price})")
    
    # Test 2: Calculate checkout
    print("\\n2. TESTING CHECKOUT CALCULATION")
    first_cart_item = CartItem.objects.filter(customer=customer).first()
    chef_user_id = first_cart_item.price.cook.user_id if first_cart_item.price.cook else None
    
    checkout_data = {
        'chef_id': chef_user_id,
        'delivery_latitude': 19.076,
        'delivery_longitude': 72.8777,
        'chef_latitude': 19.076,
        'chef_longitude': 72.8777,
    }
    
    response = requests.post(
        'http://127.0.0.1:8000/api/orders/checkout/calculate/',
        json=checkout_data,
        headers=headers
    )
    
    if response.status_code == 200:
        checkout = response.json()
        print(f"✓ Subtotal: ₹{checkout['subtotal']}")
        print(f"✓ Tax: ₹{checkout['tax_amount']}")
        print(f"✓ Delivery Fee: ₹{checkout['delivery_fee']}")
        print(f"✓ Total: ₹{checkout['total_amount']}")
        print(f"✓ Distance: {checkout['distance_km']} km")
    else:
        print(f"✗ Checkout calculation failed: {response.text}")
        return False
    
    # Test 3: Place order
    print("\\n3. PLACING ORDER")
    order_data = {
        'chef_id': chef_user_id,
        'delivery_latitude': 19.076,
        'delivery_longitude': 72.8777,
        'customer_notes': 'Comprehensive test order',
        'chef_latitude': 19.076,
        'chef_longitude': 72.8777,
        'chef_address': 'Test Kitchen Mumbai',
        'chef_city': 'Mumbai'
    }
    
    response = requests.post(
        'http://127.0.0.1:8000/api/orders/place/',
        json=order_data,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        order_response = response.json()
        order_id = order_response['order_id']
        print(f"✓ Order placed successfully!")
        print(f"  Order Number: {order_response['order_number']}")
        print(f"  Order ID: {order_id}")
        print(f"  Status: {order_response['status']}")
        print(f"  Total: ₹{order_response['total_amount']}")
    else:
        print(f"✗ Order placement failed: {response.text}")
        return False
    
    # Test 4: Check cancellation eligibility
    print("\\n4. CHECKING CANCELLATION ELIGIBILITY")
    response = requests.get(
        f'http://127.0.0.1:8000/api/orders/orders/{order_id}/can_cancel/',
        headers=headers
    )
    
    if response.status_code == 200:
        cancel_info = response.json()
        print(f"✓ Can cancel: {cancel_info['can_cancel']}")
        print(f"✓ Time remaining: {cancel_info['time_remaining']}")
        if cancel_info.get('time_remaining_seconds'):
            print(f"✓ Seconds remaining: {cancel_info['time_remaining_seconds']}")
    else:
        print(f"✗ Failed to check cancellation: {response.text}")
        return False
    
    # Test 5: Get order details
    print("\\n5. FETCHING ORDER DETAILS")
    response = requests.get(
        f'http://127.0.0.1:8000/api/orders/orders/{order_id}/',
        headers=headers
    )
    
    if response.status_code == 200:
        order_details = response.json()
        print(f"✓ Order retrieved successfully")
        print(f"  Status: {order_details.get('status', 'N/A')}")
        print(f"  Created: {order_details.get('created_at', 'N/A')}")
        print(f"  Customer Notes: {order_details.get('customer_notes', 'None')}")
    else:
        print(f"✗ Failed to fetch order: {response.text}")
        return False
    
    # Test 6: Cancel the order
    print("\\n6. CANCELLING ORDER")
    cancel_data = {
        'reason': 'Comprehensive test - order cancellation verification'
    }
    
    response = requests.post(
        f'http://127.0.0.1:8000/api/orders/orders/{order_id}/cancel_order/',
        json=cancel_data,
        headers=headers
    )
    
    if response.status_code == 200:
        cancel_response = response.json()
        print(f"✓ Order cancelled successfully!")
        print(f"  Message: {cancel_response['message']}")
        print(f"  Refund Status: {cancel_response['refund_status']}")
        print(f"  New Status: {cancel_response['status']}")
    else:
        print(f"✗ Order cancellation failed: {response.text}")
        return False
    
    # Test 7: Verify cancellation
    print("\\n7. VERIFYING CANCELLATION")
    response = requests.get(
        f'http://127.0.0.1:8000/api/orders/orders/{order_id}/',
        headers=headers
    )
    
    if response.status_code == 200:
        order_details = response.json()
        final_status = order_details.get('status', 'unknown')
        print(f"✓ Final order status: {final_status}")
        
        if final_status == 'cancelled':
            print("✓ Order cancellation confirmed!")
            return True
        else:
            print(f"✗ Order status should be 'cancelled' but is '{final_status}'")
            return False
    else:
        print(f"✗ Failed to verify cancellation: {response.text}")
        return False

def test_order_edge_cases():
    """Test edge cases and error handling"""
    print("\\n\\n=== TESTING EDGE CASES ===\\n")
    
    try:
        customer = User.objects.get(username='testcustomer')
    except User.DoesNotExist:
        print("✗ Customer not found for edge case tests")
        return False
    
    refresh = RefreshToken.for_user(customer)
    access_token = str(refresh.access_token)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Place order with empty cart
    print("1. TESTING EMPTY CART")
    CartItem.objects.filter(customer=customer).delete()
    
    order_data = {
        'chef_id': 1,
        'delivery_latitude': 19.076,
        'delivery_longitude': 72.8777,
        'customer_notes': 'Empty cart test'
    }
    
    response = requests.post(
        'http://127.0.0.1:8000/api/orders/place/',
        json=order_data,
        headers=headers
    )
    
    if response.status_code == 400:
        error_data = response.json()
        if 'Cart is empty' in error_data.get('error', ''):
            print("✓ Empty cart properly rejected")
        else:
            print(f"✗ Unexpected error: {error_data}")
            return False
    else:
        print(f"✗ Empty cart should fail but got status: {response.status_code}")
        return False
    
    # Test 2: Try to cancel non-existent order
    print("\\n2. TESTING INVALID ORDER CANCELLATION")
    response = requests.post(
        'http://127.0.0.1:8000/api/orders/orders/99999/cancel_order/',
        json={'reason': 'Testing invalid order'},
        headers=headers
    )
    
    if response.status_code == 404:
        print("✓ Invalid order ID properly rejected")
    else:
        print(f"✗ Expected 404 for invalid order, got: {response.status_code}")
        return False
    
    print("\\n✓ All edge case tests passed!")
    return True

if __name__ == "__main__":
    print("Starting comprehensive order system tests...\\n")
    
    success1 = comprehensive_order_test()
    success2 = test_order_edge_cases()
    
    print("\\n\\n=== TEST SUMMARY ===")
    print(f"Comprehensive Test: {'PASSED' if success1 else 'FAILED'}")
    print(f"Edge Case Tests: {'PASSED' if success2 else 'FAILED'}")
    
    overall_success = success1 and success2
    print(f"\\nOVERALL RESULT: {'✓ ALL TESTS PASSED' if overall_success else '✗ SOME TESTS FAILED'}")
    
    if overall_success:
        print("\\n🎉 The order placement and cancellation system is working perfectly!")
        print("\\nKey features implemented:")
        print("  ✓ Fixed order placement API (resolved decimal/float mixing)")
        print("  ✓ Order cancellation within 10-minute window")
        print("  ✓ Cancellation eligibility check with remaining time")
        print("  ✓ Proper error handling and validation")
        print("  ✓ JWT authentication support")
        print("  ✓ Order status tracking")
        print("  ✓ Refund status management")
    else:
        print("\\n❌ Please check the failed tests above.")