#!/usr/bin/env python
"""
Test the exact complete-registration API call
"""
import requests
import json

def test_complete_registration_api():
    """Test the complete registration API endpoint"""
    print("🧪 Testing Complete Registration API")
    print("=" * 50)
    
    # Step 1: Send OTP
    send_otp_url = "http://127.0.0.1:8000/api/auth/send-otp/"
    otp_data = {
        "email": "test123@example.com",
        "name": "Test User 123",
        "purpose": "registration"
    }
    
    print(f"📤 Sending OTP to {otp_data['email']}...")
    try:
        response = requests.post(send_otp_url, json=otp_data)
        print(f"Send OTP Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ OTP sent successfully!")
        else:
            print(f"❌ OTP send failed: {response.text}")
            return
    except Exception as e:
        print(f"Error sending OTP: {e}")
        return
    
    # Step 2: Get the OTP from database (simulating user entering correct OTP)
    import os
    import sys
    import django
    sys.path.append(r'e:\ChefSync\backend')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    
    from apps.authentication.models import EmailOTP
    
    # Get the latest OTP for this email
    latest_otp = EmailOTP.objects.filter(
        email=otp_data['email'], 
        purpose='registration'
    ).order_by('-created_at').first()
    
    if not latest_otp:
        print("❌ No OTP found in database")
        return
    
    print(f"🔍 Found OTP: {latest_otp.otp}")
    
    # Step 3: Verify OTP
    verify_otp_url = "http://127.0.0.1:8000/api/auth/verify-otp/"
    verify_data = {
        "email": otp_data['email'],
        "otp": latest_otp.otp,
        "purpose": "registration"
    }
    
    print(f"✅ Verifying OTP...")
    try:
        response = requests.post(verify_otp_url, json=verify_data)
        print(f"Verify OTP Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ OTP verified successfully!")
        else:
            print(f"❌ OTP verification failed: {response.text}")
            return
    except Exception as e:
        print(f"Error verifying OTP: {e}")
        return
    
    # Step 4: Complete registration (this is where the 500 error occurs)
    complete_reg_url = "http://127.0.0.1:8000/api/auth/complete-registration/"
    complete_data = {
        "name": "Test User 123",
        "email": otp_data['email'],
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "role": "customer",
        "phone_no": "",
        "address": ""
    }
    
    print(f"🏁 Completing registration...")
    print(f"📝 Registration data: {complete_data}")
    
    try:
        response = requests.post(complete_reg_url, json=complete_data)
        print(f"Complete Registration Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Registration completed successfully!")
            result = response.json()
            print(f"User created: {result['user']['email']}")
        else:
            print(f"❌ Registration failed: {response.text}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
                
    except Exception as e:
        print(f"Error completing registration: {e}")

if __name__ == "__main__":
    test_complete_registration_api()
