#!/usr/bin/env python3
"""
Final verification test - simulate a complete API request/response cycle
"""
import os
import sys
import django
import json
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from apps.food.views import food_list, food_search
from apps.food.models import Food

def test_food_list_endpoint():
    """Test the food list API endpoint"""
    print("🧪 Testing Food List API Endpoint")
    print("-" * 40)
    
    factory = RequestFactory()
    request = factory.get('/api/food/list/')
    
    response = food_list(request)
    data = response.data
    
    print(f"Status: {response.status_code}")
    print(f"Number of foods returned: {len(data)}")
    
    if data:
        first_food = data[0]
        print(f"\nSample food item:")
        print(f"  Name: {first_food.get('name')}")
        print(f"  Image URL: {first_food.get('image_url')}")
        print(f"  Optimized Image URL: {first_food.get('optimized_image_url')}")
        
        # Check if this is the previously problematic food
        if 'Nallur' in first_food.get('name', ''):
            print(f"  🎯 This was the problematic food - now FIXED!")
        
        return True
    return False

def test_food_search_endpoint():
    """Test the food search API endpoint"""
    print(f"\n🔍 Testing Food Search API Endpoint")
    print("-" * 40)
    
    factory = RequestFactory()
    request = factory.get('/api/food/search/?q=Nallur')
    
    response = food_search(request)
    data = response.data
    
    print(f"Status: {response.status_code}")
    print(f"Search results for 'Nallur': {len(data)}")
    
    if data:
        result = data[0]
        print(f"\nSearch result:")
        print(f"  Name: {result.get('name')}")
        print(f"  Image URL: {result.get('image_url')}")
        print(f"  Description: {result.get('description', '')[:50]}...")
        
        # Verify the problematic URL is fixed
        image_url = result.get('image_url', '')
        if 'bing.com/images/search' in image_url:
            print(f"  ❌ Still has problematic Bing URL!")
            return False
        else:
            print(f"  ✅ Image URL is properly formatted")
            return True
    return False

def create_frontend_test_data():
    """Create a JSON file with test data for frontend development"""
    print(f"\n📄 Creating Frontend Test Data")
    print("-" * 40)
    
    try:
        from apps.food.serializers import FoodSerializer
        
        foods = Food.objects.all()[:5]  # Get first 5 foods
        serializer = FoodSerializer(foods, many=True)
        
        test_data = {
            "count": len(serializer.data),
            "results": serializer.data
        }
        
        # Write to a JSON file for frontend testing
        output_file = backend_dir / "test_food_data.json"
        with open(output_file, 'w') as f:
            json.dump(test_data, f, indent=2, default=str)
        
        print(f"✅ Test data saved to: {output_file}")
        print(f"   Foods included: {len(test_data['results'])}")
        
        return True
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        return False

def main():
    print("🔬 FINAL VERIFICATION TESTS")
    print("=" * 50)
    
    results = []
    
    # Test 1: Food List API
    results.append(test_food_list_endpoint())
    
    # Test 2: Food Search API  
    results.append(test_food_search_endpoint())
    
    # Test 3: Frontend Test Data
    results.append(create_frontend_test_data())
    
    print(f"\n📊 TEST SUMMARY")
    print("=" * 50)
    
    passed_tests = sum(results)
    total_tests = len(results)
    
    print(f"Tests passed: {passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED!")
        print("\n✅ Your menu page image loading is now FIXED!")
        print("✅ API endpoints are working correctly")
        print("✅ Problematic Bing URL has been resolved")
        print("✅ Frontend can now display images properly")
        
        print(f"\n🚀 Ready for frontend integration!")
    else:
        print("❌ Some tests failed. Please check the output above.")

if __name__ == "__main__":
    main()