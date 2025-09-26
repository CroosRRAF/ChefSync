"""
Test the _resolve_chef_location fallback with coordinates provided in request.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.authentication.models import Cook
from apps.orders.models import UserAddress
from apps.orders.views import _resolve_chef_location

User = get_user_model()

# Create or get a test chef
def create_test_chef():
    chef_user, created = User.objects.get_or_create(
        email='test_chef@example.com',
        defaults={
            'name': 'Test Chef',
            'role': 'cook',
            'username': 'test_chef',
        }
    )
    
    # Create Cook profile if not exists
    cook_profile, created = Cook.objects.get_or_create(
        user=chef_user,
        defaults={
            'specialty': 'Italian',
            'kitchen_location': None  # Start with no location
        }
    )
    
    return chef_user, cook_profile

def test_resolve_chef_location():
    print("Testing _resolve_chef_location function...")
    
    chef_user, cook_profile = create_test_chef()
    print(f"Chef created: {chef_user.name} (ID: {chef_user.user_id})")
    print(f"Initial kitchen_location: {cook_profile.kitchen_location}")
    
    # Simulate request data with chef coordinates
    request_data = {
        'chef_latitude': '19.0760',
        'chef_longitude': '72.8777',
        'chef_address': 'Test Kitchen Address',
        'chef_city': 'Mumbai'
    }
    
    # Test the function
    lat, lng = _resolve_chef_location(chef_user, request_data)
    
    print(f"Resolved coordinates: lat={lat}, lng={lng}")
    
    # Refresh the cook profile
    cook_profile.refresh_from_db()
    print(f"Updated kitchen_location: {cook_profile.kitchen_location}")
    
    # Check if UserAddress was created
    kitchen_address = UserAddress.objects.filter(user=chef_user, label='Kitchen').first()
    if kitchen_address:
        print(f"Kitchen address created: {kitchen_address.address_line1}")
        print(f"Address coordinates: {kitchen_address.latitude}, {kitchen_address.longitude}")
    else:
        print("No kitchen address found")
    
    return lat is not None and lng is not None

if __name__ == "__main__":
    success = test_resolve_chef_location()
    print(f"Test {'PASSED' if success else 'FAILED'}")