#!/usr/bin/env python
"""
Clean up the problematic user
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

# Clean up the problematic user
email = "kajanpirathap@gmail.com"
deleted_count = User.objects.filter(email=email).delete()[0]
print(f"✅ Deleted {deleted_count} user(s) with email {email}")

# Also clean up any users with this username
deleted_count2 = User.objects.filter(username=email).delete()[0]
print(f"✅ Deleted {deleted_count2} user(s) with username {email}")

print("✅ Database cleaned up. You can now try registration again.")
