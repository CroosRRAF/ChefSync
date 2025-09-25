#!/usr/bin/env python
"""
Script to create sample ChefProfile data for testing the profile card
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, Cook
from apps.users.models import ChefProfile
from decimal import Decimal

def create_sample_chef_profiles():
    """Create sample chef profiles with ratings and reviews"""
    # Get all cook users
    cook_users = User.objects.filter(role__in=['cook', 'Cook'])
    
    if not cook_users.exists():
        print("No cook users found. Please create some cook users first.")
        return
    
    for user in cook_users:
        # Ensure Cook profile exists
        cook_profile, _ = Cook.objects.get_or_create(user=user)
        
        # Create or update ChefProfile with sample data
        chef_profile, created = ChefProfile.objects.get_or_create(
            user=user,
            defaults={
                'rating_average': Decimal('4.2'),
                'total_reviews': 15,
                'total_orders': 45,
                'bio': f"Experienced chef specializing in {cook_profile.specialty or 'various cuisines'}",
                'approval_status': 'approved',
                'is_featured': False
            }
        )
        
        if not created:
            # Update existing profile
            chef_profile.rating_average = Decimal('4.2')
            chef_profile.total_reviews = 15
            chef_profile.total_orders = 45
            chef_profile.approval_status = 'approved'
            chef_profile.save()
        
        print(f"Created/Updated ChefProfile for {user.name} - Rating: {chef_profile.rating_average}, Reviews: {chef_profile.total_reviews}")

if __name__ == "__main__":
    create_sample_chef_profiles()
    print("Sample ChefProfile data creation completed!")