from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.communications.models import Communication, CommunicationResponse
from django.utils import timezone
import uuid

def generate_reference_number():
    return f'COMM-{str(uuid.uuid4().hex[:8]).upper()}'

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test data for feedback and complaints'

    def handle(self, *args, **kwargs):
        # Create test user
        user, created = User.objects.get_or_create(
            email='test.user@example.com',
            defaults={
                'username': 'test.user',
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True
            }
        )
        self.stdout.write(f'{"Created" if created else "Using existing"} test user: {user.email}')

        # Create test admin user for responses
        admin_user, created = User.objects.get_or_create(
            email='admin@chefsync.com',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        self.stdout.write(f'{"Created" if created else "Using existing"} admin user: {admin_user.email}')

        # Create feedback entries
        feedback_data = [
            {
                'subject': 'Great Food Experience',
                'message': 'The food was absolutely delicious and arrived hot! Will order again.',
                'communication_type': 'feedback',
                'priority': 'medium',
                'status': 'pending'
            },
            {
                'subject': 'Excellent Service',
                'message': 'The chef was very professional and accommodating to my dietary restrictions.',
                'communication_type': 'feedback',
                'priority': 'high',
                'status': 'in_progress'
            },
            {
                'subject': 'Feedback on Mobile App',
                'message': 'The app is user-friendly but could use some improvements in the menu search.',
                'communication_type': 'feedback',
                'priority': 'low',
                'status': 'resolved'
            }
        ]

        for data in feedback_data:
            feedback = Communication.objects.create(
                user=user,
                reference_number=generate_reference_number(),
                **data
            )
            self.stdout.write(f'Created feedback: {feedback.subject} (ID: {feedback.id})')

            # Add a response to the feedback
            if data['status'] in ['in_progress', 'resolved']:
                response = CommunicationResponse.objects.create(
                    communication=feedback,
                    responder=admin_user,
                    message=f"Thank you for your feedback. We appreciate your input.",
                    is_internal=False
                )
                if data['status'] == 'resolved':
                    feedback.resolve("Issue has been addressed.")
                self.stdout.write(f'Added response to feedback ID {feedback.id}')

        # Create complaint entries
        complaint_data = [
            {
                'subject': 'Late Delivery',
                'message': 'My order was delivered 45 minutes late and the food was cold.',
                'communication_type': 'complaint',
                'priority': 'high',
                'status': 'pending'
            },
            {
                'subject': 'Wrong Order Items',
                'message': 'I received different items than what I ordered.',
                'communication_type': 'complaint',
                'priority': 'urgent',
                'status': 'in_progress'
            },
            {
                'subject': 'Missing Side Dish',
                'message': 'My order was missing the side salad that I paid for.',
                'communication_type': 'complaint',
                'priority': 'medium',
                'status': 'resolved'
            }
        ]

        for data in complaint_data:
            complaint = Communication.objects.create(
                user=user,
                reference_number=generate_reference_number(),
                **data
            )
            self.stdout.write(f'Created complaint: {complaint.subject} (ID: {complaint.id})')

            # Add responses to complaints
            if data['status'] in ['in_progress', 'resolved']:
                initial_response = CommunicationResponse.objects.create(
                    communication=complaint,
                    responder=admin_user,
                    message="We apologize for the inconvenience. We are looking into this issue.",
                    is_internal=False
                )
                self.stdout.write(f'Added initial response to complaint ID {complaint.id}')

            if data['status'] == 'resolved':
                resolution_response = CommunicationResponse.objects.create(
                    communication=complaint,
                    responder=admin_user,
                    message="We have resolved your complaint and applied a credit to your account.",
                    is_internal=False
                )
                complaint.resolve("Customer complaint has been addressed and credit has been applied.")
                self.stdout.write(f'Added resolution response to complaint ID {complaint.id}')

        self.stdout.write(self.style.SUCCESS('Successfully created all test data'))