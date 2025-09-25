#!/usr/bin/env python3
"""
Test script to verify the foods HTTP endpoint is working
"""

import requests
import json

def test_foods_http_endpoint():
    """Test the foods HTTP endpoint"""
    print("🧪 Testing foods HTTP endpoint...")
    
    try:
        # Test the foods endpoint
        print("\n1️⃣ Testing GET /api/food/foods/...")
        response = requests.get('http://localhost:8000/api/food/foods/')
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response keys: {list(data.keys())}")
            if 'results' in data:
                print(f"   Foods count: {len(data['results'])}")
                print(f"   Total count: {data.get('count', 'N/A')}")
                print(f"   Next page: {data.get('next', 'None')}")
                print(f"   Previous page: {data.get('previous', 'None')}")
            else:
                print(f"   Response: {data}")
        else:
            print(f"   Error: {response.text}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing foods HTTP endpoint: {str(e)}")
        return False

if __name__ == '__main__':
    print("🚀 Testing Foods HTTP Endpoint")
    print("=" * 50)
    
    success = test_foods_http_endpoint()
    
    if success:
        print("\n✅ Foods HTTP endpoint test completed!")
    else:
        print("\n❌ Foods HTTP endpoint test failed!")
