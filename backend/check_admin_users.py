#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from apps.authentication.models import User

def check_admin_users():
    admin_users = User.objects.filter(role='admin')
    print(f'Total admin users: {admin_users.count()}')

    for user in admin_users:
        print(f'Admin User: {user.name} ({user.email})')
        print(f'  Role: {user.role}')
        print(f'  Is Active: {user.is_active}')
        print(f'  Is Staff: {user.is_staff}')
        print(f'  Is Superuser: {user.is_superuser}')
        print()

if __name__ == '__main__':
    check_admin_users()