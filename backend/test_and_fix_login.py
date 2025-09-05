#!/usr/bin/env python
"""
ChefSync Login Test and Fix Script
This script tests and creates sample accounts for all user types.
"""

import os
import sys
import django
import requests

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

BASE_URL = "http://127.0.0.1:8000/api/auth"

def create_test_users():
    """Create test users for all roles"""
    print("🔧 Creating test users...")
    
    test_users = [
        {
            "name": "Test Customer",
            "email": "customer@test.com", 
            "password": "Test123!",
            "role": "customer"
        },
        {
            "name": "Test Cook",
            "email": "cook@test.com",
            "password": "Test123!", 
            "role": "cook"
        },
        {
            "name": "Test Delivery",
            "email": "delivery@test.com",
            "password": "Test123!",
            "role": "delivery_agent"
        },
        {
            "name": "Admin User",
            "email": "admin@test.com",
            "password": "Test123!",
            "role": "customer"  # Will be made admin after creation
        }
    ]
    
    for user_data in test_users:
        try:
            # Check if user already exists
            if User.objects.filter(email=user_data["email"]).exists():
                print(f"✅ User {user_data['email']} already exists")
                continue
                
            # Create user directly in database
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                username=user_data["email"],  # Set username to email
                role=user_data["role"],
                email_verified=True  # Skip email verification for test users
            )
            user.set_password(user_data["password"])
            user.save()
            
            # Create profile
            user.create_profile()
            
            # Make admin user staff and superuser
            if user_data["email"] == "admin@test.com":
                user.is_staff = True
                user.is_superuser = True
                user.save()
            
            print(f"✅ Created {user_data['role']} user: {user_data['email']}")
            
        except Exception as e:
            print(f"❌ Error creating user {user_data['email']}: {e}")

def test_login(email, password):
    """Test login for a specific user"""
    try:
        response = requests.post(f"{BASE_URL}/login/", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful for {email}")
            print(f"   User: {data['user']['name']} ({data['user']['role']})")
            return True
        else:
            print(f"❌ Login failed for {email}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error for {email}: {e}")
        return False

def main():
    print("🚀 ChefSync Login Fix and Test")
    print("=" * 40)
    
    # Create test users
    create_test_users()
    
    print("\n🧪 Testing login for all users...")
    print("-" * 30)
    
    test_accounts = [
        ("customer@test.com", "Test123!"),
        ("cook@test.com", "Test123!"),
        ("delivery@test.com", "Test123!"),
        ("admin@test.com", "Test123!")
    ]
    
    success_count = 0
    for email, password in test_accounts:
        if test_login(email, password):
            success_count += 1
    
    print(f"\n📊 Results: {success_count}/{len(test_accounts)} logins successful")
    
    if success_count == len(test_accounts):
        print("🎉 All login tests passed! Your authentication is working correctly.")
        print("\nTest Accounts Created:")
        print("- Customer: customer@test.com / Test123!")
        print("- Cook: cook@test.com / Test123!")
        print("- Delivery: delivery@test.com / Test123!")
        print("- Admin: admin@test.com / Test123!")
    else:
        print("⚠️  Some login tests failed. Check the backend server and try again.")

if __name__ == "__main__":
    main()
