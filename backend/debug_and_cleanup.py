#!/usr/bin/env python
"""
Check and clean up user data for registration debugging
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, EmailOTP
from django.db.models import Q

def check_and_cleanup():
    """Check for problematic user data and clean up"""
    print("🔍 Checking for potential issues...")
    
    # Check for recent OTP verifications
    recent_otps = EmailOTP.objects.filter(
        purpose='registration',
        is_used=True
    ).order_by('-created_at')[:10]
    
    print(f"\n📧 Recent verified OTPs:")
    for otp in recent_otps:
        print(f"  Email: {otp.email} | OTP: {otp.otp} | Created: {otp.created_at}")
        
        # Check if user exists for this email
        user_exists = User.objects.filter(email=otp.email).exists()
        print(f"    User exists: {user_exists}")
        
        if user_exists and input(f"    Delete user {otp.email}? (y/n): ").lower() == 'y':
            User.objects.filter(email=otp.email).delete()
            print(f"    ✅ Deleted user {otp.email}")
    
    # Check for users without profiles
    print(f"\n👥 Checking users without profiles...")
    for user in User.objects.all():
        profile = user.get_profile()
        if not profile:
            print(f"  ⚠️  User {user.email} ({user.role}) has no profile!")
            
            # Create missing profile
            if user.role == 'customer':
                from apps.authentication.models import Customer
                Customer.objects.create(user=user)
                print(f"    ✅ Created Customer profile for {user.email}")
            elif user.role == 'cook':
                from apps.authentication.models import Cook
                Cook.objects.create(user=user, specialty='', availability_hours='')
                print(f"    ✅ Created Cook profile for {user.email}")
            elif user.role == 'delivery_agent':
                from apps.authentication.models import DeliveryAgent
                DeliveryAgent.objects.create(user=user, vehicle_type='bike', is_available=True)
                print(f"    ✅ Created DeliveryAgent profile for {user.email}")

if __name__ == "__main__":
    check_and_cleanup()
