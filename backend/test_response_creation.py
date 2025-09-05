#!/usr/bin/env python
"""
Test the complete registration response creation
"""
import os
import sys
import django

# Setup Django
sys.path.append(r'e:\ChefSync\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, EmailOTP
from apps.authentication.serializers import CompleteRegistrationSerializer, UserProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken

def test_complete_response():
    """Test the complete registration response creation"""
    print("🧪 Testing Complete Registration Response")
    print("=" * 50)
    
    # Clean up first
    User.objects.filter(email="test2@example.com").delete()
    EmailOTP.objects.filter(email="test2@example.com").delete()
    
    # Create verified OTP
    test_email = "test2@example.com"
    otp = EmailOTP.objects.create(
        email=test_email,
        purpose='registration'
    )
    otp.mark_as_used()
    print(f"✅ Created verified OTP for {test_email}")
    
    # Test data
    test_data = {
        'name': 'Test User 2',
        'email': test_email,
        'password': 'SecurePassword123!',
        'confirm_password': 'SecurePassword123!',
        'role': 'customer',
        'phone_no': '',
        'address': ''
    }
    
    try:
        # Create user via serializer
        serializer = CompleteRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            user = serializer.save()
            print(f"✅ User created: {user.email}")
            
            # Refresh user from database to ensure all relationships are loaded
            user.refresh_from_db()
            
            # Test UserProfileSerializer
            print("🔍 Testing UserProfileSerializer...")
            profile_serializer = UserProfileSerializer(user)
            profile_data = profile_serializer.data
            print(f"✅ Profile serialized successfully")
            print(f"   Profile data keys: {list(profile_data.keys())}")
            
            # Test JWT token creation
            print("🔍 Testing JWT token creation...")
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            print(f"✅ JWT tokens created successfully")
            
            # Test complete response
            response_data = {
                'message': 'Registration completed successfully',
                'user': profile_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(access)
                }
            }
            print(f"✅ Complete response created successfully")
            print(f"   Response keys: {list(response_data.keys())}")
            
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")
            
    except Exception as e:
        print(f"💥 Exception: {str(e)}")
        import traceback
        print(f"💥 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_complete_response()
