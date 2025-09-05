#!/usr/bin/env python
"""
Test OTP verification with specific test case
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_otp_verification():
    """Test OTP verification with the test OTP we just created"""
    verify_url = f"{BASE_URL}/verify-otp/"
    verify_data = {
        "email": "test@example.com",
        "otp": "626161",  # The test OTP we just created
        "purpose": "registration"
    }
    
    print(f"Testing OTP verification with data: {verify_data}")
    
    try:
        response = requests.post(verify_url, json=verify_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ OTP verification successful!")
        else:
            print("❌ OTP verification failed!")
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    print(f"Error details: {error_data}")
                except:
                    pass
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_otp_verification()
