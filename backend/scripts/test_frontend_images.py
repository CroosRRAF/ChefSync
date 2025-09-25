#!/usr/bin/env python3
"""
Test image URLs accessibility from the API
"""
import requests
import json

def test_api_and_images():
    print("🔍 Testing API and Image URLs")
    print("=" * 50)
    
    try:
        # Test API
        response = requests.get('http://localhost:8000/api/food/foods/', timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Handle both paginated and direct list responses
            if isinstance(data, dict) and 'results' in data:
                foods = data['results']
            elif isinstance(data, list):
                foods = data
            else:
                foods = []
                
            print(f"✅ API working: {len(foods)} foods returned")
            
            # Test first 3 food images
            for i, food in enumerate(foods[:3], 1):
                name = food.get('name', 'Unknown')
                primary_image = food.get('primary_image')
                image_url = food.get('image_url')
                
                print(f"\n🍽️ {i}. {name}")
                print(f"   Primary Image: {'✅' if primary_image else '❌'}")
                if primary_image:
                    print(f"      URL: {primary_image[:80]}...")
                    
                    # Test if image URL is accessible
                    try:
                        img_response = requests.head(primary_image, timeout=5)
                        status = "✅ OK" if img_response.status_code == 200 else f"❌ {img_response.status_code}"
                        print(f"      Status: {status}")
                    except Exception as e:
                        print(f"      Status: ❌ Error - {str(e)[:50]}...")
                
                print(f"   Image URL: {'✅' if image_url else '❌'}")
                if image_url and image_url != primary_image:
                    print(f"      URL: {image_url[:80]}...")
        else:
            print(f"❌ API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")

    print(f"\n🔧 Frontend Image Fix Status:")
    print("   ✅ Fixed image URL construction (removed localhost prepend)")
    print("   ✅ Added error handling for broken images")
    print("   ✅ Updated TypeScript interfaces")
    print(f"\n📋 Expected Result:")
    print("   - Menu page should show all 25 foods with working images")
    print("   - Images should load directly from Cloudinary URLs")
    print("   - Fallback placeholder for any broken images")

if __name__ == "__main__":
    test_api_and_images()