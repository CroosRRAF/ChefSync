"""
Management command to clean up expired JWT tokens
"""
from django.core.management.base import BaseCommand
from apps.authentication.services.jwt_service import JWTTokenService


class Command(BaseCommand):
    help = 'Clean up expired JWT tokens from database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            from apps.authentication.models import JWTToken
            from django.utils import timezone
            
            expired_count = JWTToken.objects.filter(expires_at__lt=timezone.now()).count()
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {expired_count} expired tokens')
            )
        else:
            deleted_count = JWTTokenService.cleanup_expired_tokens()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} expired tokens')
            )
