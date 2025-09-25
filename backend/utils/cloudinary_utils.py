"""
Centralized Cloudinary utilities for the entire project
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.conf import settings
import base64
import tempfile
import os
from typing import Optional, Dict, Any
import uuid


def configure_cloudinary():
    """Configure Cloudinary with settings from environment"""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
        api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
        api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
        secure=True
    )


def upload_image_to_cloudinary(
    image_data: Any,
    folder: str = 'chefsync',
    public_id: Optional[str] = None,
    tags: Optional[list] = None,
    transformation: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Upload image to Cloudinary
    
    Args:
        image_data: Can be file path, base64 string, bytes, or file object
        folder: Cloudinary folder to store the image
        public_id: Custom public ID for the image
        tags: List of tags for the image
        transformation: Image transformation parameters
        
    Returns:
        Dict containing Cloudinary response with url, secure_url, public_id, etc.
    """
    try:
        configure_cloudinary()
        
        # Generate unique public_id if not provided
        if not public_id:
            public_id = f"{folder}_{uuid.uuid4().hex[:12]}"
        
        # Set default tags
        if tags is None:
            tags = ['chefsync', folder]
        
        # Set default transformation
        if transformation is None:
            transformation = {
                'quality': 'auto',
                'fetch_format': 'auto'
            }
        
        upload_params = {
            'folder': folder,
            'public_id': public_id,
            'tags': tags,
            'transformation': transformation,
            'resource_type': 'image'
        }
        
        # Handle different types of image_data
        if isinstance(image_data, str) and image_data.startswith('data:'):
            # Data URL format: data:image/jpeg;base64,/9j/4AAQ...
            result = cloudinary.uploader.upload(image_data, **upload_params)
        elif isinstance(image_data, str) and len(image_data) > 100:
            # Assume it's base64 string
            # Create data URL
            data_url = f"data:image/jpeg;base64,{image_data}"
            result = cloudinary.uploader.upload(data_url, **upload_params)
        elif isinstance(image_data, bytes):
            # Convert bytes to base64 data URL
            base64_string = base64.b64encode(image_data).decode('utf-8')
            data_url = f"data:image/jpeg;base64,{base64_string}"
            result = cloudinary.uploader.upload(data_url, **upload_params)
        else:
            # File path or file object
            result = cloudinary.uploader.upload(image_data, **upload_params)
        
        return result
        
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {e}")
        return None


def get_optimized_url(
    cloudinary_url: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    quality: str = 'auto',
    format: str = 'auto'
) -> str:
    """
    Get optimized version of Cloudinary URL
    
    Args:
        cloudinary_url: Original Cloudinary URL
        width: Desired width
        height: Desired height
        quality: Image quality (auto, 100, 80, etc.)
        format: Image format (auto, jpg, png, webp, etc.)
        
    Returns:
        Optimized Cloudinary URL
    """
    try:
        if not cloudinary_url or 'cloudinary.com' not in cloudinary_url:
            return cloudinary_url or ''
        
        public_id = extract_public_id_from_url(cloudinary_url)
        if not public_id:
            return cloudinary_url
        
        configure_cloudinary()
        
        transformation = {
            'quality': quality,
            'fetch_format': format
        }
        
        if width:
            transformation['width'] = width
        if height:
            transformation['height'] = height
            
        if width or height:
            transformation['crop'] = 'fill'
        
        # Generate optimized URL
        optimized_url = cloudinary.CloudinaryImage(public_id).build_url(**transformation)
        return optimized_url
        
    except Exception as e:
        print(f"Error generating optimized URL: {e}")
        return cloudinary_url or ''


def extract_public_id_from_url(cloudinary_url: str) -> Optional[str]:
    """
    Extract public ID from Cloudinary URL
    
    Args:
        cloudinary_url: Full Cloudinary URL
        
    Returns:
        Public ID or None if extraction fails
    """
    try:
        if not cloudinary_url or 'cloudinary.com' not in cloudinary_url:
            return None
        
        # Extract public ID from URL
        # Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
        parts = cloudinary_url.split('/')
        if len(parts) >= 7:
            # Get the public ID part (without file extension)
            public_id_with_ext = parts[-1]
            public_id = public_id_with_ext.split('.')[0]
            
            # Include folder if present
            if len(parts) >= 8:
                folder_parts = parts[7:-1]  # Everything between upload/ and filename
                if folder_parts:
                    return '/'.join(folder_parts + [public_id])
            
            return public_id
        
        return None
        
    except Exception as e:
        print(f"Error extracting public ID from URL: {e}")
        return None


def delete_cloudinary_image(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    
    Args:
        public_id: The public ID of the image to delete
        
    Returns:
        True if successful, False otherwise
    """
    try:
        configure_cloudinary()
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Error deleting image from Cloudinary: {e}")
        return False


def migrate_blob_to_cloudinary(
    blob_data: Any,
    folder: str = 'migrated',
    model_name: str = 'unknown',
    field_name: str = 'image'
) -> Optional[str]:
    """
    Migrate existing blob/base64 image to Cloudinary
    
    Args:
        blob_data: Blob or base64 image data
        folder: Cloudinary folder for migrated images
        model_name: Model name for better organization
        field_name: Field name for better organization
        
    Returns:
        Cloudinary URL or None if failed
    """
    if not blob_data:
        return None
    
    try:
        public_id = f"{model_name}_{field_name}_{uuid.uuid4().hex[:8]}"
        
        result = upload_image_to_cloudinary(
            image_data=blob_data,
            folder=f"{folder}/{model_name}",
            public_id=public_id,
            tags=['migrated', model_name, field_name],
            transformation={
                'quality': 'auto',
                'fetch_format': 'auto'
            }
        )
        
        if result and 'secure_url' in result:
            return result['secure_url']
        
        return None
        
    except Exception as e:
        print(f"Error migrating blob to Cloudinary: {e}")
        return None