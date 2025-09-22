#!/usr/bin/env python
"""
Test script to verify approval email functionality
"""
import os
import sys

import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.authentication.models import User
from apps.authentication.services.email_service import EmailService


def test_approval_email():
    """Test sending an approval email to a user"""
    try:
        # Get a pending user to test with
        pending_user = User.objects.filter(approval_status="pending").first()
        if not pending_user:
            print("No pending users found. Creating a test user...")
            # Create a test user
            test_user = User.objects.create_user(
                email="test@example.com",
                password="testpass123",
                username="test@example.com",
                name="Test User",
                role="cook",
            )
            pending_user = test_user
            print(f"Created test user: {test_user.email}")

        print(f"Testing approval email for user: {pending_user.email}")

        # Test the approval email
        result = EmailService.send_approval_email(
            user=pending_user,
            status="approved",
            admin_notes="Your account has been approved! Welcome to ChefSync Kitchen.",
        )

        if result:
            print("✅ Approval email sent successfully!")
        else:
            print("❌ Failed to send approval email")

    except Exception as e:
        print(f"❌ Error testing approval email: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_approval_email()
