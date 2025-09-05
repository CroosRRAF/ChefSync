#!/usr/bin/env python
"""
Test registration with the exact data from frontend
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

def test_with_real_data():
    """Test with the actual data from frontend"""
    print("🧪 Testing with Real Frontend Data")
    print("=" * 50)
    
    # Clean up first
    email = "kajanpirathap@gmail.com"
    User.objects.filter(email=email).delete()
    EmailOTP.objects.filter(email=email).delete()
    
    # Create verified OTP (simulating successful OTP verification)
    otp = EmailOTP.objects.create(
        email=email,
        purpose='registration'
    )
    otp.mark_as_used()
    print(f"✅ Created verified OTP for {email}")
    
    # Test data matching what frontend sends (based on screenshot)
    test_data = {
        'name': 'Kajan',  # From the screenshot pattern
        'email': email,
        'password': 'Kajan2929*',  # From screenshot
        'confirm_password': 'Kajan2929*',
        'role': 'customer',  # Likely default
        'phone_no': '',
        'address': ''
    }
    
    print(f"📝 Test data: {test_data}")
    
    try:
        # Test serializer validation
        serializer = CompleteRegistrationSerializer(data=test_data)
        print(f"🔍 Serializer validation...")
        
        if serializer.is_valid():
            print("✅ Serializer validation passed")
            
            # Test user creation
            user = serializer.save()
            print(f"✅ User created successfully: {user.email}")
            
        else:
            print(f"❌ Serializer validation failed:")
            for field, errors in serializer.errors.items():
                print(f"  {field}: {errors}")
                
    except Exception as e:
        print(f"💥 Exception during creation: {str(e)}")
        import traceback
        print(f"💥 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_with_real_data()
