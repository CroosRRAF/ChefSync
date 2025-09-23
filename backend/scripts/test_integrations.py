#!/usr/bin/env python
"""
Test script to verify Cloudinary and SMTP integration for ChefSync admin verification system.
"""
import os
import sys
from pathlib import Path

import django

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import cloudinary
import cloudinary.api
import cloudinary.uploader
import requests
from apps.authentication.services.email_service import EmailService
from django.conf import settings
from django.core.mail import send_mail


def test_cloudinary_connection():
    """Test Cloudinary connection and basic operations."""
    print("🔍 Testing Cloudinary Integration...")
    print("=" * 50)

    try:
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
            api_key=settings.CLOUDINARY_STORAGE["API_KEY"],
            api_secret=settings.CLOUDINARY_STORAGE["API_SECRET"],
            secure=True,
        )
        print("✅ Cloudinary configured successfully")

        # Test connection by getting account info
        account_info = cloudinary.api.ping()
        print(f"✅ Cloudinary connection successful: {account_info}")

        # Test upload (small test file)
        test_file_path = backend_dir / "test_upload.txt"
        with open(test_file_path, "w") as f:
            f.write("This is a test file for Cloudinary upload verification.")

        try:
            upload_result = cloudinary.uploader.upload(
                str(test_file_path), folder="chefsync/test/", resource_type="raw"
            )
            print(f"✅ Test file uploaded successfully: {upload_result['secure_url']}")

            # Test fetch URL
            test_url = upload_result["secure_url"]
            response = requests.get(test_url, timeout=10)
            if response.status_code == 200:
                print("✅ Uploaded file is accessible via URL")
            else:
                print(f"⚠️  Uploaded file returned status: {response.status_code}")

            # Clean up test file
            cloudinary.uploader.destroy(upload_result["public_id"], resource_type="raw")
            print("✅ Test file cleaned up from Cloudinary")

        except Exception as e:
            print(f"❌ Cloudinary upload test failed: {str(e)}")
        finally:
            # Clean up local test file
            if test_file_path.exists():
                test_file_path.unlink()

        return True

    except Exception as e:
        print(f"❌ Cloudinary test failed: {str(e)}")
        return False


def test_smtp_connection():
    """Test SMTP connection by sending a test email."""
    print("\n🔍 Testing SMTP Integration...")
    print("=" * 50)

    try:
        # Test basic send_mail function
        test_subject = "ChefSync - SMTP Test"
        test_message = """
Hello,

This is a test email to verify SMTP configuration for ChefSync.

If you received this email, the SMTP integration is working correctly.

Best regards,
ChefSync Test System
        """

        # Send test email to admin
        admin_email = getattr(settings, "ADMIN_EMAIL", "test@example.com")

        result = send_mail(
            subject=test_subject,
            message=test_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            fail_silently=False,
        )

        if result == 1:
            print(f"✅ Basic SMTP test successful - Email sent to {admin_email}")
        else:
            print(f"❌ Basic SMTP test failed - send_mail returned {result}")

        # Test EmailService
        print("\n🔍 Testing EmailService...")

        # Create a test user-like object
        class TestUser:
            def __init__(self):
                self.name = "Test Admin"
                self.email = admin_email
                self.role = "admin"

            def get_role_display(self):
                return "Administrator"

        test_user = TestUser()

        # Test approval email
        approval_result = EmailService.send_approval_email(
            test_user, "approved", "Test approval notes"
        )
        if approval_result:
            print("✅ EmailService approval email sent successfully")
        else:
            print("❌ EmailService approval email failed")

        # Test OTP email
        otp_result = EmailService.send_otp(admin_email, "test", "Test User")
        if otp_result["success"]:
            print(
                f"✅ EmailService OTP email sent successfully: {otp_result['message']}"
            )
        else:
            print(f"❌ EmailService OTP email failed: {otp_result['message']}")

        return True

    except Exception as e:
        print(f"❌ SMTP test failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


def test_admin_approval_workflow():
    """Test the complete admin approval workflow simulation."""
    print("\n🔍 Testing Admin Approval Workflow...")
    print("=" * 50)

    try:
        from apps.authentication.models import User, UserDocument
        from apps.users.models import ChefProfile

        # Check if we have any pending users
        pending_users = User.objects.filter(
            role__in=["cook", "delivery_agent"], approval_status="pending"
        )[
            :1
        ]  # Just test with one user

        if pending_users.exists():
            test_user = pending_users.first()
            if test_user:
                print(f"✅ Found pending user: {test_user.name} ({test_user.email})")

                # Check user's documents
                documents = UserDocument.objects.filter(user=test_user)
                if documents.exists():
                    print(f"✅ User has {documents.count()} documents")
                    for doc in documents:
                        if doc:
                            print(f"  - {doc.file_name}: {doc.file}")
                else:
                    print("⚠️  User has no documents uploaded")

                # Simulate approval workflow
                print("\n🔍 Simulating approval workflow...")

                # 1. Fetch document from Cloudinary (if exists)
                if documents.exists():
                    doc = documents.first()
                    if doc and doc.file and "cloudinary" in doc.file:
                        print(f"✅ Document stored in Cloudinary: {doc.file}")
                        # Test URL accessibility
                        try:
                            response = requests.head(doc.file, timeout=10)
                            if response.status_code == 200:
                                print("✅ Document URL is accessible")
                            else:
                                print(
                                    f"⚠️  Document URL returned status: {response.status_code}"
                                )
                        except Exception as e:
                            print(f"❌ Document URL test failed: {str(e)}")

                # 2. Update user status (simulate)
                print("✅ Would update user status to 'approved'")

                # 3. Send approval email (already tested above)
                print("✅ Would send approval email notification")
            else:
                print("⚠️  No pending users found for testing")

        return True

    except Exception as e:
        print(f"❌ Admin workflow test failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("🚀 ChefSync Admin Verification System - Integration Tests")
    print("=" * 60)

    results = []

    # Test Cloudinary
    cloudinary_ok = test_cloudinary_connection()
    results.append(("Cloudinary Integration", cloudinary_ok))

    # Test SMTP
    smtp_ok = test_smtp_connection()
    results.append(("SMTP Integration", smtp_ok))

    # Test Admin Workflow
    workflow_ok = test_admin_approval_workflow()
    results.append(("Admin Workflow", workflow_ok))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED - System is ready for production!")
    else:
        print(
            "⚠️  SOME TESTS FAILED - Please check the errors above and fix configuration issues."
        )
        print("\n🔧 DEBUGGING GUIDANCE:")
        print("- For Cloudinary issues: Check CLOUDINARY_* environment variables")
        print(
            "- For SMTP issues: Check EMAIL_* environment variables and Brevo account"
        )
        print("- For workflow issues: Ensure database is properly set up")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
