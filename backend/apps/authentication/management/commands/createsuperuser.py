from django.core.management.base import BaseCommand
from django.core.management import CommandError
from apps.authentication.models import User
from django.db import IntegrityError
import getpass


class Command(BaseCommand):
    help = 'Create a superuser with proper role validation'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the superuser',
        )
        parser.add_argument(
            '--name',
            type=str,
            help='Name for the superuser',
        )
        parser.add_argument(
            '--noinput',
            action='store_true',
            help='Create superuser without prompting for input',
        )

    def handle(self, *args, **options):
        email = options.get('email')
        name = options.get('name')
        noinput = options.get('noinput')
        
        if not noinput:
            # Interactive mode
            if not email:
                email = input('Email: ')
            if not name:
                name = input('Name: ')
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Password (again): ')
            
            if password != password_confirm:
                raise CommandError("Passwords don't match")
        else:
            # Non-interactive mode - use defaults
            email = email or 'admin@chefsync.com'
            name = name or 'Admin User'
            password = 'admin123'
        
        if not email:
            raise CommandError('Email is required')
        
        try:
            user = User.objects.create_superuser(
                email=email,
                password=password,
                name=name,
                role='Admin'  # Always set role to 'Admin' for superuser
            )
            
            # Set additional fields
            user.first_name = name.split()[0] if ' ' in name else name
            user.last_name = name.split()[-1] if ' ' in name and len(name.split()) > 1 else ''
            user.username = email
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser created successfully!\n'
                    f'Email: {user.email}\n'
                    f'Name: {user.name}\n'
                    f'Role: {user.role}'
                )
            )
            
        except IntegrityError as e:
            if 'email' in str(e).lower():
                raise CommandError(f'User with email "{email}" already exists')
            else:
                raise CommandError(f'Error creating superuser: {e}')
        except Exception as e:
            raise CommandError(f'Error creating superuser: {e}')