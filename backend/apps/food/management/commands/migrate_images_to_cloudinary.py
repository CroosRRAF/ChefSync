"""
Management command to migrate blob images to Cloudinary
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.food.models import Cuisine, FoodCategory, Food, FoodImage, FoodPrice
from apps.food.cloudinary_utils import migrate_blob_to_cloudinary
import time


class Command(BaseCommand):
    help = 'Migrate existing blob images to Cloudinary'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Number of images to process in each batch (default: 10)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it'
        )
        parser.add_argument(
            '--model',
            type=str,
            choices=['cuisine', 'category', 'food', 'foodimage', 'foodprice', 'all'],
            default='all',
            help='Which model to migrate (default: all)'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        dry_run = options['dry_run']
        model_choice = options['model']

        self.stdout.write(
            self.style.SUCCESS(f'Starting image migration to Cloudinary...')
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )

        total_migrated = 0
        
        if model_choice in ['cuisine', 'all']:
            migrated = self.migrate_cuisine_images(batch_size, dry_run)
            total_migrated += migrated

        if model_choice in ['category', 'all']:
            migrated = self.migrate_category_images(batch_size, dry_run)
            total_migrated += migrated

        if model_choice in ['food', 'all']:
            migrated = self.migrate_food_images(batch_size, dry_run)
            total_migrated += migrated

        if model_choice in ['foodimage', 'all']:
            migrated = self.migrate_food_image_objects(batch_size, dry_run)
            total_migrated += migrated

        if model_choice in ['foodprice', 'all']:
            migrated = self.migrate_food_price_images(batch_size, dry_run)
            total_migrated += migrated

        self.stdout.write(
            self.style.SUCCESS(
                f'Migration completed! Total images migrated: {total_migrated}'
            )
        )

    def migrate_cuisine_images(self, batch_size, dry_run):
        """Migrate Cuisine images"""
        self.stdout.write('Migrating Cuisine images...')
        
        cuisines = Cuisine.objects.filter(image__isnull=False).exclude(image='')
        total = cuisines.count()
        migrated = 0

        for i in range(0, total, batch_size):
            batch = cuisines[i:i + batch_size]
            
            for cuisine in batch:
                if self.has_blob_data(cuisine.image):
                    if dry_run:
                        self.stdout.write(f'Would migrate: Cuisine "{cuisine.name}" image')
                    else:
                        cloudinary_url = migrate_blob_to_cloudinary(
                            cuisine.image,
                            folder='cuisine',
                            model_name='cuisine',
                            field_name='image'
                        )
                        
                        if cloudinary_url:
                            with transaction.atomic():
                                cuisine.image = cloudinary_url
                                cuisine.save(update_fields=['image'])
                            migrated += 1
                            self.stdout.write(f'Migrated: Cuisine "{cuisine.name}" image')
                        else:
                            self.stdout.write(
                                self.style.ERROR(f'Failed to migrate: Cuisine "{cuisine.name}" image')
                            )
            
            if not dry_run:
                time.sleep(0.5)  # Rate limiting

        return migrated

    def migrate_category_images(self, batch_size, dry_run):
        """Migrate FoodCategory images"""
        self.stdout.write('Migrating FoodCategory images...')
        
        categories = FoodCategory.objects.filter(image__isnull=False).exclude(image='')
        total = categories.count()
        migrated = 0

        for i in range(0, total, batch_size):
            batch = categories[i:i + batch_size]
            
            for category in batch:
                if self.has_blob_data(category.image):
                    if dry_run:
                        self.stdout.write(f'Would migrate: Category "{category.name}" image')
                    else:
                        cloudinary_url = migrate_blob_to_cloudinary(
                            category.image,
                            folder='category',
                            model_name='category',
                            field_name='image'
                        )
                        
                        if cloudinary_url:
                            with transaction.atomic():
                                category.image = cloudinary_url
                                category.save(update_fields=['image'])
                            migrated += 1
                            self.stdout.write(f'Migrated: Category "{category.name}" image')
                        else:
                            self.stdout.write(
                                self.style.ERROR(f'Failed to migrate: Category "{category.name}" image')
                            )
            
            if not dry_run:
                time.sleep(0.5)  # Rate limiting

        return migrated

    def migrate_food_images(self, batch_size, dry_run):
        """Migrate Food images"""
        self.stdout.write('Migrating Food images...')
        
        foods = Food.objects.filter(image__isnull=False).exclude(image='')
        total = foods.count()
        migrated = 0

        for i in range(0, total, batch_size):
            batch = foods[i:i + batch_size]
            
            for food in batch:
                if hasattr(food, 'image') and self.has_blob_data(food.image):
                    if dry_run:
                        self.stdout.write(f'Would migrate: Food "{food.name}" image')
                    else:
                        cloudinary_url = migrate_blob_to_cloudinary(
                            food.image,
                            folder='food',
                            model_name='food',
                            field_name='image'
                        )
                        
                        if cloudinary_url:
                            with transaction.atomic():
                                food.image = cloudinary_url
                                food.save(update_fields=['image'])
                            migrated += 1
                            self.stdout.write(f'Migrated: Food "{food.name}" image')
                        else:
                            self.stdout.write(
                                self.style.ERROR(f'Failed to migrate: Food "{food.name}" image')
                            )
            
            if not dry_run:
                time.sleep(0.5)  # Rate limiting

        return migrated

    def migrate_food_image_objects(self, batch_size, dry_run):
        """Migrate FoodImage objects"""
        self.stdout.write('Migrating FoodImage objects...')
        
        food_images = FoodImage.objects.filter(image__isnull=False).exclude(image='')
        total = food_images.count()
        migrated = 0

        for i in range(0, total, batch_size):
            batch = food_images[i:i + batch_size]
            
            for food_image in batch:
                # Migrate main image
                if self.has_blob_data(food_image.image):
                    if dry_run:
                        self.stdout.write(f'Would migrate: FoodImage {food_image.id} main image')
                    else:
                        cloudinary_url = migrate_blob_to_cloudinary(
                            food_image.image,
                            folder='food_images',
                            model_name='foodimage',
                            field_name='image'
                        )
                        
                        if cloudinary_url:
                            food_image.image = cloudinary_url
                            migrated += 1
                            self.stdout.write(f'Migrated: FoodImage {food_image.id} main image')

                # Migrate thumbnail
                if food_image.thumbnail and self.has_blob_data(food_image.thumbnail):
                    if dry_run:
                        self.stdout.write(f'Would migrate: FoodImage {food_image.id} thumbnail')
                    else:
                        thumbnail_url = migrate_blob_to_cloudinary(
                            food_image.thumbnail,
                            folder='food_images/thumbnails',
                            model_name='foodimage',
                            field_name='thumbnail'
                        )
                        
                        if thumbnail_url:
                            food_image.thumbnail = thumbnail_url
                            migrated += 1
                            self.stdout.write(f'Migrated: FoodImage {food_image.id} thumbnail')

                if not dry_run:
                    food_image.save()
            
            if not dry_run:
                time.sleep(0.5)  # Rate limiting

        return migrated

    def migrate_food_price_images(self, batch_size, dry_run):
        """Migrate FoodPrice image_url fields"""
        self.stdout.write('Migrating FoodPrice images...')
        
        prices = FoodPrice.objects.filter(image_url__isnull=False).exclude(image_url='')
        total = prices.count()
        migrated = 0

        for i in range(0, total, batch_size):
            batch = prices[i:i + batch_size]
            
            for price in batch:
                if self.has_blob_data(price.image_url):
                    if dry_run:
                        self.stdout.write(f'Would migrate: FoodPrice {price.price_id} image')
                    else:
                        cloudinary_url = migrate_blob_to_cloudinary(
                            price.image_url,
                            folder='food_prices',
                            model_name='foodprice',
                            field_name='image_url'
                        )
                        
                        if cloudinary_url:
                            with transaction.atomic():
                                price.image_url = cloudinary_url
                                price.save(update_fields=['image_url'])
                            migrated += 1
                            self.stdout.write(f'Migrated: FoodPrice {price.price_id} image')
                        else:
                            self.stdout.write(
                                self.style.ERROR(f'Failed to migrate: FoodPrice {price.price_id} image')
                            )
            
            if not dry_run:
                time.sleep(0.5)  # Rate limiting

        return migrated

    def has_blob_data(self, image_field):
        """Check if image field contains blob data (not a URL)"""
        if not image_field:
            return False
        
        image_str = str(image_field)
        
        # Skip if it's already a URL
        if image_str.startswith('http') or image_str.startswith('https'):
            return False
        
        # Skip if it's already a Cloudinary URL
        if 'cloudinary.com' in image_str:
            return False
        
        # Skip if it's a data URL
        if image_str.startswith('data:'):
            return False
        
        # If it's a long string, it's likely base64/blob data
        return len(image_str) > 100