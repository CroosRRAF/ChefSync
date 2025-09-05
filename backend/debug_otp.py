#!/usr/bin/env python
"""
Debug script to check OTP database records
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import EmailOTP
from django.utils import timezone

def check_otp_records():
    """Check existing OTP records"""
    print("🔍 Checking OTP Records in Database")
    print("=" * 50)
    
    # Get all OTP records
    all_otps = EmailOTP.objects.all().order_by('-created_at')
    
    if not all_otps.exists():
        print("❌ No OTP records found in database")
        return
    
    print(f"📊 Total OTP records: {all_otps.count()}")
    print("\n📝 Recent OTP Records:")
    
    for i, otp in enumerate(all_otps[:10], 1):  # Show last 10 records
        status = "🔴 EXPIRED" if not otp.is_valid() else "🟢 VALID"
        used_status = "✅ USED" if otp.is_used else "⏳ UNUSED"
        
        print(f"\n{i}. Email: {otp.email}")
        print(f"   OTP: {otp.otp}")
        print(f"   Purpose: {otp.purpose}")
        print(f"   Status: {status}")
        print(f"   Used: {used_status}")
        print(f"   Created: {otp.created_at}")
        print(f"   Expires: {otp.expires_at}")
        print(f"   Time left: {otp.expires_at - timezone.now() if otp.expires_at > timezone.now() else 'EXPIRED'}")

def create_test_otp():
    """Create a test OTP for debugging"""
    print("\n🧪 Creating Test OTP")
    print("=" * 30)
    
    test_email = "test@example.com"
    
    # Create test OTP
    otp = EmailOTP.objects.create(
        email=test_email,
        purpose='registration'
    )
    
    print(f"✅ Test OTP created:")
    print(f"   Email: {otp.email}")
    print(f"   OTP: {otp.otp}")
    print(f"   Purpose: {otp.purpose}")
    print(f"   Created: {otp.created_at}")
    print(f"   Expires: {otp.expires_at}")
    
    return otp

if __name__ == "__main__":
    check_otp_records()
    
    create_new = input("\n🤔 Create a new test OTP? (y/n): ")
    if create_new.lower() == 'y':
        test_otp = create_test_otp()
        print(f"\n💡 You can now test with:")
        print(f"   Email: {test_otp.email}")
        print(f"   OTP: {test_otp.otp}")
