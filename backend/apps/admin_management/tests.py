import json
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from apps.admin_management.models import (
    AdminActivityLog,
    AdminNotification,
    AdminSystemSettings,
)
from apps.authentication.models import DocumentType, UserDocument
from apps.authentication.models import User
from apps.food.models import Food
from apps.orders.models import Order
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase


class AdminDashboardViewSetTestCase(APITestCase):
    """Test cases for AdminDashboardViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
            username="admin@test.com",
        )

        # Create regular users
        self.chef_user = User.objects.create_user(
            email="chef@test.com",
            password="chef123",
            name="Chef User",
            role="cook",
        )

        self.customer_user = User.objects.create_user(
            email="customer@test.com",
            password="customer123",
            name="Customer User",
            role="customer",
        )

        # Create sample orders
        self.order1 = Order.objects.create(
            customer=self.customer_user,
            chef=self.chef_user,
            total_amount=50.00,
            status="completed",
            created_at=timezone.now() - timedelta(days=1),
        )

        self.order2 = Order.objects.create(
            customer=self.customer_user,
            chef=self.chef_user,
            total_amount=75.00,
            status="pending",
            created_at=timezone.now(),
        )

    def test_stats_endpoint_requires_admin_auth(self):
        """Test that stats endpoint requires admin authentication"""
        url = reverse("admin-dashboard-stats")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_stats_endpoint_with_admin_auth(self):
        """Test stats endpoint returns data for authenticated admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-dashboard-stats")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", response.data)
        self.assertIn("total_orders", response.data)
        self.assertIn("total_revenue", response.data)
        self.assertIn("pending_chef_approvals", response.data)

    def test_recent_orders_endpoint(self):
        """Test recent orders endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-dashboard-recent-orders")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class AdminUserManagementViewSetTestCase(APITestCase):
    """Test cases for AdminUserManagementViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
        )

        # Create test users with different roles
        self.pending_chef = User.objects.create_user(
            email="pending.chef@test.com",
            password="chef123",
            name="Pending Chef",
            role="cook",
            approval_status="pending",
            username="pending.chef@test.com",
        )

        self.approved_chef = User.objects.create_user(
            email="approved.chef@test.com",
            password="chef123",
            name="Approved Chef",
            role="cook",
            approval_status="approved",
            username="approved.chef@test.com",
        )

        self.customer = User.objects.create_user(
            email="customer@test.com",
            password="customer123",
            name="Test Customer",
            role="customer",
            approval_status="approved",
            username="customer@test.com",
        )

    def test_list_users_requires_admin_auth(self):
        """Test that list users endpoint requires admin authentication"""
        url = reverse("admin-users-list-users")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_users_with_admin_auth(self):
        """Test listing users with admin authentication"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-list-users")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("users", response.data)
        self.assertGreaterEqual(
            len(response.data["users"]), 3
        )  # At least our test users

    def test_filter_users_by_role(self):
        """Test filtering users by role"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-list-users")
        response = self.client.get(url, {"role": "cook"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that all returned users have cook role
        for user in response.data["users"]:
            self.assertEqual(user["role"], "cook")

    def test_filter_users_by_verification_status(self):
        """Test filtering users by verification status"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-list-users")
        response = self.client.get(url, {"status": "inactive"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that all returned users are inactive
        for user in response.data["users"]:
            self.assertFalse(user["is_active"])

    def test_approve_user_endpoint(self):
        """Test approving a user"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-bulk-activate")

        user_ids = [self.pending_chef.user_id]
        response = self.client.post(url, {"user_ids": user_ids}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Refresh user from database and check verification status
        self.pending_chef.refresh_from_db()
        self.assertTrue(self.pending_chef.is_active)

    def test_reject_user_endpoint(self):
        """Test rejecting a user"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-bulk-deactivate")

        user_ids = [self.pending_chef.user_id]
        response = self.client.post(url, {"user_ids": user_ids}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_bulk_approve_users(self):
        """Test bulk approving multiple users"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-bulk-activate")

        user_ids = [self.pending_chef.user_id]
        response = self.client.post(url, {"user_ids": user_ids}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("updated_count", response.data)

        # Check that user was approved
        self.pending_chef.refresh_from_db()
        self.assertTrue(self.pending_chef.is_active)

    def test_user_details_endpoint(self):
        """Test getting user details"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-details", kwargs={"pk": self.customer.user_id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.customer.email)
        self.assertEqual(response.data["role"], self.customer.role)

    def test_update_user_endpoint(self):
        """Test updating user information"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-users-update-user", kwargs={"pk": self.customer.user_id})

        update_data = {"name": "Updated Name"}

        response = self.client.patch(url, update_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that user was updated
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, "Updated Name")


class AdminOrderManagementViewSetTestCase(APITestCase):
    """Test cases for AdminOrderManagementViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
        )

        # Create chef and customer
        self.chef = User.objects.create_user(
            email="chef@test.com",
            password="chef123",
            name="Test Chef",
            role="cook",
            approval_status="approved",
            username="chef@test.com",
        )

        self.customer = User.objects.create_user(
            email="customer@test.com",
            password="customer123",
            name="Test Customer",
            role="customer",
            approval_status="approved",
            username="customer@test.com",
        )

        # Create orders with different statuses
        self.pending_order = Order.objects.create(
            customer=self.customer, chef=self.chef, total_amount=50.00, status="pending"
        )

        self.confirmed_order = Order.objects.create(
            customer=self.customer,
            chef=self.chef,
            total_amount=75.00,
            status="confirmed",
        )

        self.completed_order = Order.objects.create(
            customer=self.customer,
            chef=self.chef,
            total_amount=100.00,
            status="completed",
        )

    def test_list_orders_requires_admin_auth(self):
        """Test that list orders endpoint requires admin authentication"""
        url = reverse("admin-orders-list-orders")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_orders_with_admin_auth(self):
        """Test listing orders with admin authentication"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-orders-list-orders")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("orders", response.data)
        self.assertGreaterEqual(
            len(response.data["orders"]), 3
        )  # At least our test orders

    def test_filter_orders_by_status(self):
        """Test filtering orders by status"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-orders-list-orders")
        response = self.client.get(url, {"status": "pending"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that all returned orders have pending status
        for order in response.data["orders"]:
            self.assertEqual(order["status"], "pending")

    def test_assign_order_to_chef(self):
        """Test assigning an order to a chef"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-orders-assign-chef", kwargs={"pk": self.pending_order.id})

        response = self.client.patch(url, {"chef_id": self.chef.user_id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check that order was assigned
        self.pending_order.refresh_from_db()
        self.assertEqual(self.pending_order.chef, self.chef)

    def test_update_order_status(self):
        """Test updating order status"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse(
            "admin-orders-update-status", kwargs={"pk": self.pending_order.id}
        )

        response = self.client.patch(url, {"status": "confirmed"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check that order status was updated
        self.pending_order.refresh_from_db()
        self.assertEqual(self.pending_order.status, "confirmed")

    def test_order_details_endpoint(self):
        """Test getting order details"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-orders-details", kwargs={"pk": self.pending_order.id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.pending_order.id)
        self.assertEqual(response.data["status"], self.pending_order.status)


class AdminSystemSettingsViewSetTestCase(APITestCase):
    """Test cases for AdminSystemSettingsViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
            username="admin@test.com",
        )

        # Create some default settings
        self.business_hours_setting = AdminSystemSettings.objects.create(
            key="business_hours",
            value=json.dumps(
                {
                    "monday": {"open": "09:00", "close": "22:00"},
                    "tuesday": {"open": "09:00", "close": "22:00"},
                }
            ),
            setting_type="json",
            category="general",
        )

        self.delivery_radius_setting = AdminSystemSettings.objects.create(
            key="delivery_radius_km",
            value="25",
            setting_type="integer",
            category="general",
        )

    def test_list_settings_requires_admin_auth(self):
        """Test that list settings endpoint requires admin authentication"""
        url = reverse("admin-settings-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_settings_with_admin_auth(self):
        """Test listing system settings with admin authentication"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-settings-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    def test_create_setting(self):
        """Test creating a new system setting"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-settings-list")

        setting_data = {
            "key": "test_setting",
            "value": "test_value",
            "setting_type": "string",
            "category": "general",
        }

        response = self.client.post(url, setting_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["key"], "test_setting")
        self.assertEqual(response.data["value"], "test_value")

    def test_update_setting(self):
        """Test updating an existing setting"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse(
            "admin-settings-detail", kwargs={"key": self.delivery_radius_setting.key}
        )

        update_data = {"value": "30"}

        response = self.client.patch(url, update_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["value"], "30")

        # Check database was updated
        self.delivery_radius_setting.refresh_from_db()
        self.assertEqual(self.delivery_radius_setting.value, "30")

    def test_delete_setting(self):
        """Test deleting a setting"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse(
            "admin-settings-detail", kwargs={"key": self.business_hours_setting.key}
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Check setting was deleted
        with self.assertRaises(AdminSystemSettings.DoesNotExist):
            AdminSystemSettings.objects.get(id=self.business_hours_setting.id)


class AdminNotificationViewSetTestCase(APITestCase):
    """Test cases for AdminNotificationViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
            username="admin@test.com",
        )

        # Create test notifications
        self.unread_notification = AdminNotification.objects.create(
            title="Test Notification",
            message="This is a test notification",
            notification_type="system_alert",
            priority="medium",
            is_read=False,
        )

        self.read_notification = AdminNotification.objects.create(
            title="Read Notification",
            message="This notification has been read",
            notification_type="user_activity",
            priority="low",
            is_read=True,
        )

    def test_list_notifications_requires_admin_auth(self):
        """Test that list notifications endpoint requires admin authentication"""
        url = reverse("admin-notifications-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_notifications_with_admin_auth(self):
        """Test listing notifications with admin authentication"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-notifications-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)  # Should return array directly

    def test_create_notification(self):
        """Test creating a new notification"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-notifications-list")

        notification_data = {
            "title": "New Test Notification",
            "message": "This is a new test notification",
            "notification_type": "system_alert",
        }

        response = self.client.post(url, notification_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Test Notification")
        self.assertFalse(response.data["is_read"])  # Should be unread by default

    def test_mark_notification_as_read(self):
        """Test marking a notification as read"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse(
            "admin-notifications-mark-read", kwargs={"pk": self.unread_notification.id}
        )

        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check notification was marked as read
        self.unread_notification.refresh_from_db()
        self.assertTrue(self.unread_notification.is_read)

    def test_bulk_mark_as_read(self):
        """Test bulk marking notifications as read"""
        # Create another unread notification
        unread_notification2 = AdminNotification.objects.create(
            title="Another Unread Notification",
            message="This is another test notification",
            notification_type="info",
            is_read=False,
        )

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-notifications-mark-all-read")

        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check notifications were marked as read
        self.unread_notification.refresh_from_db()
        unread_notification2.refresh_from_db()
        self.assertTrue(self.unread_notification.is_read)
        self.assertTrue(unread_notification2.is_read)


class AdminActivityLogViewSetTestCase(APITestCase):
    """Test cases for AdminActivityLogViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
        )

        # Create test activity logs
        self.user_approval_log = AdminActivityLog.objects.create(
            admin=self.admin_user,
            action="approve",
            resource_type="user",
            resource_id="1",
            description="Approved user registration",
            ip_address="127.0.0.1",
        )

        self.order_update_log = AdminActivityLog.objects.create(
            admin=self.admin_user,
            action="update",
            resource_type="order",
            resource_id="2",
            description="Updated order status to completed",
            ip_address="127.0.0.1",
        )

    def test_list_activity_logs_requires_admin_auth(self):
        """Test that list activity logs endpoint requires admin authentication"""
        url = reverse("admin-activity-logs-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_activity_logs_with_admin_auth(self):
        """Test listing activity logs with admin authentication"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-activity-logs-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(
            len(response.data["results"]), 2
        )  # At least our test logs

    def test_filter_activity_logs_by_action(self):
        """Test filtering activity logs by action type"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-activity-logs-list")
        response = self.client.get(url, {"action": "approve"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that all returned logs have the correct action
        for log in response.data["results"]:
            self.assertEqual(log["action"], "approve")

    def test_filter_activity_logs_by_date_range(self):
        """Test filtering activity logs by date range"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-activity-logs-list")

        start_date = (timezone.now() - timedelta(days=1)).date()
        end_date = (timezone.now() + timedelta(days=1)).date()

        response = self.client.get(
            url, {"start_date": start_date, "end_date": end_date}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return our test logs
        self.assertGreaterEqual(len(response.data["results"]), 2)

    def test_activity_log_details(self):
        """Test getting activity log details"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse(
            "admin-activity-logs-detail", kwargs={"pk": self.user_approval_log.id}
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["action"], "approve")
        self.assertEqual(response.data["admin_email"], self.admin_user.email)


class AdminDocumentManagementViewSetTestCase(APITestCase):
    """Test cases for AdminDocumentManagementViewSet"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            name="Admin User",
            role="admin",
            username="admin@test.com",
        )

        # Create regular users
        self.chef_user = User.objects.create_user(
            email="chef@test.com",
            password="chef123",
            name="Chef User",
            role="cook",
            approval_status="pending",
        )

        # Create document types
        self.id_document_type = DocumentType.objects.create(
            name="Government ID",
            category="cook",
            description="Government issued ID",
            is_required=True,
            allowed_file_types="pdf,jpg,jpeg,png",
            max_file_size_mb=5,
        )

        # Create sample document
        self.pending_document = UserDocument.objects.create(
            user=self.chef_user,
            document_type=self.id_document_type,
            file_name="id_card.pdf",
            file_size=1024000,
            file_type="pdf",
            file="documents/test_id.pdf",
            cloudinary_public_id="test_id_123",
            status="pending",
            is_visible_to_admin=True,
        )

    def test_pending_documents_requires_admin_auth(self):
        """Test that pending documents endpoint requires admin authentication"""
        url = reverse("admin-documents-pending-documents")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_pending_documents_with_admin_auth(self):
        """Test pending documents endpoint returns data for authenticated admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-documents-pending-documents")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("documents", response.data)
        self.assertIn("pagination", response.data)

    def test_review_document_approve(self):
        """Test approving a document"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-documents-review-document", kwargs={"pk": self.pending_document.id})

        data = {
            "action": "approve",
            "admin_notes": "Document looks good",
        }

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Document approved successfully")

        # Refresh document from database
        self.pending_document.refresh_from_db()
        self.assertEqual(self.pending_document.status, "approved")
        self.assertEqual(self.pending_document.admin_notes, "Document looks good")

    def test_document_details(self):
        """Test getting document details"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("admin-documents-document-details", kwargs={"pk": self.pending_document.id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.pending_document.id)
        self.assertEqual(response.data["status"], "pending")
