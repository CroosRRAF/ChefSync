#!/usr/bin/env python
"""
Script to check pending users in the database
"""
import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

def check_pending_users():
    print("=== Checking Pending Users ===")
    
    # Get all users
    all_users = User.objects.all()
    print(f"Total users in database: {all_users.count()}")
    
    # Get pending users (cooks and delivery agents)
    pending_users = User.objects.filter(
        role__in=['cook', 'delivery_agent'],
        approval_status='pending'
    )
    print(f"Pending users (cooks & delivery agents): {pending_users.count()}")
    
    # Get all users by role
    for role in ['customer', 'cook', 'delivery_agent', 'admin']:
        role_users = User.objects.filter(role=role)
        print(f"{role.capitalize()} users: {role_users.count()}")
        
        # Show approval status breakdown for cooks and delivery agents
        if role in ['cook', 'delivery_agent']:
            for status in ['pending', 'approved', 'rejected']:
                count = User.objects.filter(role=role, approval_status=status).count()
                print(f"  - {status}: {count}")
    
    print("\n=== Recent Users (last 10) ===")
    recent_users = User.objects.all().order_by('-created_at')[:10]
    for user in recent_users:
        print(f"ID: {user.user_id}, Name: {user.name}, Role: {user.role}, Status: {user.approval_status}, Created: {user.created_at}")
    
    print("\n=== Pending Users Details ===")
    if pending_users.exists():
        for user in pending_users:
            print(f"ID: {user.user_id}, Name: {user.name}, Email: {user.email}, Role: {user.role}, Status: {user.approval_status}")
    else:
        print("No pending users found")

if __name__ == '__main__':
    check_pending_users()