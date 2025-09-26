#!/usr/bin/env python3
"""
Test script to verify chef profile data exists in the database
"""

import os
import sys
import django

# Add the parent directory to the path to import Django settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import ChefProfile, UserProfile
from apps.authentication.models import User

def check_chef_profiles():
    """Check if chef profiles exist and their availability status"""
    
    print("=== Checking Chef Profiles ===")
    
    # Count all users
    total_users = User.objects.count()
    print(f"Total users in database: {total_users}")
    
    # Count all chef profiles
    total_chef_profiles = ChefProfile.objects.count()
    print(f"Total chef profiles: {total_chef_profiles}")
    
    # List all chef profiles with their details
    for chef_profile in ChefProfile.objects.all():
        print(f"\nChef Profile ID: {chef_profile.id}")
        print(f"User: {chef_profile.user.email} (PK: {chef_profile.user.pk})")
        print(f"Available: {chef_profile.is_available}")
        print(f"Approval Status: {chef_profile.approval_status}")
        print(f"Rating: {chef_profile.rating_average}")
        print(f"Bio: {chef_profile.bio[:50] if chef_profile.bio else 'No bio'}")
    
    # Check if any users have both UserProfile and ChefProfile
    for user in User.objects.all():
        has_user_profile = hasattr(user, 'profile')
        has_chef_profile = ChefProfile.objects.filter(user=user).exists()
        
        if has_chef_profile:
            chef_profile = ChefProfile.objects.get(user=user)
            print(f"\nUser: {user.email} (PK: {user.pk})")
            print(f"  Has UserProfile: {has_user_profile}")
            print(f"  Has ChefProfile: {has_chef_profile}")
            print(f"  Chef Available: {chef_profile.is_available}")
            print(f"  Approval Status: {chef_profile.approval_status}")

if __name__ == "__main__":
    check_chef_profiles()