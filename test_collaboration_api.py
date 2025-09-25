#!/usr/bin/env python3

import requests
import json

# Test the available_chefs endpoint
def test_available_chefs():
    url = "http://127.0.0.1:8000/api/orders/bulk/available_chefs/"
    
    print("Testing available_chefs endpoint...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Available chefs: {len(data)} found")
            for chef in data:
                print(f"  - {chef.get('name', 'Unknown')} (@{chef.get('username', 'Unknown')})")
                print(f"    Active assignments: {chef.get('active_assignments', 0)}")
                print(f"    Status: {chef.get('availability_status', 'unknown')}")
        elif response.status_code == 401:
            print("Authentication required - this is expected for protected endpoints")
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"Error: {e}")

# Test the collaborate endpoint (should require auth)
def test_collaborate_endpoint():
    url = "http://127.0.0.1:8000/api/orders/bulk/1/collaborate/"
    
    print("\nTesting collaborate endpoint...")
    print(f"URL: {url}")
    
    test_data = {
        "chef_id": 2,
        "message": "Test collaboration message",
        "work_distribution": "Split preparation 50/50"
    }
    
    try:
        response = requests.post(url, json=test_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("Authentication required - this is expected for protected endpoints")
        else:
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_available_chefs()
    test_collaborate_endpoint()