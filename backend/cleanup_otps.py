#!/usr/bin/env python
"""
Clean up expired OTP records
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.services.email_service import EmailService

if __name__ == "__main__":
    print("🧹 Cleaning up expired OTP records...")
    cleaned_count = EmailService.cleanup_expired_otps()
    print(f"✅ Cleaned up {cleaned_count} expired OTP records")
