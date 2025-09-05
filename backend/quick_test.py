#!/usr/bin/env python
"""
Quick test script to verify authentication endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_login():
    """Test user login"""
    print("Testing user login...")
    
    # Test with admin user
    login_data = {
        "email": "testusernew@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Access token: {data.get('access', 'N/A')[:50]}...")
            return data.get('access')
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Server not running")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_registration():
    """Test user registration"""
    print("\nTesting user registration...")
    
    register_data = {
        "name": "Test User New",
        "email": "testusernew@example.com",
        "password": "testpass123",
        "confirm_password": "testpass123",
        "role": "customer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register/", json=register_data)
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Server not running")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Quick Authentication Test (New User)")
    print("=" * 40)
    
    # Test registration first
    registration_success = test_registration()
    
    # Test login
    login_success = test_login()
    
    print("\n" + "=" * 40)
    if registration_success and login_success:
        print("✅ Registration and login both succeeded!")
    else:
        print("❌ Some tests failed. Check the server status.")
