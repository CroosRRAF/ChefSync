#!/usr/bin/env python
"""
Test script for authentication endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_registration():
    """Test user registration"""
    print("Testing user registration...")
    
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
        "confirm_password": "testpass123",
        "role": "customer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register/", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    """Test user login"""
    print("\nTesting user login...")
    
    data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_profile():
    """Test user profile endpoint"""
    print("\nTesting user profile...")
    
    # First login to get token
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            headers = {"Authorization": f"Bearer {token}"}
            
            profile_response = requests.get(f"{BASE_URL}/profile/", headers=headers)
            print(f"Profile Status Code: {profile_response.status_code}")
            print(f"Profile Response: {profile_response.json()}")
            return profile_response.status_code == 200
        else:
            print("Login failed, cannot test profile")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_token_management():
    """Test token management endpoints"""
    print("\nTesting token management...")
    
    # First login to get token
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test get user tokens
            tokens_response = requests.get(f"{BASE_URL}/tokens/", headers=headers)
            print(f"Get Tokens Status Code: {tokens_response.status_code}")
            print(f"Get Tokens Response: {tokens_response.json()}")
            
            # Test token info
            token_info_response = requests.get(f"{BASE_URL}/tokens/info/?token={token}", headers=headers)
            print(f"Token Info Status Code: {token_info_response.status_code}")
            print(f"Token Info Response: {token_info_response.json()}")
            
            return tokens_response.status_code == 200 and token_info_response.status_code == 200
        else:
            print("Login failed, cannot test token management")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_token_refresh():
    """Test token refresh endpoint"""
    print("\nTesting token refresh...")
    
    # First login to get tokens
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
        if login_response.status_code == 200:
            refresh_token = login_response.json().get('refresh')
            
            # Test token refresh
            refresh_data = {"refresh": refresh_token}
            refresh_response = requests.post(f"{BASE_URL}/token/refresh/", json=refresh_data)
            print(f"Token Refresh Status Code: {refresh_response.status_code}")
            print(f"Token Refresh Response: {refresh_response.json()}")
            
            return refresh_response.status_code == 200
        else:
            print("Login failed, cannot test token refresh")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Starting authentication tests...")
    
    # Test registration
    reg_success = test_registration()
    
    # Test login
    login_success = test_login()
    
    # Test profile
    profile_success = test_profile()
    
    # Test token management
    token_mgmt_success = test_token_management()
    
    # Test token refresh
    token_refresh_success = test_token_refresh()
    
    print(f"\nTest Results:")
    print(f"Registration: {'PASS' if reg_success else 'FAIL'}")
    print(f"Login: {'PASS' if login_success else 'FAIL'}")
    print(f"Profile: {'PASS' if profile_success else 'FAIL'}")
    print(f"Token Management: {'PASS' if token_mgmt_success else 'FAIL'}")
    print(f"Token Refresh: {'PASS' if token_refresh_success else 'FAIL'}")
    
    # Overall result
    all_passed = all([reg_success, login_success, profile_success, token_mgmt_success, token_refresh_success])
    print(f"\nOverall: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
