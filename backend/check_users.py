#!/usr/bin/env python
"""
Test exact frontend flow
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, EmailOTP

def check_existing_users():
    """Check for any existing problematic users"""
    print("🔍 Checking existing users...")
    
    # Check all users
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    
    for user in users[:5]:  # Show first 5
        print(f"  User: {user.email}, Role: {user.role}, Username: {user.username}")
        
        # Check profile
        profile = user.get_profile()
        if profile:
            print(f"    Profile: {type(profile).__name__}")
        else:
            print(f"    Profile: None (missing!)")
    
    # Check for users without proper usernames
    no_username = User.objects.filter(username__isnull=True)
    print(f"Users without username: {no_username.count()}")
    
    # Check for duplicate emails/usernames
    from django.db.models import Count
    email_dupes = User.objects.values('email').annotate(count=Count('email')).filter(count__gt=1)
    print(f"Duplicate emails: {len(email_dupes)}")
    
    username_dupes = User.objects.values('username').annotate(count=Count('username')).filter(count__gt=1)
    print(f"Duplicate usernames: {len(username_dupes)}")

if __name__ == "__main__":
    check_existing_users()
