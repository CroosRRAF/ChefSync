#!/usr/bin/env python
"""
Test script to check if approval functionality is working correctly
"""
import os
import django
import sys

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.authentication.services.email_service import EmailService
from django.contrib.auth import get_user_model
from django.utils import timezone

def test_approval_workflow():
    """Test the complete approval workflow"""
    print("🧪 Testing Approval Workflow...")
    
    # Find a pending cook or delivery agent
    pending_users = User.objects.filter(
        role__in=['cook', 'delivery_agent'], 
        approval_status='pending'
    )
    
    print(f"📊 Found {pending_users.count()} pending users")
    
    if pending_users.exists():
        user = pending_users.first()
        print(f"👤 Testing with user: {user.name} ({user.email}, {user.role})")
        print(f"📋 Current status: {user.approval_status}")
        
        # Test email service directly
        print("\n📧 Testing email service...")
        try:
            result = EmailService.send_approval_email(user, 'approved', 'Test approval from script')
            print(f"✅ Email service result: {result}")
        except Exception as e:
            print(f"❌ Email service failed: {e}")
            
        # Test database update
        print("\n💾 Testing database update...")
        try:
            original_status = user.approval_status
            user.approval_status = 'approved'
            user.approved_at = timezone.now()
            user.approval_notes = 'Test approval from script'
            user.save()
            print(f"✅ Status changed from {original_status} to {user.approval_status}")
            
            # Revert for testing
            user.approval_status = original_status
            user.approved_at = None
            user.approval_notes = ''
            user.save()
            print(f"🔄 Reverted status back to {user.approval_status}")
            
        except Exception as e:
            print(f"❌ Database update failed: {e}")
    else:
        print("⚠️ No pending users found to test with")
        print("Creating a test user...")
        
        # Create a test user
        try:
            test_user = User.objects.create_user(
                email='test_cook@example.com',
                password='testpass123',
                name='Test Cook',
                role='cook',
                approval_status='pending'
            )
            print(f"✅ Created test user: {test_user.name} ({test_user.email})")
            
            # Test email with this user
            result = EmailService.send_approval_email(test_user, 'approved', 'Test approval')
            print(f"📧 Email test result: {result}")
            
        except Exception as e:
            print(f"❌ Failed to create test user: {e}")

def check_email_config():
    """Check email configuration"""
    print("📧 Checking email configuration...")
    from django.conf import settings
    
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER[:5]}..." if settings.EMAIL_HOST_USER else "Not set")

if __name__ == '__main__':
    print("🚀 Starting Approval System Test")
    print("=" * 50)
    
    check_email_config()
    print("\n" + "=" * 50)
    test_approval_workflow()
    
    print("\n✅ Test completed!")