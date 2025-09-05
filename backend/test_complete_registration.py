#!/usr/bin/env python
"""
Test complete registration endpoint
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, EmailOTP
from apps.authentication.serializers import CompleteRegistrationSerializer

def test_complete_registration():
    """Test the complete registration process"""
    print("🧪 Testing Complete Registration")
    print("=" * 50)
    
    # First create a verified OTP
    test_email = "test@example.com"
    
    # Create and mark OTP as used (simulating successful verification)
    otp = EmailOTP.objects.create(
        email=test_email,
        purpose='registration'
    )
    otp.mark_as_used()
    print(f"✅ Created verified OTP for {test_email}")
    
    # Test data matching what frontend sends
    test_data = {
        'name': 'Test User',
        'email': test_email,
        'password': 'SecurePassword123!',
        'confirm_password': 'SecurePassword123!',
        'role': 'customer',
        'phone_no': '',  # Empty string as frontend sends
        'address': ''    # Empty string as frontend sends
    }
    
    print(f"📝 Test data: {test_data}")
    
    try:
        # Test serializer validation
        serializer = CompleteRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ Serializer validation passed")
            
            # Test user creation
            user = serializer.save()
            print(f"✅ User created successfully: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Role: {user.role}")
            print(f"   Phone: {user.phone_no}")
            print(f"   Address: {user.address}")
            
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")
            
    except Exception as e:
        print(f"💥 Exception: {str(e)}")
        import traceback
        print(f"💥 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_complete_registration()
