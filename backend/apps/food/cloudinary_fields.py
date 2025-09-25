"""
Custom fields for handling both Cloudinary URLs and blob data
"""
from django.db import models
from django.core.files.base import ContentFile
from cloudinary.models import CloudinaryField
from utils.cloudinary_utils import upload_image_to_cloudinary, migrate_blob_to_cloudinary
import base64


class CloudinaryImageField(models.CharField):
    """
    Custom field that stores Cloudinary URLs but can accept blob data for migration
    """
    
    def __init__(self, *args, **kwargs):
        # Set default max_length for URL storage
        kwargs.setdefault('max_length', 500)
        kwargs.setdefault('blank', True)
        kwargs.setdefault('null', True)
        super().__init__(*args, **kwargs)
    
    def pre_save(self, model_instance, add):
        """Process the value before saving to database"""
        value = getattr(model_instance, self.attname)
        
        if value and self._is_blob_data(value):
            # This is blob data, upload to Cloudinary
            model_name = model_instance.__class__.__name__.lower()
            field_name = self.name
            
            cloudinary_url = migrate_blob_to_cloudinary(
                value,
                folder=f'{model_name}s',
                model_name=model_name,
                field_name=field_name
            )
            
            if cloudinary_url:
                setattr(model_instance, self.attname, cloudinary_url)
                return cloudinary_url
        
        return super().pre_save(model_instance, add)
    
    def _is_blob_data(self, value):
        """Check if the value is blob/base64 data"""
        if not value:
            return False
        
        value_str = str(value)
        
        # Skip if it's already a URL
        if value_str.startswith(('http://', 'https://')):
            return False
        
        # Skip if it's a data URL
        if value_str.startswith('data:'):
            return False
        
        # If it's a long string, it's likely base64/blob data
        return len(value_str) > 100


class HybridImageField(models.TextField):
    """
    A field that can store both blob data and URLs
    This field automatically migrates blob data to Cloudinary on save
    """
    
    def __init__(self, folder=None, *args, **kwargs):
        self.cloudinary_folder = folder or 'uploads'
        kwargs.setdefault('blank', True)
        kwargs.setdefault('null', True)
        super().__init__(*args, **kwargs)
    
    def pre_save(self, model_instance, add):
        """Process the value before saving to database"""
        value = getattr(model_instance, self.attname)
        
        if value and self._is_blob_data(value):
            # This is blob data, upload to Cloudinary
            model_name = model_instance.__class__.__name__.lower()
            field_name = self.name
            
            cloudinary_url = upload_image_to_cloudinary(
                image_data=value,
                folder=f'{self.cloudinary_folder}/{model_name}',
                tags=[model_name, field_name, 'auto_upload']
            )
            
            if cloudinary_url and 'secure_url' in cloudinary_url:
                url = cloudinary_url['secure_url']
                setattr(model_instance, self.attname, url)
                return url
        
        return super().pre_save(model_instance, add)
    
    def _is_blob_data(self, value):
        """Check if the value is blob/base64 data"""
        if not value:
            return False
        
        value_str = str(value)
        
        # Skip if it's already a URL
        if value_str.startswith(('http://', 'https://')):
            return False
        
        # Skip if it's a data URL
        if value_str.startswith('data:'):
            return False
        
        # If it's a long string, it's likely base64/blob data
        return len(value_str) > 100
    
    def formfield(self, **kwargs):
        """Return form field for this model field"""
        from django.forms import CharField
        from django.forms.widgets import Textarea
        
        defaults = {
            'form_class': CharField,
            'widget': Textarea(attrs={'rows': 4, 'cols': 40}),
            'help_text': f'Upload image or paste base64 data (will be uploaded to Cloudinary/{self.cloudinary_folder})'
        }
        defaults.update(kwargs)
        return super().formfield(**defaults)