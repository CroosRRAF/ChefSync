#!/usr/bin/env python3
"""
Test the Food API to check if all 25 foods are returned
"""
import requests
import json

def test_food_api():
    """Test if the food API returns all 25 foods"""
    print("🧪 TESTING FOOD API PAGINATION FIX")
    print("=" * 50)
    
    try:
        # Test the API endpoint
        base_url = "http://localhost:8000"
        api_url = f"{base_url}/api/food/foods/"
        
        print(f"📡 Making request to: {api_url}")
        
        # Test with different parameters
        test_cases = [
            {"params": {}, "description": "No parameters"},
            {"params": {"page_size": 1000}, "description": "With page_size=1000"},
            {"params": {"page": 1}, "description": "With page=1"},
        ]
        
        for test_case in test_cases:
            print(f"\n🔍 Testing: {test_case['description']}")
            print(f"   Parameters: {test_case['params']}")
            
            try:
                response = requests.get(api_url, params=test_case['params'], timeout=10)
                
                print(f"   Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check if it's paginated response or direct array
                    if isinstance(data, dict) and 'results' in data:
                        foods = data['results']
                        print(f"   📊 Paginated Response:")
                        print(f"      Count: {data.get('count', 'N/A')}")
                        print(f"      Foods returned: {len(foods)}")
                        print(f"      Next: {data.get('next', 'None')}")
                        print(f"      Previous: {data.get('previous', 'None')}")
                    elif isinstance(data, list):
                        foods = data
                        print(f"   📊 Direct Array Response:")
                        print(f"      Foods returned: {len(foods)}")
                    else:
                        print(f"   ❓ Unexpected response format: {type(data)}")
                        continue
                    
                    # Show first few food names
                    if foods:
                        print(f"   🍽️  Sample foods:")
                        for i, food in enumerate(foods[:5]):
                            name = food.get('name', 'Unknown')
                            food_id = food.get('food_id', 'N/A')
                            print(f"      {i+1}. {name} (ID: {food_id})")
                        
                        if len(foods) > 5:
                            print(f"      ... and {len(foods) - 5} more")
                    
                    # Check if we got all 25 foods
                    if len(foods) >= 25:
                        print(f"   ✅ SUCCESS: Got {len(foods)} foods (>=25)")
                    elif len(foods) == 10:
                        print(f"   ⚠️  PAGINATION ISSUE: Only got 10 foods (pagination still active)")
                    else:
                        print(f"   ⚠️  Got {len(foods)} foods (expected 25)")
                        
                else:
                    print(f"   ❌ HTTP Error: {response.status_code}")
                    print(f"      Response: {response.text[:200]}...")
                    
            except requests.exceptions.ConnectionError:
                print(f"   ❌ CONNECTION ERROR: Cannot connect to {base_url}")
                print(f"      Make sure Django server is running")
            except requests.exceptions.Timeout:
                print(f"   ❌ TIMEOUT: Request took longer than 10 seconds")
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
        
        print("\n" + "=" * 50)
        print("🏁 API TEST COMPLETED")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == '__main__':
    test_food_api()