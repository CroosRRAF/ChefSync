#!/usr/bin/env python3
"""
Check what users exist in the database
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def check_users():
    """Check what users exist"""
    
    print("👥 Users in Database")
    print("=" * 30)
    
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    
    for user in users:
        print(f"- {user.username} | Role: {getattr(user, 'role', 'Unknown')} | Email: {user.email}")
        
    print()
    print("📊 User counts by role:")
    roles = ['admin', 'chef', 'customer', 'delivery_agent']
    for role in roles:
        count = User.objects.filter(role=role).count()
        print(f"- {role}: {count}")

if __name__ == "__main__":
    check_users()