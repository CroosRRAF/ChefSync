#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from apps.users.models import ChefProfile

def check_profiles():
    profiles = ChefProfile.objects.all()
    print(f'Total profiles: {profiles.count()}')

    pending = profiles.filter(approval_status='pending')
    print(f'Pending profiles: {pending.count()}')

    for p in pending:
        print(f'- {p.user.name}: {p.approval_status}')

    approved = profiles.filter(approval_status='approved')
    print(f'Approved profiles: {approved.count()}')

if __name__ == '__main__':
    check_profiles()