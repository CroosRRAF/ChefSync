from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Communication,
    CommunicationResponse,
    CommunicationTemplate,
    CommunicationCategory,
    CommunicationTag
)

User = get_user_model()


class CommunicationModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123'
        )
        self.communication = Communication.objects.create(
            user=self.user,
            communication_type='feedback',
            subject='Test Feedback',
            message='This is a test feedback message',
            reference_number='TEST-12345'
        )

    def test_communication_creation(self):
        """Test creating a new communication"""
        self.assertEqual(self.communication.user, self.user)
        self.assertEqual(self.communication.status, 'pending')
        self.assertEqual(self.communication.priority, 'medium')
        self.assertFalse(self.communication.is_read)

    def test_mark_as_read(self):
        """Test marking communication as read"""
        self.communication.mark_as_read()
        self.assertTrue(self.communication.is_read)
        self.assertIsNotNone(self.communication.read_at)

    def test_resolve_communication(self):
        """Test resolving a communication"""
        resolution_notes = 'Issue has been resolved'
        self.communication.resolve(resolution_notes)
        self.assertEqual(self.communication.status, 'resolved')
        self.assertEqual(self.communication.resolution_notes, resolution_notes)
        self.assertIsNotNone(self.communication.resolved_at)


class CommunicationResponseTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123'
        )
        self.communication = Communication.objects.create(
            user=self.user,
            communication_type='feedback',
            subject='Test Feedback',
            message='This is a test feedback message',
            reference_number='TEST-12345'
        )

    def test_response_creation(self):
        """Test creating a response to a communication"""
        response = CommunicationResponse.objects.create(
            communication=self.communication,
            responder=self.user,
            message='Test response message'
        )
        self.assertEqual(response.communication, self.communication)
        self.assertEqual(response.responder, self.user)
        self.assertFalse(response.is_internal)


class CommunicationTemplateTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123'
        )

    def test_template_creation(self):
        """Test creating a communication template"""
        template = CommunicationTemplate.objects.create(
            name='Test Template',
            template_type='feedback',
            subject='Feedback Response',
            content='Thank you for your feedback: {message}',
            variables={'message': 'Feedback content'},
            created_by=self.user
        )
        self.assertEqual(template.name, 'Test Template')
        self.assertTrue(template.is_active)


class CommunicationCategoryTests(TestCase):
    def test_category_creation(self):
        """Test creating communication categories"""
        parent = CommunicationCategory.objects.create(
            name='Parent Category',
            description='Parent category description'
        )
        child = CommunicationCategory.objects.create(
            name='Child Category',
            description='Child category description',
            parent=parent
        )
        self.assertEqual(child.parent, parent)
        self.assertTrue(child.is_active)


class CommunicationTagTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123'
        )

    def test_tag_creation(self):
        """Test creating communication tags"""
        tag = CommunicationTag.objects.create(
            name='Test Tag',
            description='Test tag description',
            color='#007bff',
            created_by=self.user
        )
        self.assertEqual(tag.name, 'Test Tag')
        self.assertEqual(tag.color, '#007bff')