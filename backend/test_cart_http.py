#!/usr/bin/env python
"""Test cart API endpoints directly"""

import requests
import json

# Test configuration
BASE_URL = 'http://localhost:8000/api'
ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU4Nzg1ODg0LCJpYXQiOjE3NTg3ODIyODQsImp0aSI6ImMwNjg3ZDI5ZmVjMDQ4NjRiOGQ4NWZjZTAxMmQ3NjU4IiwidXNlcl9pZCI6IjE4In0.Ke41juJGesCeov3UWa6bGHwvL86kV6_zFej5V0GdgVM'

headers = {
    'Authorization': f'Bearer {ACCESS_TOKEN}',
    'Content-Type': 'application/json'
}

def test_cart_endpoints():
    print("🧪 Testing Cart API Endpoints via HTTP...")
    
    # Test 1: Get available foods first
    print("\n1️⃣ Getting available foods...")
    response = requests.get(f"{BASE_URL}/food/customer/foods/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        foods = response.json()
        print(f"✅ Found {len(foods)} foods")
        if foods:
            test_food = foods[0]
            print(f"Food structure: {list(test_food.keys())}")
            food_id = test_food.get('food_id') or test_food.get('id') or test_food.get('pk')
            print(f"Getting prices for food: {test_food['name']} (ID: {food_id})")
            
            # Get prices for this food
            print("\n1.2️⃣ Getting prices for the food...")
            response = requests.get(f"{BASE_URL}/food/customer/foods/{food_id}/prices/", headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                prices = response.json()
                print(f"✅ Found {len(prices)} prices")
                if prices:
                    test_price = prices[0]
                    print(f"Price structure: {list(test_price.keys())}")
                    print(f"Using test price: {test_price.get('size', 'N/A')} - ${test_price.get('price', 'N/A')}")
                    price_id = test_price.get('price_id') or test_price.get('id')
                    print(f"Price ID: {price_id}")
                else:
                    print("❌ No prices available for this food")
                    return
            else:
                print(f"❌ Failed to get prices: {response.text}")
                return
        else:
            print("❌ No foods available")
            return
    else:
        print(f"❌ Failed to get foods: {response.text}")
        return

    # Test 2: Clear cart first
    print("\n2️⃣ Clearing cart...")
    response = requests.delete(f"{BASE_URL}/orders/cart/clear_cart/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Cart cleared: {response.json()}")
    else:
        print(f"⚠️ Clear cart response: {response.text}")

    # Test 3: Add item to cart
    print("\n3️⃣ Adding item to cart...")
    cart_data = {
        'price_id': price_id,
        'quantity': 2,
        'special_instructions': 'Test from API'
    }
    response = requests.post(f"{BASE_URL}/orders/cart/add_to_cart/", 
                           json=cart_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        cart_item = response.json()
        print(f"✅ Added to cart: {cart_item}")
    else:
        print(f"❌ Failed to add to cart: {response.text}")
        return

    # Test 4: Get cart summary
    print("\n4️⃣ Getting cart summary...")
    response = requests.get(f"{BASE_URL}/orders/cart/cart_summary/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        summary = response.json()
        print(f"✅ Cart summary: {summary}")
    else:
        print(f"❌ Failed to get cart summary: {response.text}")

    print("\n🎉 Cart API HTTP test completed!")

if __name__ == '__main__':
    test_cart_endpoints()