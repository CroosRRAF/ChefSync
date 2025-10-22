#!/usr/bin/env python3
"""
Test script to verify that the food API returns optimized image URLs
"""
import requests
import json

def test_food_api():
    """Test the food list API endpoint"""
    try:
        # Test the customer food list endpoint (this should be the public one)
        response = requests.get('http://localhost:8000/api/food/customer/foods/')
        
        if response.status_code == 200:
            foods = response.json()
            print(f"✅ API returned {len(foods)} foods")
            
            # Test first few foods
            for i, food in enumerate(foods[:3]):
                print(f"\n📍 Food {i+1}: {food.get('name', 'Unknown')}")
                print(f"  Original image: {food.get('image', 'None')}")
                print(f"  Image URL: {food.get('image_url', 'None')}")
                print(f"  Primary image: {food.get('primary_image', 'None')}")
                print(f"  Optimized URL: {food.get('optimized_image_url', 'None')}")
                print(f"  Thumbnail URL: {food.get('thumbnail_url', 'None')}")
        
        else:
            print(f"❌ API request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

def test_food_search():
    """Test the food search endpoint"""
    try:
        # Try the search endpoint that was mentioned in the URL patterns
        response = requests.get('http://localhost:8000/api/food/search/?q=chicken')
        
        if response.status_code == 200:
            results = response.json()
            print(f"\n🔍 Search returned {len(results)} results for 'chicken'")
            
            for result in results[:2]:
                print(f"  - {result.get('name')}: {result.get('image_url', 'No image')}")
        else:
            print(f"❌ Search API failed with status {response.status_code}")
            
        # Also try searching for a food that definitely exists
        response2 = requests.get('http://localhost:8000/api/food/search/?q=payasam')
        if response2.status_code == 200:
            results2 = response2.json()
            print(f"🔍 Search returned {len(results2)} results for 'payasam'")
            for result in results2[:1]:
                print(f"  - {result.get('name')}: {result.get('image_url', 'No image')}")
            
    except Exception as e:
        print(f"❌ Error testing search API: {e}")

if __name__ == "__main__":
    print("🧪 Testing Food API Image URLs")
    print("=" * 50)
    
    test_food_api()
    test_food_search()
    
    print("\n✅ Test completed!")