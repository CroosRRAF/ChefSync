"""
Management command to organize existing Cloudinary assets into the new folder structure.
This command helps migrate existing files to the new organized asset structure.
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from apps.authentication.models import UserDocument
import cloudinary
import cloudinary.api
import cloudinary.uploader
from pathlib import Path


class Command(BaseCommand):
    help = 'Organize existing Cloudinary assets into the new folder structure'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually moving files',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='Only organize assets for a specific user ID',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        user_id = options.get('user_id')
        
        # Configure Cloudinary
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
                secure=True
            )
        except Exception as e:
            raise CommandError(f"Failed to configure Cloudinary: {str(e)}")

        # Get documents to organize
        documents_query = UserDocument.objects.filter(
            file__icontains='cloudinary.com'
        )
        
        if user_id:
            documents_query = documents_query.filter(user__user_id=user_id)
        
        documents = documents_query.all()
        
        if not documents:
            self.stdout.write(
                self.style.WARNING('No Cloudinary documents found to organize.')
            )
            return

        self.stdout.write(f"Found {documents.count()} documents to organize...")
        
        moved_count = 0
        error_count = 0
        
        for document in documents:
            try:
                # Extract public_id from the current URL
                file_url = document.file
                if '/image/upload/' in file_url:
                    resource_type = 'image'
                    # Extract public_id from image URL
                    url_parts = file_url.split('/')
                    upload_index = url_parts.index('upload')
                    if upload_index + 2 < len(url_parts):
                        version_and_path = '/'.join(url_parts[upload_index + 2:])
                        path_parts = version_and_path.split('/')
                        if len(path_parts) > 1:
                            public_id = '/'.join(path_parts[1:])
                            if '.' in public_id:
                                public_id = public_id.rsplit('.', 1)[0]
                        else:
                            public_id = version_and_path
                    else:
                        self.stdout.write(
                            self.style.ERROR(f"Invalid URL format for document {document.id}")
                        )
                        error_count += 1
                        continue
                elif '/raw/upload/' in file_url:
                    resource_type = 'raw'
                    # Extract public_id from raw URL
                    url_parts = file_url.split('/')
                    upload_index = url_parts.index('upload')
                    if upload_index + 2 < len(url_parts):
                        version_and_path = '/'.join(url_parts[upload_index + 2:])
                        path_parts = version_and_path.split('/')
                        if len(path_parts) > 1:
                            public_id = '/'.join(path_parts[1:])
                        else:
                            public_id = version_and_path
                    else:
                        self.stdout.write(
                            self.style.ERROR(f"Invalid URL format for document {document.id}")
                        )
                        error_count += 1
                        continue
                else:
                    self.stdout.write(
                        self.style.ERROR(f"Unknown resource type for document {document.id}")
                    )
                    error_count += 1
                    continue

                # Determine new folder based on file type
                file_type = document.file_type
                user_id = document.user.user_id
                
                if file_type and file_type.startswith('image/'):
                    new_folder = f"chefsync/assets/images/{user_id}"
                elif file_type == 'application/pdf':
                    new_folder = f"chefsync/assets/documents/pdfs/{user_id}"
                elif file_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                    new_folder = f"chefsync/assets/documents/word/{user_id}"
                elif file_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
                    new_folder = f"chefsync/assets/documents/excel/{user_id}"
                elif file_type in ['text/plain', 'text/csv']:
                    new_folder = f"chefsync/assets/documents/text/{user_id}"
                else:
                    new_folder = f"chefsync/assets/documents/other/{user_id}"

                # Check if already in correct folder
                if new_folder in public_id:
                    self.stdout.write(
                        self.style.SUCCESS(f"Document {document.id} already in correct folder")
                    )
                    continue

                if dry_run:
                    self.stdout.write(
                        f"Would move: {public_id} -> {new_folder}/"
                    )
                else:
                    # Move the asset in Cloudinary
                    new_public_id = f"{new_folder}/{Path(public_id).name}"
                    
                    try:
                        result = cloudinary.uploader.rename(
                            public_id,
                            new_public_id,
                            resource_type=resource_type
                        )
                        
                        # Update the document with new URL
                        document.file = result['secure_url']
                        document.cloudinary_public_id = new_public_id
                        document.save()
                        
                        self.stdout.write(
                            self.style.SUCCESS(f"Moved document {document.id}: {public_id} -> {new_public_id}")
                        )
                        moved_count += 1
                        
                    except Exception as move_error:
                        self.stdout.write(
                            self.style.ERROR(f"Failed to move document {document.id}: {str(move_error)}")
                        )
                        error_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error processing document {document.id}: {str(e)}")
                )
                error_count += 1

        # Summary
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f"Dry run complete. Would move {moved_count} documents.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Organization complete. Moved {moved_count} documents, {error_count} errors.")
            )
