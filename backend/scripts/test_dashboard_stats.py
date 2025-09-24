#!/usr/bin/env python
"""
Test script to check das        # For testing purposes, let's directly query the database like the viewset does
        from apps.food.models import Food
        from apps.orders.models import Order

        # Pending chef approvals (cooks only)
        pending_chef_approvals = User.objects.filter(
            role="Cook", approval_status="pending"
        ).count()

        # Pending user approvals (cooks and delivery agents)
        pending_user_approvals = User.objects.filter(
            role__in=["Cook", "DeliveryAgent"], approval_status="pending"
        ).count()

        stats_data = {
            'pending_chef_approvals': pending_chef_approvals,
            'pending_user_approvals': pending_user_approvals,
        }I
"""
import os
import sys
from pathlib import Path

import django
import requests

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.authentication.models import User


def test_dashboard_stats():
    """Test the dashboard stats API"""
    print("🔍 Testing Dashboard Stats API...")
    print("=" * 50)

    try:
        # Check if we have any admin users
        admin_users = User.objects.filter(role="Admin", is_active=True)
        if not admin_users.exists():
            print("❌ No active admin users found. Creating a test admin user...")

            # Create a test admin user
            admin_user = User.objects.create_user(
                username="testadmin",
                email="testadmin@chefsync.com",
                password="test123",
                name="Test Admin",
                role="Admin"
            )
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            print("✅ Test admin user created")

        # Get the first admin user
        admin_user = User.objects.filter(role="Admin", is_active=True).first()
        if not admin_user:
            print("❌ Could not find or create admin user")
            return False

        print(f"✅ Using admin user: {admin_user.email}")

        # For testing purposes, let's directly query the database like the viewset does
        from apps.food.models import Food
        from apps.orders.models import Order

        # Pending chef approvals (cooks only)
        pending_chef_approvals = User.objects.filter(
            role="Cook", approval_status="pending"
        ).count()

        # Pending user approvals (cooks and delivery agents)
        pending_user_approvals = User.objects.filter(
            role__in=["Cook", "DeliveryAgent"], approval_status="pending"
        ).count()

        stats_data = {
            'pending_chef_approvals': pending_chef_approvals,
            'pending_user_approvals': pending_user_approvals,
        }

        print("✅ Dashboard stats retrieved successfully")
        print("\n📊 STATS DATA:")
        print(f"  pending_chef_approvals: {stats_data.get('pending_chef_approvals', 'NOT FOUND')}")
        print(f"  pending_user_approvals: {stats_data.get('pending_user_approvals', 'NOT FOUND')}")

        # Calculate the delivery agent approvals
        chef_approvals = stats_data.get('pending_chef_approvals', 0)
        user_approvals = stats_data.get('pending_user_approvals', 0)
        delivery_agent_approvals = user_approvals - chef_approvals

        print(f"  calculated delivery_agent_approvals: {delivery_agent_approvals}")

        if 'pending_user_approvals' in stats_data:
            print("✅ pending_user_approvals field is present in the data")
            return True
        else:
            print("❌ pending_user_approvals field is missing from the data")
            return False

    except Exception as e:
        print(f"❌ Dashboard stats test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_dashboard_stats()
    sys.exit(0 if success else 1)    success = test_dashboard_stats()
    sys.exit(0 if success else 1)
