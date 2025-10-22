"""
Migration script to transfer address data from UserProfile.address field
to the new Address table structure.

Run this script after creating the new address models and before removing
the old address field from UserProfile.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.users.models import UserProfile, Address


class Command(BaseCommand):
    help = 'Migrate address data from UserProfile to Address table'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without making changes',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write("DRY RUN - No changes will be made")
        
        # Get all user profiles with addresses
        profiles_with_addresses = UserProfile.objects.filter(
            address__isnull=False
        ).exclude(address='').select_related('user')
        
        total_profiles = profiles_with_addresses.count()
        self.stdout.write(f"Found {total_profiles} profiles with addresses to migrate")
        
        migrated_count = 0
        
        with transaction.atomic():
            for profile in profiles_with_addresses:
                if profile.address and profile.address.strip():
                    
                    # Check if user already has a customer address
                    existing_address = Address.objects.filter(
                        user=profile.user,
                        address_type='customer'
                    ).first()
                    
                    if existing_address:
                        self.stdout.write(
                            f"User {profile.user.username} already has a customer address, skipping"
                        )
                        continue
                    
                    # Parse address (basic parsing - you may need to enhance this)
                    address_text = profile.address.strip()
                    
                    # Try to extract city and pincode from address
                    # This is a simple approach - you may need more sophisticated parsing
                    parts = address_text.split(',')
                    
                    address_line1 = parts[0].strip() if parts else address_text
                    city = 'Unknown'
                    pincode = '000000'
                    
                    # Try to extract pincode (6 digits at the end)
                    import re
                    pincode_match = re.search(r'\b\d{6}\b', address_text)
                    if pincode_match:
                        pincode = pincode_match.group()
                        # Remove pincode from address for cleaner parsing
                        address_text = address_text.replace(pincode, '').strip()
                        parts = address_text.split(',')
                        if len(parts) > 1:
                            city = parts[-1].strip()
                            address_line1 = ', '.join(parts[:-1]).strip()
                    
                    if not dry_run:
                        # Create new address
                        Address.objects.create(
                            user=profile.user,
                            address_type='customer',
                            label='Home',  # Default label
                            address_line1=address_line1,
                            city=city,
                            state='Unknown',  # Default state
                            country='India',
                            pincode=pincode,
                            is_default=True,
                            is_active=True
                        )
                    
                    migrated_count += 1
                    
                    if dry_run:
                        self.stdout.write(
                            f"WOULD MIGRATE: {profile.user.username} - {address_line1[:50]}..."
                        )
                    else:
                        self.stdout.write(
                            f"MIGRATED: {profile.user.username} - {address_line1[:50]}..."
                        )
            
            if dry_run:
                # Don't commit in dry run
                transaction.set_rollback(True)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"{'Would migrate' if dry_run else 'Migrated'} {migrated_count} addresses"
            )
        )
        
        if not dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "Migration complete. Please review the migrated addresses and "
                    "then remove the 'address' field from UserProfile model."
                )
            )