#!/usr/bin/env python3
"""
Test script to verify Brevo SMTP email configuration
Run this script to test if your Brevo email setup is working correctly
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    print("✅ Django setup successful!")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMessage
from decouple import config

def test_brevo_configuration():
    """Test Brevo SMTP configuration and settings"""
    print("\n🔧 **Brevo Email Configuration Test**")
    print("=" * 50)
    
    # Check current email settings
    print(f"📧 Email Backend: {settings.EMAIL_BACKEND}")
    print(f"🌐 SMTP Host: {settings.EMAIL_HOST}")
    print(f"🔌 SMTP Port: {settings.EMAIL_PORT}")
    print(f"🔒 TLS Enabled: {settings.EMAIL_USE_TLS}")
    print(f"🔐 SSL Enabled: {settings.EMAIL_USE_SSL}")
    print(f"👤 Username: {settings.EMAIL_HOST_USER}")
    print(f"📨 From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    # Check if credentials are set
    if not settings.EMAIL_HOST_USER:
        print("❌ EMAIL_HOST_USER is not set!")
        return False
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("❌ EMAIL_HOST_PASSWORD is not set!")
        return False
    
    print("✅ All required email settings are configured")
    return True

def test_brevo_connection():
    """Test actual connection to Brevo SMTP server"""
    print("\n🔌 **Testing Brevo SMTP Connection**")
    print("=" * 50)
    
    try:
        # Test basic email sending
        test_email = "kajan29062002@gmail.com"  # Your actual email for testing
        
        print(f"📤 Attempting to send test email to: {test_email}")
        
        # Send a simple test email
        send_mail(
            subject='🧪 ChefSync - Brevo SMTP Test',
            message=f'''Hello! 👋

This is a test email to verify your Brevo SMTP configuration is working correctly.

🔧 Test Details:
- SMTP Host: {settings.EMAIL_HOST}
- SMTP Port: {settings.EMAIL_PORT}
- TLS: {settings.EMAIL_USE_TLS}
- From: {settings.DEFAULT_FROM_EMAIL}

✅ If you receive this email, your Brevo setup is working perfectly!

Best regards,
ChefSync Team 🍳''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            fail_silently=False,
        )
        
        print("✅ Test email sent successfully!")
        print("📧 Check your inbox (and spam folder) for the test email")
        return True
        
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        print("\n🔍 **Troubleshooting Tips:**")
        print("1. Check your .env file has correct Brevo credentials")
        print("2. Verify your sender email is verified in Brevo dashboard")
        print("3. Ensure your Brevo account is active")
        print("4. Check if port 587 is not blocked by firewall")
        return False

def test_otp_email():
    """Test OTP email functionality specifically"""
    print("\n🔐 **Testing OTP Email Functionality**")
    print("=" * 50)
    
    try:
        test_email = "kajan29062002@gmail.com"  # Your actual email for testing
        test_otp = "123456"
        
        print(f"📤 Sending OTP email to: {test_email}")
        print(f"🔢 Test OTP: {test_otp}")
        
        # Send OTP email (similar to your actual OTP sending)
        send_mail(
            subject='🔐 ChefSync - Email Verification OTP',
            message=f'''Hello! 👋

Your email verification code is: {test_otp}

⏰ This code will expire in 10 minutes.

🔒 Please do not share this code with anyone.

If you didn't request this code, please ignore this email.

Best regards,
ChefSync Team 🍳''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            fail_silently=False,
        )
        
        print("✅ OTP email sent successfully!")
        print("📧 Check your inbox for the OTP email")
        return True
        
    except Exception as e:
        print(f"❌ OTP email failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 **ChefSync Brevo Email Configuration Test**")
    print("=" * 60)
    
    # Test 1: Configuration check
    if not test_brevo_configuration():
        print("\n❌ Configuration test failed. Please check your .env file.")
        return
    
    # Test 2: Connection test
    if not test_brevo_connection():
        print("\n❌ Connection test failed. Please check your Brevo credentials.")
        return
    
    # Test 3: OTP email test
    if not test_otp_email():
        print("\n❌ OTP email test failed.")
        return
    
    print("\n🎉 **All Tests Passed!**")
    print("=" * 30)
    print("✅ Your Brevo email configuration is working perfectly!")
    print("✅ You can now send OTP emails to your users")
    print("✅ ChefSync registration flow will work correctly")
    
    print("\n📝 **Next Steps:**")
    print("1. Replace 'test@example.com' with your actual email in this script")
    print("2. Test the registration flow in your frontend")
    print("3. Monitor email delivery in Brevo dashboard")

if __name__ == "__main__":
    main()
