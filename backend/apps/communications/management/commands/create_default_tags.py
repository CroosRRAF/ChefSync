from django.core.management.base import BaseCommand
from apps.communications.models import CommunicationTag

class Command(BaseCommand):
    help = 'Creates default communication tags'

    def handle(self, *args, **options):
        tags = [
            {
                'name': 'Urgent',
                'description': 'Requires immediate attention',
                'color': '#dc3545'  # Red
            },
            {
                'name': 'Priority',
                'description': 'High priority but not urgent',
                'color': '#ffc107'  # Yellow
            },
            {
                'name': 'Feedback',
                'description': 'Customer feedback',
                'color': '#28a745'  # Green
            },
            {
                'name': 'Bug Report',
                'description': 'Technical issue or bug',
                'color': '#17a2b8'  # Cyan
            },
            {
                'name': 'Feature Request',
                'description': 'Request for new features',
                'color': '#6610f2'  # Purple
            },
            {
                'name': 'Critical',
                'description': 'Critical issue requiring immediate resolution',
                'color': '#dc3545'  # Red
            },
            {
                'name': 'Enhancement',
                'description': 'Suggestions for improvement',
                'color': '#20c997'  # Teal
            },
            {
                'name': 'Question',
                'description': 'General inquiry or question',
                'color': '#6c757d'  # Gray
            },
            {
                'name': 'Billing',
                'description': 'Payment or billing related',
                'color': '#fd7e14'  # Orange
            },
            {
                'name': 'Documentation',
                'description': 'Documentation related',
                'color': '#007bff'  # Blue
            },
        ]

        created_count = 0
        for tag_data in tags:
            tag, created = CommunicationTag.objects.get_or_create(
                name=tag_data['name'],
                defaults=tag_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created tag: {tag.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Tag already exists: {tag.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} communication tags'
            )
        )