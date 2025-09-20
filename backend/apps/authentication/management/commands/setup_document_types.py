from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = 'Setup default document types for cooks and delivery agents'

    def handle(self, *args, **options):
        DocumentType = apps.get_model('authentication', 'DocumentType')
        
        # Cook document types
        cook_documents = [
            {
                'name': 'Food Safety Certificate',
                'category': 'cook',
                'description': 'Valid food safety certification from a recognized authority',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            },
            {
                'name': 'Culinary Certification',
                'category': 'cook',
                'description': 'Professional culinary certification or diploma',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            },
            {
                'name': 'Health Certificate',
                'category': 'cook',
                'description': 'Medical health certificate for food handling',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            },
            {
                'name': 'Portfolio/Work Samples',
                'category': 'cook',
                'description': 'Photos or documents showcasing your cooking skills and experience',
                'is_required': False,
                'allowed_file_types': ['jpg', 'jpeg', 'png', 'pdf'],
                'max_file_size_mb': 15
            }
        ]
        
        # Delivery agent document types
        delivery_documents = [
            {
                'name': 'Driving License',
                'category': 'delivery_agent',
                'description': 'Valid driving license for vehicle operation',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            },
            {
                'name': 'Vehicle Registration',
                'category': 'delivery_agent',
                'description': 'Vehicle registration document for delivery vehicle',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            },
            {
                'name': 'Insurance Certificate',
                'category': 'delivery_agent',
                'description': 'Vehicle insurance certificate',
                'is_required': True,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            },
            {
                'name': 'Background Check',
                'category': 'delivery_agent',
                'description': 'Criminal background check or police clearance',
                'is_required': False,
                'allowed_file_types': ['pdf', 'jpg', 'jpeg', 'png'],
                'max_file_size_mb': 5,
                'is_single_page_only': False,
                'max_pages': 5
            }
        ]
        
        # Create document types
        all_documents = cook_documents + delivery_documents
        
        for doc_data in all_documents:
            doc_type, created = DocumentType.objects.get_or_create(
                name=doc_data['name'],
                category=doc_data['category'],
                defaults=doc_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created document type: {doc_type.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Document type already exists: {doc_type.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Document types setup completed!')
        )
