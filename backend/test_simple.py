#!/usr/bin/env python
"""
Simple test script to check if Django is working
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("Django is working!")
print(f"Current users in database: {User.objects.count()}")

# Try to create a simple user
try:
    user = User.objects.create_user(
        email="test@example.com",
        password="test123",
        name="Test User",
        role="Customer"
    )
    print(f"Created test user: {user.name}")
    print(f"Total users now: {User.objects.count()}")
except Exception as e:
    print(f"Error creating user: {e}")
