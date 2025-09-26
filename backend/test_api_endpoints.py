#!/usr/bin/env python3
"""
Test the chef profile API endpoints to verify they work correctly
"""

import requests
import json

def test_chef_profiles_endpoint():
    """Test the chef profiles endpoint"""
    
    print("🧪 Testing Chef Profiles API Endpoints")
    print("=" * 50)
    
    # Base URL
    base_url = "http://127.0.0.1:8000/api"
    
    # Test endpoints
    endpoints = [
        "/users/chef-profiles/",
        "/chef-profile/",  # Old incorrect endpoint
        "/chef-profiles/",  # Alternative
    ]
    
    for endpoint in endpoints:
        print(f"\n🔗 Testing: {base_url}{endpoint}")
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    if 'results' in data:
                        print(f"   Type: Paginated response")
                        print(f"   Results count: {len(data['results'])}")
                        if data['results']:
                            print(f"   Sample chef: {data['results'][0].get('user', 'N/A')}")
                    else:
                        print(f"   Type: Direct response")
                        print(f"   Keys: {list(data.keys())}")
                elif isinstance(data, list):
                    print(f"   Type: List response")
                    print(f"   Count: {len(data)}")
                
            elif response.status_code == 401:
                print(f"   ⚠️  Authentication required")
            else:
                print(f"   ❌ Error: {response.text[:100]}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection failed - Django server not running")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_chef_profiles_endpoint()