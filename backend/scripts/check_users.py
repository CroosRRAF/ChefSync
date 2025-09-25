#!/usr/bin/env python3
import os
import sys
import django
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

print("Checking existing users and roles:")
users = User.objects.all()
for user in users:
    print(f'User: {user.username}, Role: "{user.role}"')

print(f"\nAdmin count (role='admin'): {User.objects.filter(role='admin').count()}")
print(f"Admin count (role='Admin'): {User.objects.filter(role='Admin').count()}")
print(f"Cook count (role='cook'): {User.objects.filter(role='cook').count()}")
print(f"Cook count (role='Cook'): {User.objects.filter(role='Cook').count()}")
print(f"Customer count (role='customer'): {User.objects.filter(role='customer').count()}")
print(f"Customer count (role='Customer'): {User.objects.filter(role='Customer').count()}")