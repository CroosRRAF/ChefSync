#!/usr/bin/env python
"""
Clean up test data
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, EmailOTP

# Clean up test users and OTPs
User.objects.filter(email="test@example.com").delete()
EmailOTP.objects.filter(email="test@example.com").delete()

print("✅ Cleaned up test data")
