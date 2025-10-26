#!/usr/bin/env python
"""
Simple script to test chef profile retrieval
Run this from the backend directory: python test_chef_profile.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import ChefProfile, User, Address
from apps.users.serializers import ChefProfileSerializer

def test_chef_profile():
    """Test chef profile serialization"""
    print("Testing Chef Profile Retrieval...")
    print("=" * 50)
    
    # Get chef profile with ID 5
    try:
        chef_profile = ChefProfile.objects.filter(id=5).select_related('user').first()
        
        if not chef_profile:
            print("❌ Chef profile with ID 5 not found")
            # List all available chef profiles
            all_chefs = ChefProfile.objects.all()
            print(f"\n📋 Available chef profiles: {all_chefs.count()}")
            for chef in all_chefs:
                print(f"  - ID: {chef.id}, User: {chef.user.name}, Status: {chef.approval_status}")
            return
        
        print(f"✅ Found chef profile:")
        print(f"  - ID: {chef_profile.id}")
        print(f"  - User: {chef_profile.user.name}")
        print(f"  - Email: {chef_profile.user.email}")
        print(f"  - Status: {chef_profile.approval_status}")
        
        # Test serialization
        print("\n📦 Testing serialization...")
        serializer = ChefProfileSerializer(chef_profile)
        data = serializer.data
        
        print("✅ Serialization successful!")
        print(f"\nSerialized data:")
        print(f"  - user_id: {data.get('user_id')}")
        print(f"  - name: {data.get('name')}")
        print(f"  - email: {data.get('email')}")
        print(f"  - phone_no: {data.get('phone_no')}")
        print(f"  - rating: {data.get('rating')}")
        print(f"  - kitchen_location: {data.get('kitchen_location')}")
        print(f"  - operating_hours_readable: {data.get('operating_hours_readable')}")
        print(f"  - is_currently_open: {data.get('is_currently_open')}")
        
        # Check for kitchen address
        kitchen_address = Address.objects.filter(
            user=chef_profile.user,
            address_type='kitchen',
            is_default=True,
            is_active=True
        ).first()
        
        if kitchen_address:
            print(f"\n🏠 Kitchen Address Found:")
            print(f"  - {kitchen_address.full_address}")
        else:
            print(f"\n⚠️ No kitchen address found for this chef")
        
    except Exception as e:
        import traceback
        print(f"❌ Error: {str(e)}")
        print("\nFull traceback:")
        print(traceback.format_exc())

if __name__ == '__main__':
    test_chef_profile()

