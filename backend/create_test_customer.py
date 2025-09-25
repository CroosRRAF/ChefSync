#!/usr/bin/env python
"""Create a test customer user    print(f"📋 Test Credentials:")
    print(f"   Email: {customer.email}")
    print(f"   Username: {customer.username or customer.email}")
    print(f"   Password: customer123") cart functionality testing"""

import os
import sys
import django

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def create_test_customer():
    """Create a test customer user and generate tokens"""
    print("🔧 Creating test customer user...")
    
    # Create or get test customer
    customer, created = User.objects.get_or_create(
        email='customer@example.com',
        defaults={
            'username': 'customer',
            'name': 'Test Customer',
            'first_name': 'Test',
            'last_name': 'Customer',
            'role': 'customer',
            'approval_status': 'approved',
            'is_active': True
        }
    )
    
    if created:
        customer.set_password('customer123')
        customer.save()
        print(f"✅ Created new customer: {customer.username}")
    else:
        print(f"✅ Using existing customer: {customer.username}")
        # Update password just in case
        customer.set_password('customer123')
        customer.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(customer)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    print(f"🔑 Access Token: {access_token}")
    print(f"🔑 Refresh Token: {refresh_token}")
    print("")
    print("📋 Test Credentials:")
    print(f"   Username: {customer.username}")
    print(f"   Password: customer123")
    print(f"   Email: {customer.email}")
    print("")
    print("🌐 You can use these credentials to log in through the frontend!")
    print("   1. Go to http://localhost:8084/login")
    print("   2. Enter the username and password above")
    print("   3. Test the cart functionality")
    
    return customer, access_token, refresh_token

if __name__ == '__main__':
    create_test_customer()