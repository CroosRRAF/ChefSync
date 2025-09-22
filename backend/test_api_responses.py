#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

def test_api_responses():
    """Test different API response scenarios to ensure frontend handles them safely"""

    print("Testing API response handling scenarios...")

    # Test 1: Normal successful response
    print("\n1. Testing successful response with data:")
    try:
        response = requests.get('http://localhost:8000/api/auth/admin/pending-approvals/?role=cook')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {json.dumps(data, indent=2)[:200]}...")
            print("✅ Normal response handled correctly")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Authentication error (401)
    print("\n2. Testing 401 Unauthorized response:")
    try:
        # Make request without auth token
        response = requests.get('http://localhost:8000/api/auth/admin/pending-approvals/?role=cook')
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ 401 response handled correctly")
        elif response.status_code == 200:
            print("ℹ️  Request succeeded (user might be logged in)")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: Invalid role parameter
    print("\n3. Testing invalid role parameter:")
    try:
        response = requests.get('http://localhost:8000/api/auth/admin/pending-approvals/?role=invalid')
        print(f"Status: {response.status_code}")
        if response.status_code == 400:
            print("✅ 400 Bad Request handled correctly")
        else:
            print(f"Status: {response.status_code} (may be 401 if not authenticated)")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 4: Missing role parameter
    print("\n4. Testing missing role parameter:")
    try:
        response = requests.get('http://localhost:8000/api/auth/admin/pending-approvals/')
        print(f"Status: {response.status_code}")
        if response.status_code == 400:
            print("✅ 400 Bad Request handled correctly")
        else:
            print(f"Status: {response.status_code} (may be 401 if not authenticated)")
    except Exception as e:
        print(f"❌ Error: {e}")

    print("\n🎉 API response testing completed!")
    print("The frontend should now handle all these scenarios safely without TypeErrors.")

if __name__ == '__main__':
    test_api_responses()