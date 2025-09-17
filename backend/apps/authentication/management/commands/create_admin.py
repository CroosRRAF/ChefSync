from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.admin_management.models import AdminActivityLog

User = get_user_model()

class Command(BaseCommand):
    help = 'Create an admin user or promote existing user to admin'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address for the admin user',
        )
        parser.add_argument(
            '--name',
            type=str,
            help='Name for the admin user',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the admin user',
        )
        parser.add_argument(
            '--promote',
            type=str,
            help='Email of existing user to promote to admin',
        )
        parser.add_argument(
            '--create-sample-data',
            action='store_true',
            help='Create sample admin activity logs',
        )

    def handle(self, *args, **options):
        if options['create_sample_data']:
            self.create_sample_data()
            return
            
        if options['promote']:
            # Promote existing user to admin
            try:
                user = User.objects.get(email=options['promote'])
                user.role = 'admin'
                user.is_staff = True
                user.is_superuser = True
                user.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully promoted {user.email} to admin role'
                    )
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with email {options["promote"]} not found')
                )
        else:
            # Create new admin user
            email = options['email']
            name = options['name']
            password = options['password']

            if not all([email, name, password]):
                self.stdout.write(
                    self.style.ERROR(
                        'Email, name, and password are required to create a new admin user'
                    )
                )
                return

            try:
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    name=name,
                    role='admin',
                    is_staff=True,
                    is_superuser=True,
                    email_verified=True
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created admin user: {user.email}'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to create admin user: {str(e)}')
                )
    
    def create_sample_data(self):
        """Create sample admin activity logs for testing"""
        try:
            # Get first admin user
            admin_user = User.objects.filter(role='admin').first()
            if not admin_user:
                self.stdout.write(
                    self.style.ERROR('No admin user found. Create an admin user first.')
                )
                return
            
            # Create sample activities
            activities = [
                {'action': 'login', 'resource_type': 'system', 'description': 'Admin logged into dashboard'},
                {'action': 'view', 'resource_type': 'dashboard', 'description': 'Viewed admin dashboard'},
                {'action': 'create', 'resource_type': 'user', 'description': 'Created new user account'},
                {'action': 'update', 'resource_type': 'order', 'description': 'Updated order status'},
                {'action': 'view', 'resource_type': 'report', 'description': 'Generated sales report'},
                {'action': 'export', 'resource_type': 'data', 'description': 'Exported user data'},
                {'action': 'delete', 'resource_type': 'notification', 'description': 'Cleared old notifications'},
            ]
            
            created_count = 0
            for activity_data in activities:
                AdminActivityLog.objects.create(
                    admin=admin_user,
                    action=activity_data['action'],
                    resource_type=activity_data['resource_type'],
                    description=activity_data['description'],
                    ip_address='127.0.0.1'
                )
                created_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_count} sample admin activities')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create sample data: {str(e)}')
            )