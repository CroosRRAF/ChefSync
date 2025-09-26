#!/usr/bin/env python3
"""
Test script to verify the toggle-availability endpoint works correctly
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_toggle_endpoint():
    """Test the toggle-availability endpoint"""
    
    print("Testing toggle-availability endpoint...")
    
    # First, let's check if the endpoint exists without authentication
    try:
        response = requests.patch(f"{BASE_URL}/users/chef-profiles/1/toggle-availability/")
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.text}")
        
        if response.status_code == 401:
            print("✓ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("✗ Endpoint not found - this is the issue!")
        else:
            print(f"Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"Error testing endpoint: {e}")

    # Also test the general chef-profiles endpoint
    try:
        response = requests.get(f"{BASE_URL}/users/chef-profiles/")
        print(f"\nGeneral endpoint status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ General chef-profiles endpoint exists but requires authentication")
        elif response.status_code == 404:
            print("✗ General chef-profiles endpoint not found!")
        else:
            print(f"Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"Error testing general endpoint: {e}")

if __name__ == "__main__":
    test_toggle_endpoint()