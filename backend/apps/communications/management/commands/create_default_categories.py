from django.core.management.base import BaseCommand
from apps.communications.models import CommunicationCategory

class Command(BaseCommand):
    help = 'Creates default communication categories'

    def handle(self, *args, **options):
        categories = [
            {
                'name': 'General',
                'description': 'General inquiries and communications',
                'subcategories': [
                    {
                        'name': 'Information Request',
                        'description': 'General information requests about services'
                    },
                    {
                        'name': 'Suggestions',
                        'description': 'Suggestions for improvement'
                    },
                ]
            },
            {
                'name': 'Technical Issues',
                'description': 'Issues related to system functionality',
                'subcategories': [
                    {
                        'name': 'App Issues',
                        'description': 'Problems with mobile or web application'
                    },
                    {
                        'name': 'Payment Issues',
                        'description': 'Problems with payments or transactions'
                    },
                    {
                        'name': 'Account Issues',
                        'description': 'Problems with user accounts'
                    },
                ]
            },
            {
                'name': 'Order Related',
                'description': 'Issues and inquiries about orders',
                'subcategories': [
                    {
                        'name': 'Order Delays',
                        'description': 'Issues with delayed orders'
                    },
                    {
                        'name': 'Order Quality',
                        'description': 'Issues with food quality'
                    },
                    {
                        'name': 'Order Cancellation',
                        'description': 'Issues with order cancellations'
                    },
                ]
            },
            {
                'name': 'Chef Related',
                'description': 'Issues and inquiries about chefs',
                'subcategories': [
                    {
                        'name': 'Chef Performance',
                        'description': 'Feedback about chef performance'
                    },
                    {
                        'name': 'Chef Availability',
                        'description': 'Issues with chef availability'
                    },
                ]
            },
            {
                'name': 'Delivery Related',
                'description': 'Issues and inquiries about delivery',
                'subcategories': [
                    {
                        'name': 'Delivery Delays',
                        'description': 'Issues with delayed deliveries'
                    },
                    {
                        'name': 'Delivery Partner',
                        'description': 'Issues with delivery partners'
                    },
                ]
            },
            {
                'name': 'Billing & Payments',
                'description': 'Issues and inquiries about billing and payments',
                'subcategories': [
                    {
                        'name': 'Refunds',
                        'description': 'Refund requests and issues'
                    },
                    {
                        'name': 'Payment Methods',
                        'description': 'Issues with payment methods'
                    },
                    {
                        'name': 'Billing Questions',
                        'description': 'Questions about charges and billing'
                    },
                ]
            },
        ]

        created_count = 0
        for category_data in categories:
            subcategories = category_data.pop('subcategories', [])
            category, created = CommunicationCategory.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            
            # Create subcategories
            for subcategory_data in subcategories:
                subcategory, sub_created = CommunicationCategory.objects.get_or_create(
                    name=subcategory_data['name'],
                    defaults={
                        **subcategory_data,
                        'parent': category
                    }
                )
                if sub_created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created subcategory: {subcategory.name}')
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} communication categories'
            )
        )