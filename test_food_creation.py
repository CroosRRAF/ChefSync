#!/usr/bin/env python3

import requests
import json

def test_food_creation():
    """Test food creation API endpoint"""
    url = "http://127.0.0.1:8000/api/food/chef/foods/"
    
    print("Testing food creation endpoint...")
    print(f"URL: {url}")
    
    # Test data without image
    test_data = {
        "name": "Test Food Item",
        "description": "A delicious test food item",
        "category": "Main Course", 
        "ingredients": '["rice", "vegetables", "spices"]',
        "is_vegetarian": "true",
        "is_vegan": "false",
        "spice_level": "medium",
        "is_available": "true",
        "price": "15.99",
        "size": "Medium",
        "preparation_time": "20"
    }
    
    try:
        response = requests.post(url, data=test_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("Authentication required - this is expected for protected endpoints")
        elif response.status_code == 201:
            print("✅ Food creation successful!")
            print(f"Response: {response.json()}")
        elif response.status_code == 400:
            print("❌ Bad Request - validation failed")
            print(f"Error details: {response.json()}")
        else:
            print(f"Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_food_creation()