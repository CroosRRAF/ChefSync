#!/usr/bin/env python
"""
Test script for OTP verification endpoint
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_send_otp():
    """Test sending OTP first"""
    print("🔄 Testing OTP sending...")
    
    send_url = f"{BASE_URL}/send-otp/"
    send_data = {
        "email": "test@example.com",
        "name": "Test User",
        "purpose": "registration"
    }
    
    try:
        response = requests.post(send_url, json=send_data)
        print(f"Send OTP Status: {response.status_code}")
        print(f"Send OTP Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ OTP sent successfully!")
            return True
        else:
            print("❌ OTP sending failed!")
            return False
            
    except Exception as e:
        print(f"Error sending OTP: {e}")
        return False

def test_verify_otp():
    """Test verifying OTP"""
    print("\n🔍 Testing OTP verification...")
    
    verify_url = f"{BASE_URL}/verify-otp/"
    verify_data = {
        "email": "test@example.com",
        "otp": "123456",  # Test OTP
        "purpose": "registration"
    }
    
    try:
        response = requests.post(verify_url, json=verify_data)
        print(f"Verify OTP Status: {response.status_code}")
        print(f"Verify OTP Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ OTP verification successful!")
            return True
        else:
            print("❌ OTP verification failed!")
            return False
            
    except Exception as e:
        print(f"Error verifying OTP: {e}")
        return False

def test_verify_otp_invalid():
    """Test verifying invalid OTP data"""
    print("\n🧪 Testing invalid OTP data scenarios...")
    
    verify_url = f"{BASE_URL}/verify-otp/"
    
    # Test cases with different invalid data
    test_cases = [
        {"email": "test@example.com", "otp": "12345", "purpose": "registration"},  # 5 digits
        {"email": "test@example.com", "otp": "1234567", "purpose": "registration"},  # 7 digits
        {"email": "test@example.com", "otp": "abcdef", "purpose": "registration"},  # Non-numeric
        {"email": "invalid-email", "otp": "123456", "purpose": "registration"},  # Invalid email
        {"email": "test@example.com", "purpose": "registration"},  # Missing OTP
        {"otp": "123456", "purpose": "registration"},  # Missing email
        {"email": "test@example.com", "otp": "123456"},  # Missing purpose
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"\n📝 Test case {i}: {test_data}")
        try:
            response = requests.post(verify_url, json=test_data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing OTP Verification Endpoint")
    print("=" * 50)
    
    # Test sending OTP first
    send_success = test_send_otp()
    
    # Test verifying OTP
    verify_success = test_verify_otp()
    
    # Test invalid scenarios
    test_verify_otp_invalid()
    
    print(f"\n📊 Summary:")
    print(f"Send OTP: {'✅ PASS' if send_success else '❌ FAIL'}")
    print(f"Verify OTP: {'✅ PASS' if verify_success else '❌ FAIL'}")
