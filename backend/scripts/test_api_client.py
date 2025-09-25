#!/usr/bin/env python3
"""
Simple test server to check food API without full Django runserver
"""
import os
import sys
import django
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse
import json

def test_food_api_client():
    """Test the Food API using Django test client"""
    print("🧪 TESTING FOOD API WITH DJANGO TEST CLIENT")
    print("=" * 55)
    
    try:
        client = Client()
        
        # Test the foods endpoint
        print("📡 Testing /api/food/foods/ endpoint...")
        
        # Try different requests
        test_cases = [
            {"url": "/api/food/foods/", "description": "Basic request"},
            {"url": "/api/food/foods/?page_size=1000", "description": "With page_size=1000"},
            {"url": "/api/food/foods/?page=1", "description": "With page=1"},
        ]
        
        for test_case in test_cases:
            print(f"\n🔍 {test_case['description']}")
            print(f"   URL: {test_case['url']}")
            
            response = client.get(test_case['url'])
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    if isinstance(data, list):
                        # Direct array response (pagination disabled)
                        foods_count = len(data)
                        print(f"   📊 Response: Direct array with {foods_count} foods")
                        
                        if foods_count >= 25:
                            print(f"   ✅ SUCCESS: Got all {foods_count} foods!")
                        else:
                            print(f"   ⚠️  Only got {foods_count} foods")
                            
                    elif isinstance(data, dict) and 'results' in data:
                        # Paginated response
                        foods_count = len(data['results'])
                        total_count = data.get('count', 'Unknown')
                        print(f"   📊 Response: Paginated with {foods_count} foods (total: {total_count})")
                        print(f"      Next: {data.get('next', 'None')}")
                        print(f"      Previous: {data.get('previous', 'None')}")
                        
                        if foods_count >= 25:
                            print(f"   ✅ SUCCESS: Got all foods in one page!")
                        elif foods_count == 10:
                            print(f"   ⚠️  PAGINATION STILL ACTIVE: Only 10 foods per page")
                        else:
                            print(f"   ⚠️  Got {foods_count} foods")
                    else:
                        print(f"   ❓ Unexpected response format")
                    
                    # Show sample food names
                    foods = data if isinstance(data, list) else data.get('results', [])
                    if foods:
                        print(f"   🍽️  First 3 foods:")
                        for i, food in enumerate(foods[:3]):
                            name = food.get('name', 'Unknown')
                            food_id = food.get('food_id', 'N/A')
                            print(f"      {i+1}. {name} (ID: {food_id})")
                        
                except json.JSONDecodeError:
                    print(f"   ❌ Invalid JSON response")
                    print(f"      Content: {response.content[:200]}...")
            else:
                print(f"   ❌ HTTP {response.status_code}")
                print(f"      Content: {response.content[:200]}...")
        
        print(f"\n" + "=" * 55)
        print(f"🏁 API TEST COMPLETED")
        
        # Test other endpoints too
        print(f"\n🔍 Testing other endpoints:")
        other_endpoints = [
            "/api/food/cuisines/",
            "/api/food/categories/",
        ]
        
        for endpoint in other_endpoints:
            response = client.get(endpoint)
            print(f"   {endpoint}: Status {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else len(data.get('results', []))
                    print(f"      Items: {count}")
                except:
                    print(f"      JSON parse error")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_food_api_client()