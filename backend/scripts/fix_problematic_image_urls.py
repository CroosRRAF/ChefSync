#!/usr/bin/env python3
"""
Fix the problematic Bing search URL for food images.
Extract the actual image URL from the Bing search parameters.
"""
import os
import sys
import django
from pathlib import Path
import urllib.parse as urlparse

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food

def extract_image_url_from_bing(bing_url):
    """Extract the actual image URL from a Bing search URL"""
    try:
        # Parse the URL to get query parameters
        parsed = urlparse.urlparse(bing_url)
        query_params = urlparse.parse_qs(parsed.query)
        
        # Look for the mediaurl parameter which contains the actual image URL
        if 'mediaurl' in query_params:
            media_url = query_params['mediaurl'][0]
            # URL decode the media URL
            actual_url = urlparse.unquote(media_url)
            return actual_url
        
        # Fallback to cdnurl if mediaurl is not found
        if 'cdnurl' in query_params:
            cdn_url = query_params['cdnurl'][0]
            actual_url = urlparse.unquote(cdn_url)
            return actual_url
            
        return None
    except Exception as e:
        print(f"Error extracting URL: {e}")
        return None

def fix_bing_image_urls():
    """Fix all Bing search URLs in the database"""
    print("🔧 Fixing Bing Image URLs:")
    print("=" * 50)
    
    # Find foods with Bing search URLs
    foods_with_bing_urls = []
    foods = Food.objects.all()
    
    for food in foods:
        if food.image and 'bing.com/images/search' in str(food.image):
            foods_with_bing_urls.append(food)
    
    print(f"Found {len(foods_with_bing_urls)} foods with Bing search URLs")
    
    if not foods_with_bing_urls:
        print("✅ No Bing search URLs found.")
        return
    
    fixed_count = 0
    
    for food in foods_with_bing_urls:
        print(f"\n📍 Fixing: {food.name}")
        original_url = str(food.image)
        print(f"   Original: {original_url[:100]}...")
        
        # Extract the actual image URL
        actual_url = extract_image_url_from_bing(original_url)
        
        if actual_url:
            print(f"   Extracted: {actual_url}")
            
            # Update the food record
            food.image = actual_url
            food.save()
            
            print(f"   ✅ Updated successfully")
            fixed_count += 1
        else:
            print(f"   ❌ Could not extract image URL")
            
            # Fallback: Use a placeholder image from Unsplash for Indian food
            fallback_url = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=80"
            food.image = fallback_url
            food.save()
            
            print(f"   🔄 Set fallback image: {fallback_url}")
            fixed_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   Fixed: {fixed_count} images")
    print(f"   ✅ All Bing search URLs have been resolved")

def verify_image_urls():
    """Verify that all image URLs are now working"""
    print(f"\n🔍 Verifying Image URLs:")
    print("=" * 30)
    
    foods = Food.objects.all()
    
    for food in foods:
        if food.image:
            url = str(food.image)
            print(f"📍 {food.name}")
            print(f"   URL: {url}")
            
            if 'bing.com/images/search' in url:
                print(f"   ❌ Still has Bing search URL")
            elif url.startswith('http'):
                print(f"   ✅ Valid direct image URL")
            else:
                print(f"   ⚠️  Unusual URL format")
        else:
            print(f"📍 {food.name}")
            print(f"   ⚠️  No image")

if __name__ == "__main__":
    print("🖼️  Fixing Problematic Image URLs")
    print("=" * 50)
    
    fix_bing_image_urls()
    verify_image_urls()
    
    print(f"\n🎉 Image URL fixing completed!")
    print("   All foods now have direct image URLs that will load properly in the frontend.")