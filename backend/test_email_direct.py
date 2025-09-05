#!/usr/bin/env python
import os
import django
import sys

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.services.email_service import EmailService

def test_email_service():
    print("🧪 Testing Email Service...")
    try:
        email_service = EmailService()
        
        # Test sending OTP
        test_email = "kajanpirathap@gmail.com"
        test_name = "Test User"
        test_otp = "123456"
        
        result = email_service.send_otp(test_email, test_name, test_otp)
        
        if result:
            print(f"✅ Email sent successfully to {test_email}")
            print(f"📧 OTP: {test_otp}")
        else:
            print("❌ Email sending failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_email_service()
