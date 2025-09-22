#!/usr/bin/env python
"""
Script to test admin role creation
"""
import os
import sys
import django

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

def test_admin_role():
    print("Testing admin role creation...")
    
    # Test lowercase admin role
    try:
        user = User.objects.create_user(
            email="test_admin@chefsync.com",
            password="testpass123",
            name="Test Admin User",
            role="admin"  # lowercase
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()
        
        print(f"✅ Successfully created user with role 'admin'")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Is Staff: {user.is_staff}")
        print(f"   Is Superuser: {user.is_superuser}")
        
        # Test role validation
        print(f"   Can login (admin check): {user.role in ['Admin', 'admin']}")
        
    except Exception as e:
        print(f"❌ Error creating user with role 'admin': {e}")
    
    # Test capitalized Admin role
    try:
        user2 = User.objects.create_user(
            email="test_admin2@chefsync.com",
            password="testpass123",
            name="Test Admin User 2",
            role="Admin"  # capitalized
        )
        user2.is_staff = True
        user2.is_superuser = True
        user2.save()
        
        print(f"✅ Successfully created user with role 'Admin'")
        print(f"   Email: {user2.email}")
        print(f"   Role: {user2.role}")
        print(f"   Is Staff: {user2.is_staff}")
        print(f"   Is Superuser: {user2.is_superuser}")
        
    except Exception as e:
        print(f"❌ Error creating user with role 'Admin': {e}")
    
    # Show available role choices
    print(f"\nAvailable role choices: {User.ROLE_CHOICES}")

if __name__ == "__main__":
    test_admin_role()