#!/usr/bin/env python
"""
Test the actual API endpoint that frontend calls
"""
import requests
import json

def test_frontend_api_call():
    """Test the API call exactly as the frontend would make it"""
    
    # Note: You'll need a real access token to test this fully
    # For now, let's test without authentication to see the endpoint response
    base_url = 'http://127.0.0.1:8000/api'
    
    print("🧪 Testing Frontend API Calls...")
    print("=" * 50)
    
    # Test 1: Check if orders endpoint exists
    try:
        print("1. Testing GET /orders/orders/ (without auth)")
        response = requests.get(f'{base_url}/orders/orders/')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("❌ Endpoint not found - URL routing issue")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Is it running on port 8000?")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Check dashboard stats endpoint
    try:
        print("\n2. Testing GET /orders/chef/dashboard/stats/ (without auth)")
        response = requests.get(f'{base_url}/orders/chef/dashboard/stats/')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Dashboard endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("❌ Dashboard endpoint not found")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Frontend API Test Complete")
    print("\n📋 Next Steps:")
    print("1. Make sure Django server is running: python manage.py runserver")  
    print("2. Test with actual authentication token from browser")
    print("3. Check browser console for any CORS or network errors")
    print("4. Verify the Order.tsx component is using correct API endpoints")

if __name__ == '__main__':
    test_frontend_api_call()