#!/usr/bin/env python
"""
Create test OTP
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import EmailOTP

# Create test OTP
otp = EmailOTP.objects.create(
    email="test@example.com",
    purpose='registration'
)

print(f"Test OTP created:")
print(f"Email: {otp.email}")
print(f"OTP: {otp.otp}")
print(f"Purpose: {otp.purpose}")
print(f"Created: {otp.created_at}")
print(f"Expires: {otp.expires_at}")
