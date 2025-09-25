"""
Management command to migrate existing blob images to Cloudinary
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.food.models import Cuisine, FoodCategory, Food
from apps.users.models import UserProfile
from utils.cloudinary_utils import migrate_blob_to_cloudinary


class Command(BaseCommand):
    help = 'Migrate existing blob images to Cloudinary'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate the migration without making changes',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of records to process at a time',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
        
        # Migrate Cuisine images
        self.stdout.write('Migrating Cuisine images...')
        self.migrate_model_images(
            model_class=Cuisine,
            image_field='image',
            folder='cuisines',
            dry_run=dry_run,
            batch_size=batch_size
        )
        
        # Migrate FoodCategory images
        self.stdout.write('Migrating FoodCategory images...')
        self.migrate_model_images(
            model_class=FoodCategory,
            image_field='image',
            folder='categories',
            dry_run=dry_run,
            batch_size=batch_size
        )
        
        # Migrate Food images
        self.stdout.write('Migrating Food images...')
        self.migrate_model_images(
            model_class=Food,
            image_field='image',
            folder='foods',
            dry_run=dry_run,
            batch_size=batch_size
        )
        
        # Migrate UserProfile images
        self.stdout.write('Migrating UserProfile images...')
        self.migrate_model_images(
            model_class=UserProfile,
            image_field='profile_picture',
            folder='profiles',
            dry_run=dry_run,
            batch_size=batch_size
        )
        
        self.stdout.write(
            self.style.SUCCESS('Migration completed successfully!')
        )

    def migrate_model_images(self, model_class, image_field, folder, dry_run, batch_size):
        """Migrate images for a specific model"""
        model_name = model_class.__name__.lower()
        
        # Get records with blob data that need migration
        queryset = model_class.objects.exclude(**{f'{image_field}__isnull': True}).exclude(**{f'{image_field}__exact': ''})
        
        total_count = queryset.count()
        migrated_count = 0
        skipped_count = 0
        error_count = 0
        
        self.stdout.write(f'Found {total_count} {model_name} records with images')
        
        # Process in batches
        for start in range(0, total_count, batch_size):
            batch = queryset[start:start + batch_size]
            
            with transaction.atomic():
                for obj in batch:
                    image_data = getattr(obj, image_field)
                    
                    if not image_data:
                        skipped_count += 1
                        continue
                    
                    # Check if it's already a Cloudinary URL
                    image_str = str(image_data)
                    if 'cloudinary.com' in image_str or image_str.startswith('http'):
                        skipped_count += 1
                        continue
                    
                    # This looks like blob data, migrate it
                    if not dry_run:
                        try:
                            cloudinary_url = migrate_blob_to_cloudinary(
                                blob_data=image_data,
                                folder=folder,
                                model_name=model_name,
                                field_name=image_field
                            )
                            
                            if cloudinary_url:
                                setattr(obj, image_field, cloudinary_url)
                                obj.save(update_fields=[image_field])
                                migrated_count += 1
                                self.stdout.write(
                                    f'✓ Migrated {model_name} ID {obj.pk} -> {cloudinary_url[:50]}...'
                                )
                            else:
                                error_count += 1
                                self.stdout.write(
                                    self.style.ERROR(f'✗ Failed to migrate {model_name} ID {obj.pk}')
                                )
                        except Exception as e:
                            error_count += 1
                            self.stdout.write(
                                self.style.ERROR(f'✗ Error migrating {model_name} ID {obj.pk}: {e}')
                            )
                    else:
                        # Dry run - just log what would be done
                        self.stdout.write(f'Would migrate {model_name} ID {obj.pk}')
                        migrated_count += 1
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\n{model_class.__name__} Migration Summary:\n'
                f'  Total: {total_count}\n'
                f'  Migrated: {migrated_count}\n'
                f'  Skipped: {skipped_count}\n'
                f'  Errors: {error_count}\n'
            )
        )