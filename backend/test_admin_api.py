#!/usr/bin/env python
"""
Test script for the fixed admin users list API endpoint
"""
import requests
import json
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def test_admin_users_endpoint():
    """Test the admin users list endpoint"""
    base_url = "http://127.0.0.1:8000"
    endpoint = "/api/admin/users/list_users/"

    # Test parameters
    params = {
        "page": 1,
        "limit": 10,
        "search": "",
        "role": "",
        "status": "",
        "sort_by": "date_joined",
        "sort_order": "desc"
    }

    print("Testing Admin Users List API Endpoint")
    print("=" * 50)
    print(f"URL: {base_url}{endpoint}")
    print(f"Method: GET")
    print(f"Parameters: {json.dumps(params, indent=2)}")
    print()

    try:
        # First, let's try to login to get a token
        print("Step 1: Attempting to login...")
        login_url = f"{base_url}/api/auth/login/"
        login_data = {
            "email": "admin1@chefsync.com",
            "password": "admin123"
        }

        login_response = requests.post(login_url, json=login_data)
        print(f"Login Response Status: {login_response.status_code}")

        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access')  # The response uses 'access' not 'access_token'

            if token:
                print("✓ Login successful, got access token")
                print()

                # Now test the users endpoint
                print("Step 2: Testing users list endpoint...")
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }

                response = requests.get(
                    f"{base_url}{endpoint}",
                    params=params,
                    headers=headers
                )

                print(f"Response Status: {response.status_code}")
                print(f"Response Headers: {dict(response.headers)}")
                print()

                if response.status_code == 200:
                    result = response.json()
                    print("✓ SUCCESS: API call successful!")
                    print(f"Response data keys: {list(result.keys())}")

                    if 'users' in result:
                        users = result['users']
                        print(f"✓ Found {len(users)} users")
                        if users:
                            print("Sample user data:")
                            print(json.dumps(users[0], indent=2))
                        else:
                            print("No users found in response")

                    if 'pagination' in result:
                        pagination = result['pagination']
                        print(f"Pagination info: {pagination}")

                else:
                    print("✗ FAILED: API call failed")
                    print(f"Error response: {response.text}")

            else:
                print("✗ Login failed: No access token received")
                print(f"Login response: {login_response.text}")

        else:
            print("✗ Login failed")
            print(f"Login response: {login_response.text}")

            # Try without authentication (if endpoint allows it)
            print()
            print("Step 2: Testing without authentication...")
            response = requests.get(f"{base_url}{endpoint}", params=params)
            print(f"Response Status: {response.status_code}")

            if response.status_code == 200:
                print("✓ Endpoint works without authentication")
            else:
                print("✗ Endpoint requires authentication")
                print(f"Error: {response.text}")

    except requests.exceptions.ConnectionError:
        print("✗ Connection Error: Cannot connect to Django server")
        print("Make sure the Django server is running on http://127.0.0.1:8000")
        print("Run: python manage.py runserver 8000")

    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_admin_users_endpoint()