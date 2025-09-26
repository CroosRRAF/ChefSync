#!/usr/bin/env python
"""
Script to test the orders API endpoint and troubleshoot why orders aren't showing
"""
import requests
import json
import os

def test_orders_api():
    """Test the orders API endpoint"""
    base_url = 'http://127.0.0.1:8000/api'
    
    # You'll need to replace this with a valid access token
    # Get this from localStorage in your browser dev tools: localStorage.getItem('access_token')
    access_token = input("Please enter your access token from localStorage: ").strip()
    
    if not access_token:
        print("❌ No access token provided. Please get it from browser localStorage.")
        return
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print("🧪 Testing Orders API Endpoints...")
    print("=" * 50)
    
    # Test 1: Get all orders
    try:
        print("\n1. Testing GET /orders/orders/")
        response = requests.get(f'{base_url}/orders/orders/', headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and 'results' in data:
                orders = data['results']
                print(f"✅ Found {len(orders)} orders in results")
            elif isinstance(data, list):
                orders = data
                print(f"✅ Found {len(orders)} orders in list")
            else:
                orders = []
                print(f"⚠️  Unexpected data format: {type(data)}")
            
            print(f"Orders data: {json.dumps(data, indent=2)}")
            
            # Show order details
            if orders:
                print(f"\nFirst order details:")
                first_order = orders[0]
                print(f"  Order ID: {first_order.get('id')}")
                print(f"  Order Number: {first_order.get('order_number')}")
                print(f"  Status: {first_order.get('status')}")
                print(f"  Customer: {first_order.get('customer_name')}")
                print(f"  Chef: {first_order.get('chef_name')}")
                print(f"  Total: ${first_order.get('total_amount')}")
            else:
                print("  📝 No orders returned")
                
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    
    # Test 2: Test user profile to see current user info
    try:
        print("\n2. Testing GET /auth/profile/ (Current User)")
        response = requests.get(f'{base_url}/auth/profile/', headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            profile = response.json()
            print(f"✅ Current user profile:")
            print(f"  User ID: {profile.get('id')}")
            print(f"  Name: {profile.get('name')}")
            print(f"  Email: {profile.get('email')}")
            print(f"  Role: {profile.get('role')}")
            print(f"  Username: {profile.get('username')}")
        else:
            print(f"❌ Profile error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Profile request failed: {e}")

    # Test 3: Check dashboard stats
    try:
        print("\n3. Testing GET /orders/chef/dashboard/stats/")
        response = requests.get(f'{base_url}/orders/chef/dashboard/stats/', headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Dashboard stats:")
            print(f"  Orders Active: {stats.get('orders_active')}")
            print(f"  Orders Completed: {stats.get('orders_completed')}")
            print(f"  Pending Orders: {stats.get('pending_orders')}")
            print(f"  Today Revenue: ${stats.get('today_revenue')}")
        else:
            print(f"❌ Stats error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Stats request failed: {e}")

    print("\n" + "=" * 50)
    print("🏁 API Testing Complete")

if __name__ == '__main__':
    test_orders_api()