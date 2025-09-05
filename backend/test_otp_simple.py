import requests
import json

# Test OTP sending
url = "http://127.0.0.1:8000/api/auth/send-otp/"
data = {
    "email": "test@example.com",
    "name": "Test User", 
    "purpose": "registration"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ OTP sent successfully!")
    else:
        print("❌ OTP sending failed!")
        
except Exception as e:
    print(f"Error: {e}")
