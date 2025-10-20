from apps.authentication.models import DocumentType, UserDocument
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

User = get_user_model()


class ApprovalWorkflowTest(TestCase):
    """Test the role-based registration and approval workflow"""

    def setUp(self):
        """Set up test data"""
        # Create admin user for approvals
        self.admin = User.objects.create_user(
            username="admin@test.com",
            email="admin@test.com",
            password="adminpass123",
            name="Test Admin",
            role="admin",
        )

    def test_customer_auto_approval(self):
        """Test that customers are automatically approved"""
        customer = User.objects.create_user(
            email="customer@test.com",
            password="customerpass123",
            name="Test Customer",
            role="customer",
        )

        self.assertEqual(customer.approval_status, "approved")
        self.assertIsNone(customer.approved_at)
        self.assertIsNone(customer.approved_by)

    def test_cook_pending_approval(self):
        """Test that cooks start with pending approval"""
        cook = User.objects.create_user(
            email="cook@test.com", password="cookpass123", name="Test Cook", role="cook"
        )

        self.assertEqual(cook.approval_status, "pending")
        self.assertIsNone(cook.approved_at)
        self.assertIsNone(cook.approved_by)

    def test_delivery_agent_pending_approval(self):
        """Test that delivery agents start with pending approval"""
        agent = User.objects.create_user(
            email="agent@test.com",
            password="agentpass123",
            name="Test Delivery Agent",
            role="delivery_agent",
        )

        self.assertEqual(agent.approval_status, "pending")
        self.assertIsNone(agent.approved_at)
        self.assertIsNone(agent.approved_by)

    def test_admin_approval_workflow(self):
        """Test the complete admin approval workflow"""
        # Create a pending cook
        cook = User.objects.create_user(
            email="pending_cook@test.com",
            password="cookpass123",
            name="Pending Cook",
            role="cook",
        )

        self.assertEqual(cook.approval_status, "pending")

        # Admin approves the cook
        cook.approval_status = "approved"
        cook.approved_by = self.admin
        cook.approved_at = timezone.now()
        cook.approval_notes = "Approved after document review"
        cook.save()

        # Refresh from database
        cook.refresh_from_db()

        self.assertEqual(cook.approval_status, "approved")
        self.assertEqual(cook.approved_by, self.admin)
        self.assertIsNotNone(cook.approved_at)
        self.assertEqual(cook.approval_notes, "Approved after document review")

    def test_admin_rejection_workflow(self):
        """Test the admin rejection workflow"""
        # Create a pending delivery agent
        agent = User.objects.create_user(
            email="pending_agent@test.com",
            password="agentpass123",
            name="Pending Agent",
            role="delivery_agent",
        )

        self.assertEqual(agent.approval_status, "pending")

        # Admin rejects the agent
        agent.approval_status = "rejected"
        agent.approved_by = self.admin
        agent.approved_at = timezone.now()
        agent.approval_notes = "Documents incomplete"
        agent.save()

        # Refresh from database
        agent.refresh_from_db()

        self.assertEqual(agent.approval_status, "rejected")
        self.assertEqual(agent.approved_by, self.admin)
        self.assertIsNotNone(agent.approved_at)
        self.assertEqual(agent.approval_notes, "Documents incomplete")

    def test_can_login_logic(self):
        """Test the can_login method logic"""
        # Customer should always be able to login
        customer = User.objects.create_user(
            email="login_customer@test.com",
            password="customerpass123",
            name="Login Customer",
            role="customer",
        )
        self.assertTrue(customer.can_login())

        # Admin should always be able to login
        admin = User.objects.create_user(
            email="login_admin@test.com",
            password="adminpass123",
            name="Login Admin",
            role="admin",
        )
        self.assertTrue(admin.can_login())

        # Pending cook should not be able to login
        pending_cook = User.objects.create_user(
            email="pending_login_cook@test.com",
            password="cookpass123",
            name="Pending Login Cook",
            role="cook",
        )
        self.assertFalse(pending_cook.can_login())

        # Approved cook should be able to login
        pending_cook.approval_status = "approved"
        pending_cook.save()
        self.assertTrue(pending_cook.can_login())

        # Rejected cook should not be able to login
        pending_cook.approval_status = "rejected"
        pending_cook.save()
        self.assertFalse(pending_cook.can_login())


class DocumentTypeTest(TestCase):
    """Test document type management"""

    def test_populate_document_types_command(self):
        """Test that the populate_document_types management command works"""
        from io import StringIO

        from django.core.management import call_command

        # Run the command
        out = StringIO()
        call_command("populate_document_types", stdout=out)

        # Check that document types were created
        cook_docs = DocumentType.objects.filter(category="cook")
        delivery_docs = DocumentType.objects.filter(category="delivery_agent")

        self.assertTrue(cook_docs.exists())
        self.assertTrue(delivery_docs.exists())

        # Check specific document types
        food_safety = DocumentType.objects.get(
            name="Food Safety Certificate", category="cook"
        )
        self.assertTrue(food_safety.is_required)
        self.assertIn("pdf", food_safety.allowed_file_types)

        driving_license = DocumentType.objects.get(
            name="Driving License", category="delivery_agent"
        )
        self.assertTrue(driving_license.is_required)
        self.assertIn("pdf", driving_license.allowed_file_types)

    def test_document_type_uniqueness(self):
        """Test that document types are unique per name and category"""
        DocumentType.objects.create(
            name="Test Doc", category="cook", description="Test document"
        )

        # Should be able to create same name in different category
        DocumentType.objects.create(
            name="Test Doc", category="delivery_agent", description="Test document"
        )

        # Should not be able to create duplicate in same category
        with self.assertRaises(Exception):
            DocumentType.objects.create(
                name="Test Doc", category="cook", description="Duplicate test document"
            )


class UserDocumentTest(TestCase):
    """Test user document management"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email="doc_user@test.com",
            password="userpass123",
            name="Document User",
            role="cook",
        )

        self.doc_type = DocumentType.objects.create(
            name="Test Certificate", category="cook", description="Test document type"
        )

    def test_user_document_creation(self):
        """Test creating user documents"""
        document = UserDocument.objects.create(
            user=self.user,
            document_type=self.doc_type,
            file="https://example.com/test.pdf",
            file_name="test.pdf",
            file_size=1024,
            file_type="application/pdf",
        )

        self.assertEqual(document.status, "pending")
        self.assertEqual(document.user, self.user)
        self.assertEqual(document.document_type, self.doc_type)
        self.assertFalse(document.is_visible_to_admin)

    def test_document_status_workflow(self):
        """Test document approval workflow"""
        document = UserDocument.objects.create(
            user=self.user,
            document_type=self.doc_type,
            file="https://example.com/test.pdf",
            file_name="test.pdf",
            file_size=1024,
            file_type="application/pdf",
        )

        # Initially pending
        self.assertEqual(document.status, "pending")

        # Admin reviews and approves
        admin = User.objects.create_user(
            email="review_admin@test.com",
            password="adminpass123",
            name="Review Admin",
            role="admin",
        )

        document.status = "approved"
        document.reviewed_by = admin
        document.reviewed_at = timezone.now()
        document.admin_notes = "Looks good"
        document.is_visible_to_admin = True
        document.save()

        document.refresh_from_db()
        self.assertEqual(document.status, "approved")
        self.assertEqual(document.reviewed_by, admin)
        self.assertIsNotNone(document.reviewed_at)
        self.assertTrue(document.is_visible_to_admin)
