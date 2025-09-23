"""
Simple script to create a test pending user
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Simple fix for the decouple issue
import sys
from unittest.mock import patch

# Mock the config function to return proper values
def mock_config(key, default=None, cast=None):
    values = {
        'DEBUG': True,
        'SECRET_KEY': 'django-insecure-test-key',
        'ALLOWED_HOSTS': 'localhost,127.0.0.1',
        'DB_NAME': 'chefsync_main',
        'DB_USER': 'root',
        'DB_PASSWORD': '2002',
        'DB_HOST': 'localhost',
        'DB_PORT': 3306,
    }
    value = values.get(key, default)
    if cast and value is not None:
        return cast(value)
    return value

with patch('decouple.config', side_effect=mock_config):
    django.setup()

from apps.authentication.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone

def create_test_users():
    print("Creating test users for approval testing...")
    
    # Create a test cook
    try:
        cook_email = "testcook@example.com"
        if not User.objects.filter(email=cook_email).exists():
            cook = User.objects.create(
                name="Test Cook",
                email=cook_email,
                role="cook",
                approval_status="pending",
                password=make_password("password123"),
                phone_no="1234567890",
                address="123 Test Street",
                email_verified=True
            )
            print(f"✅ Created cook: {cook.name} (ID: {cook.user_id}) - Status: {cook.approval_status}")
        else:
            print("❌ Cook with this email already exists")
    except Exception as e:
        print(f"❌ Error creating cook: {e}")
    
    # Create a test delivery agent
    try:
        delivery_email = "testdelivery@example.com"
        if not User.objects.filter(email=delivery_email).exists():
            delivery = User.objects.create(
                name="Test Delivery Agent",
                email=delivery_email,
                role="delivery_agent", 
                approval_status="pending",
                password=make_password("password123"),
                phone_no="0987654321",
                address="456 Delivery Ave",
                email_verified=True
            )
            print(f"✅ Created delivery agent: {delivery.name} (ID: {delivery.user_id}) - Status: {delivery.approval_status}")
        else:
            print("❌ Delivery agent with this email already exists")
    except Exception as e:
        print(f"❌ Error creating delivery agent: {e}")
    
    # List all pending users
    pending_users = User.objects.filter(
        role__in=['cook', 'delivery_agent'],
        approval_status='pending'
    )
    print(f"\n📊 Total pending users: {pending_users.count()}")
    for user in pending_users:
        print(f"  - {user.name} ({user.role}) - {user.email}")

if __name__ == '__main__':
    create_test_users()