from django.db import models
from django.core.files.base import ContentFile
import base64
import uuid


class LongBlobImageField(models.ImageField):
    """
    Custom field for storing images as base64 encoded strings in MySQL LONGBLOB columns.
    This is useful for storing images directly in the database without file system dependencies.
    """
    
    def __init__(self, *args, **kwargs):
        # Remove ImageField specific kwargs that don't apply to LONGBLOB
        kwargs.pop('upload_to', None)
        kwargs.pop('storage', None)
        kwargs.pop('width_field', None)
        kwargs.pop('height_field', None)
        
        # Set default max_length for LONGBLOB
        kwargs.setdefault('max_length', None)
        
        super().__init__(*args, **kwargs)
    
    def from_db_value(self, value, expression, connection):
        """Convert database value to Python value"""
        if value is None:
            return value
        
        # If it's already a string (base64), return as is
        if isinstance(value, str):
            return value
        
        # If it's bytes, decode to base64 string
        if isinstance(value, bytes):
            try:
                return base64.b64encode(value).decode('utf-8')
            except Exception:
                return None
        
        return value
    
    def to_python(self, value):
        """Convert input value to Python value"""
        if value is None:
            return value
        
        # If it's already a string (base64), return as is
        if isinstance(value, str):
            return value
        
        # If it's a file-like object, read and encode
        if hasattr(value, 'read'):
            try:
                file_data = value.read()
                return base64.b64encode(file_data).decode('utf-8')
            except Exception:
                return None
        
        return value
    
    def get_prep_value(self, value):
        """Convert Python value to database value"""
        if value is None:
            return value
        
        # If it's a string (base64), decode to bytes
        if isinstance(value, str):
            try:
                return base64.b64decode(value)
            except Exception:
                return None
        
        # If it's already bytes, return as is
        if isinstance(value, bytes):
            return value
        
        return value
    
    def value_to_string(self, obj):
        """Convert field value to string for serialization"""
        value = self.value_from_object(obj)
        return value if value else ''
    
    def formfield(self, **kwargs):
        """Return form field for this model field"""
        from django.forms import CharField
        from django.forms.widgets import Textarea
        
        defaults = {
            'form_class': CharField,
            'widget': Textarea(attrs={'rows': 4, 'cols': 40}),
            'help_text': 'Base64 encoded image data'
        }
        defaults.update(kwargs)
        return super().formfield(**defaults)
    
    def db_type(self, connection):
        """Return database column type"""
        if connection.vendor == 'mysql':
            return 'LONGBLOB'
        elif connection.vendor == 'postgresql':
            return 'BYTEA'
        elif connection.vendor == 'sqlite':
            return 'BLOB'
        else:
            return 'LONGBLOB'  # Default to MySQL LONGBLOB


class Base64ImageField(LongBlobImageField):
    """
    Alias for LongBlobImageField for backward compatibility
    """
    pass
