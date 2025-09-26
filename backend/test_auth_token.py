#!/usr/bin/env python3
"""
Test authentication with a real user to get a valid token for frontend testing
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_login_and_chef_profile():
    """Test login and chef profile access"""
    
    # Test credentials - using one of the chef users from the database
    test_credentials = {
        "email": "mario@chefsync.com",
        "password": "chef123"  # Password from create_sample_cook_data.py
    }
    
    print("🔐 Testing Login and Chef Profile Access")
    print("=" * 50)
    
    # Step 1: Login
    print("1. Attempting login...")
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login/", json=test_credentials)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            access_token = login_data.get('access')
            print(f"✅ Login successful! Token: {access_token[:20]}..." if access_token else "❌ No token received")
            
            if access_token:
                # Step 2: Test chef profiles endpoint
                headers = {'Authorization': f'Bearer {access_token}'}
                
                print("\n2. Testing chef profiles endpoint...")
                chef_response = requests.get(f"{BASE_URL}/users/chef-profiles/", headers=headers)
                print(f"Chef profiles status: {chef_response.status_code}")
                
                if chef_response.status_code == 200:
                    chef_data = chef_response.json()
                    print(f"✅ Chef profiles response: {json.dumps(chef_data, indent=2)}")
                    
                    # Step 3: Test toggle availability if we have a chef profile
                    chef_profiles = chef_data.get('results', chef_data)
                    if isinstance(chef_profiles, list) and len(chef_profiles) > 0:
                        chef_id = chef_profiles[0]['id']
                        print(f"\n3. Testing toggle availability for chef ID {chef_id}...")
                        
                        toggle_response = requests.patch(
                            f"{BASE_URL}/users/chef-profiles/{chef_id}/toggle-availability/",
                            headers=headers
                        )
                        print(f"Toggle status: {toggle_response.status_code}")
                        if toggle_response.status_code == 200:
                            toggle_data = toggle_response.json()
                            print(f"✅ Toggle response: {json.dumps(toggle_data, indent=2)}")
                        else:
                            print(f"❌ Toggle failed: {toggle_response.text}")
                    
                else:
                    print(f"❌ Chef profiles failed: {chef_response.text}")
            
        else:
            print(f"❌ Login failed: {login_response.text}")
            
            # Try with different credentials
            alt_credentials = {
                "email": "mario@chefsync.com", 
                "password": "mario123"  # Common password pattern
            }
            
            print(f"\n   Trying alternative password...")
            alt_response = requests.post(f"{BASE_URL}/auth/login/", json=alt_credentials)
            print(f"   Alt login status: {alt_response.status_code}")
            if alt_response.status_code == 200:
                print(f"   ✅ Alternative login worked!")
                alt_data = alt_response.json()
                access_token = alt_data.get('access')
                if access_token:
                    print(f"\n   📋 FRONTEND TEST TOKEN:")
                    print(f"   localStorage.setItem('access_token', '{access_token}');")
                    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login_and_chef_profile()