#!/usr/bin/env python3
"""
Simple test script to verify ChefSync authentication endpoints
"""

import requests
import json

# Base URLs
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:8080"

def test_backend_health():
    """Test if backend is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/admin/")
        print(f"✅ Backend is running (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running")
        return False

def test_frontend_health():
    """Test if frontend is responding"""
    try:
        response = requests.get(FRONTEND_URL)
        print(f"✅ Frontend is running (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Frontend is not running")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    endpoints = [
        "/api/auth/register/",
        "/api/auth/login/",
        "/api/auth/verify-email/",
        "/api/auth/password/reset/",
        "/api/auth/password/reset/confirm/",
        "/api/auth/google/login/",
    ]
    
    print("\n🔐 Testing Authentication Endpoints:")
    for endpoint in endpoints:
        try:
            response = requests.options(f"{BACKEND_URL}{endpoint}")
            if response.status_code in [200, 405]:  # OPTIONS method allowed
                print(f"✅ {endpoint} - Accessible")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"❌ {endpoint} - Connection failed")

def main():
    """Main test function"""
    print("🧪 ChefSync Authentication Test")
    print("=" * 40)
    
    # Test backend health
    backend_ok = test_backend_health()
    
    # Test frontend health
    frontend_ok = test_frontend_health()
    
    # Test auth endpoints if backend is running
    if backend_ok:
        test_auth_endpoints()
    
    print("\n" + "=" * 40)
    if backend_ok and frontend_ok:
        print("🎉 All systems are running!")
        print(f"🌐 Frontend: {FRONTEND_URL}")
        print(f"🔧 Backend: {BACKEND_URL}")
        print("\n📝 Next steps:")
        print("1. Open frontend in browser")
        print("2. Test registration at /auth/register")
        print("3. Check backend console for verification emails")
    else:
        print("❌ Some systems are not running properly")

if __name__ == "__main__":
    main()
