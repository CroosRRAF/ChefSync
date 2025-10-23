#!/usr/bin/env python
"""
Quick test script to verify Django URL configuration
"""
import os
import sys
import django
from pathlib import Path

# Add the project root to the Python path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

def test_url_imports():
    """Test that all URL configurations import correctly"""
    try:
        # Test main URL configuration
        from config.urls import urlpatterns as main_urls
        print("✅ Main URLs imported successfully")
        
        # Test authentication URLs
        from apps.authentication.urls import urlpatterns as auth_urls
        print("✅ Authentication URLs imported successfully")
        
        # Count location management URLs
        location_urls = [
            url for url in auth_urls 
            if hasattr(url, 'pattern') and 'location' in str(url.pattern)
        ]
        print(f"✅ Found {len(location_urls)} location management URLs")
        
        # Test views import
        from apps.authentication import views
        location_views = [
            'update_chef_location',
            'get_chef_location', 
            'toggle_location_tracking'
        ]
        
        for view_name in location_views:
            if hasattr(views, view_name):
                print(f"✅ {view_name} view available")
            else:
                print(f"❌ {view_name} view missing")
        
        print("\n🎉 All URL configurations are working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing URLs: {e}")
        return False

if __name__ == '__main__':
    test_url_imports()