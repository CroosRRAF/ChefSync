from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

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

    def handle(self, *args, **options):
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