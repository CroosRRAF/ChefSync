from django.core.management.base import BaseCommand
from apps.authentication.models import DocumentType


class Command(BaseCommand):
    help = 'Populate document types for cooks and delivery agents'

    def handle(self, *args, **options):
        # Cook document types
        cook_documents = [
            {
                'name': 'Food Safety Certificate',
                'description': 'Valid food safety certification from recognized authority',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            },
            {
                'name': 'Health Certificate',
                'description': 'Medical certificate showing you are fit to handle food',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            },
            {
                'name': 'Culinary Certification',
                'description': 'Professional cooking certification or diploma (optional)',
                'is_required': False,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 10
            },
            {
                'name': 'Kitchen Photos',
                'description': 'Photos of your kitchen setup and equipment',
                'is_required': True,
                'allowed_file_types': ['jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            }
        ]

        # Delivery agent document types
        delivery_documents = [
            {
                'name': 'Driving License',
                'description': 'Valid driving license for vehicle operation',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            },
            {
                'name': 'Vehicle Registration',
                'description': 'Vehicle registration document',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            },
            {
                'name': 'Insurance Certificate',
                'description': 'Vehicle insurance certificate',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            },
            {
                'name': 'Background Check',
                'description': 'Criminal background check certificate (optional)',
                'is_required': False,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5
            }
        ]

        # Create cook document types
        for doc_data in cook_documents:
            doc_type, created = DocumentType.objects.get_or_create(
                name=doc_data['name'],
                category='cook',
                defaults=doc_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created cook document type: {doc_type.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Cook document type already exists: {doc_type.name}')
                )

        # Create delivery agent document types
        for doc_data in delivery_documents:
            doc_type, created = DocumentType.objects.get_or_create(
                name=doc_data['name'],
                category='delivery_agent',
                defaults=doc_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created delivery agent document type: {doc_type.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Delivery agent document type already exists: {doc_type.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('Successfully populated document types!')
        )
