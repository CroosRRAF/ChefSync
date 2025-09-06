"""
Management command to clean up expired JWT tokens
"""
from django.core.management.base import BaseCommand
from apps.authentication.services.jwt_service import JWTTokenService


class Command(BaseCommand):
    help = 'Clean up expired JWT tokens from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No tokens will be deleted')
            )
        
        # Clean up expired tokens
        count = JWTTokenService.cleanup_expired_tokens()
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'Would delete {count} expired tokens')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} expired tokens')
            )
