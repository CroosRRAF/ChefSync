#!/usr/bin/env python
"""
Simple API test for complete registration
"""
import requests
import json

# Test data that simulates what frontend sends
test_data = {
    "name": "Test User",
    "email": "api.test@example.com", 
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!",
    "role": "customer",
    "phone_no": "",
    "address": ""
}

print("🧪 Testing Complete Registration API Endpoint")
print("=" * 50)
print(f"📝 Test data: {json.dumps(test_data, indent=2)}")

try:
    response = requests.post(
        "http://127.0.0.1:8000/api/auth/complete-registration/", 
        json=test_data,
        timeout=10
    )
    
    print(f"\n📊 Response:")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Content: {response.text}")
    
    if response.status_code == 500:
        print("\n💥 500 Internal Server Error detected!")
        print("This matches the frontend error you're seeing.")
        
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to Django server")
    print("Make sure the server is running at http://127.0.0.1:8000")
except Exception as e:
    print(f"❌ Error: {e}")
