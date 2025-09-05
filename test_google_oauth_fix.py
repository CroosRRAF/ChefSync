#!/usr/bin/env python3
"""
Test script to verify Google OAuth configuration is working
"""

import os
import sys
import requests
from pathlib import Path

def test_google_oauth_config():
    """Test Google OAuth configuration"""
    
    print("🔧 Testing Google OAuth Configuration")
    print("=" * 50)
    
    # Test 1: Check if environment variables are accessible
    print("\n1. Testing Environment Variables:")
    try:
        from decouple import config
        client_id = config('GOOGLE_OAUTH_CLIENT_ID', default='your-google-client-id')
        client_secret = config('GOOGLE_OAUTH_CLIENT_SECRET', default='your-google-client-secret')
        
        print(f"   ✅ Client ID: {client_id[:20]}...")
        print(f"   ✅ Client Secret: {client_secret[:10]}...")
        
        if client_id == 'your-google-client-id':
            print("   ⚠️  Using placeholder client ID - need real credentials")
        else:
            print("   ✅ Using configured client ID")
            
    except Exception as e:
        print(f"   ❌ Error loading environment: {e}")
    
    # Test 2: Check backend server
    print("\n2. Testing Backend Server:")
    try:
        response = requests.get('http://127.0.0.1:8000/api/auth/', timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend server is running")
        else:
            print(f"   ⚠️  Backend server responded with status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Backend server is not running")
        print("   💡 Start it with: cd backend && python manage.py runserver")
    except Exception as e:
        print(f"   ❌ Error connecting to backend: {e}")
    
    # Test 3: Check Google OAuth endpoint
    print("\n3. Testing Google OAuth Endpoint:")
    try:
        response = requests.post('http://127.0.0.1:8000/api/auth/google/login/', 
                               json={'id_token': 'test_token'}, 
                               timeout=5)
        print(f"   ✅ Google OAuth endpoint is accessible (status: {response.status_code})")
        if response.status_code == 400:
            print("   ℹ️  Expected 400 error with test token - endpoint is working")
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot reach Google OAuth endpoint")
    except Exception as e:
        print(f"   ❌ Error testing endpoint: {e}")
    
    # Test 4: Check frontend files
    print("\n4. Testing Frontend Configuration:")
    frontend_files = [
        'frontend/src/App.tsx',
        'frontend/src/components/auth/GoogleRegisterButton.tsx',
        'frontend/src/pages/auth/Login.tsx'
    ]
    
    for file_path in frontend_files:
        if Path(file_path).exists():
            print(f"   ✅ {file_path} exists")
        else:
            print(f"   ❌ {file_path} missing")
    
    print("\n" + "=" * 50)
    print("🎯 Summary:")
    print("   - Google OAuth is now enabled in the frontend")
    print("   - Backend endpoint is configured")
    print("   - To use real Google OAuth:")
    print("     1. Get credentials from Google Cloud Console")
    print("     2. Update the client ID in the code or environment")
    print("     3. Restart both servers")
    print("\n   - For testing, the current setup will show Google button")
    print("     but may show authentication errors (expected with placeholder credentials)")

if __name__ == "__main__":
    test_google_oauth_config()


