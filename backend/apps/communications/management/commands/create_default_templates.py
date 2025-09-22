from django.core.management.base import BaseCommand
from apps.communications.models import CommunicationTemplate

class Command(BaseCommand):
    help = 'Creates default communication templates'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'General Acknowledgment',
                'template_type': 'acknowledgment',
                'subject': 'Your Communication Has Been Received',
                'content': '''Dear {user_name},

Thank you for reaching out to us. We have received your {communication_type} and it has been assigned reference number: {reference_number}.

Our team will review your message and respond as soon as possible. You can track the status of your communication using the reference number provided.

Best regards,
ChefSync Team''',
                'variables': {
                    'user_name': 'Customer name',
                    'communication_type': 'Type of communication',
                    'reference_number': 'Unique reference number'
                }
            },
            {
                'name': 'Feedback Response',
                'template_type': 'feedback',
                'subject': 'Thank You for Your Feedback',
                'content': '''Dear {user_name},

Thank you for taking the time to provide your valuable feedback (Ref: {reference_number}). We greatly appreciate your input as it helps us improve our services.

{response_message}

If you have any additional comments or questions, please don't hesitate to reach out to us.

Best regards,
ChefSync Team''',
                'variables': {
                    'user_name': 'Customer name',
                    'reference_number': 'Unique reference number',
                    'response_message': 'Custom response message'
                }
            },
            {
                'name': 'Complaint Resolution',
                'template_type': 'complaint',
                'subject': 'Resolution for Your Complaint',
                'content': '''Dear {user_name},

We are writing regarding your complaint (Ref: {reference_number}).

{resolution_message}

We value your business and hope this resolution meets your satisfaction. If you need any clarification or have additional concerns, please don't hesitate to contact us.

Thank you for your patience and understanding.

Best regards,
ChefSync Team''',
                'variables': {
                    'user_name': 'Customer name',
                    'reference_number': 'Unique reference number',
                    'resolution_message': 'Resolution details'
                }
            },
            {
                'name': 'Inquiry Response',
                'template_type': 'inquiry',
                'subject': 'Response to Your Inquiry',
                'content': '''Dear {user_name},

Thank you for your inquiry (Ref: {reference_number}). 

{response_message}

We hope this information helps. If you have any additional questions, feel free to reach out to us.

Best regards,
ChefSync Team''',
                'variables': {
                    'user_name': 'Customer name',
                    'reference_number': 'Unique reference number',
                    'response_message': 'Response to inquiry'
                }
            },
            {
                'name': 'Status Update',
                'template_type': 'general',
                'subject': 'Update on Your Communication',
                'content': '''Dear {user_name},

We are writing to provide an update on your {communication_type} (Ref: {reference_number}).

Current Status: {status}

{update_message}

We will continue to keep you informed of any developments.

Best regards,
ChefSync Team''',
                'variables': {
                    'user_name': 'Customer name',
                    'communication_type': 'Type of communication',
                    'reference_number': 'Unique reference number',
                    'status': 'Current status',
                    'update_message': 'Status update message'
                }
            },
        ]

        created_count = 0
        for template_data in templates:
            template, created = CommunicationTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} communication templates'
            )
        )