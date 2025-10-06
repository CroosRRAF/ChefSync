#!/usr/bin/env python
"""
Create pending users for testing approval functionality
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.authentication.models import User
from django.contrib.auth.hashers import make_password

def create_pending_users():
    """Create sample pending users for testing"""

    # Create pending cook
    pending_cook, created = User.objects.get_or_create(
        user_id=1001,
        defaults={
            'name': 'Sarah Johnson',
            'email': 'sarah.cook@chefsync.com',
            'password': make_password('cook123'),
            'role': 'cook',
            'phone_no': '+1-555-0123',
            'address': '123 Main St, New York, NY 10001',
            'is_active': True,
            'email_verified': True,
            'approval_status': 'pending',
            'date_joined': datetime.now() - timedelta(days=2),
        }
    )
    if created:
        print("✅ Created pending cook user")
    else:
        print("ℹ️ Pending cook user already exists")

    # Create pending delivery agent
    pending_delivery, created = User.objects.get_or_create(
        user_id=1002,
        defaults={
            'name': 'Mike Wilson',
            'email': 'mike.delivery@chefsync.com',
            'password': make_password('delivery123'),
            'role': 'delivery_agent',
            'phone_no': '+1-555-0456',
            'address': '456 Oak Ave, New York, NY 10002',
            'is_active': True,
            'email_verified': True,
            'approval_status': 'pending',
            'date_joined': datetime.now() - timedelta(days=1),
        }
    )
    if created:
        print("✅ Created pending delivery agent user")
    else:
        print("ℹ️ Pending delivery agent user already exists")

if __name__ == '__main__':
    create_pending_users()
    print("🎉 Pending users creation completed!")
