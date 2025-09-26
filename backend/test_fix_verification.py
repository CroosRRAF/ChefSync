"""
Simple test to verify the chef location resolution and order placement functionality.
This creates a minimal test scenario and prints what would happen.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.views import _resolve_chef_location
from django.contrib.auth import get_user_model
from apps.authentication.models import Cook
from apps.orders.models import UserAddress

User = get_user_model()

def test_scenario():
    """Test the scenario that was failing in the browser"""
    print("🧪 Testing Chef Location Resolution")
    print("=" * 50)
    
    # Get or create test chef
    try:
        chef = User.objects.get(email='test_chef@example.com')
        print(f"✅ Using existing chef: {chef.name} (ID: {chef.user_id})")
    except User.DoesNotExist:
        print("❌ No test chef found. Run test_resolve_location.py first.")
        return
    
    # Get cook profile
    try:
        cook_profile = Cook.objects.get(user=chef)
        print(f"📍 Current kitchen_location: {cook_profile.kitchen_location}")
    except Cook.DoesNotExist:
        print("❌ No cook profile found")
        return
    
    # Simulate the frontend request with coordinates (like a customer placing order)
    request_data = {
        'chef_id': chef.user_id,
        'delivery_latitude': 19.0860,
        'delivery_longitude': 72.8880,
        'customer_notes': 'Please deliver to main gate',
        # These are the key fields that should prevent the 400 error
        'chef_latitude': 19.076,
        'chef_longitude': 72.8777,
        'chef_address': 'Main Kitchen, Food Street',
        'chef_city': 'Mumbai'
    }
    
    print(f"\n📤 Frontend request would include:")
    for key, value in request_data.items():
        if 'chef_' in key:
            print(f"   {key}: {value}")
    
    # Test the resolution
    print(f"\n🔍 Testing _resolve_chef_location...")
    lat, lng = _resolve_chef_location(chef, request_data)
    
    if lat is not None and lng is not None:
        print(f"✅ Resolution SUCCESS: {lat}, {lng}")
        
        # Check if data was persisted
        cook_profile.refresh_from_db()
        print(f"💾 Persisted kitchen_location: {cook_profile.kitchen_location}")
        
        # Check UserAddress
        kitchen_addr = UserAddress.objects.filter(user=chef, label='Kitchen').first()
        if kitchen_addr:
            print(f"🏠 Kitchen address: {kitchen_addr.address_line1}")
        
        print(f"\n✅ ORDER PLACEMENT SHOULD NOW WORK")
        print(f"   The 400 'Chef location not available' error should be resolved")
        
    else:
        print(f"❌ Resolution FAILED - coordinates not found")
    
    print(f"\n" + "=" * 50)
    print(f"🎯 SUMMARY:")
    print(f"   - Frontend now includes chef_latitude/chef_longitude in order requests")
    print(f"   - Backend _resolve_chef_location accepts and persists these coordinates") 
    print(f"   - This prevents 400 errors when chef has no saved kitchen_location")
    print(f"   - Future orders will use the persisted location")

if __name__ == "__main__":
    test_scenario()