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
    image_url: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    quality: str = 'auto',
    format: str = 'auto'
) -> str:
    """
    Get optimized version of image URL
    
    Args:
        image_url: Original image URL (Cloudinary or external)
        width: Desired width
        height: Desired height
        quality: Image quality (auto, 100, 80, etc.)
        format: Image format (auto, jpg, png, webp, etc.)
        
    Returns:
        Optimized URL (Cloudinary optimized URL or original external URL)
    """
    try:
        if not image_url:
            return ''
            
        # If it's a Cloudinary URL, optimize it
        if 'cloudinary.com' in image_url:
            public_id = extract_public_id_from_url(image_url)
            if not public_id:
                return image_url
            
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
        else:
            # For external URLs (Unsplash, etc.), return as-is
            # You could potentially add query parameters for optimization if the service supports it
            if 'unsplash.com' in image_url and (width or height):
                # Unsplash supports URL parameters for resizing
                if '?' in image_url:
                    separator = '&'
                else:
                    separator = '?'
                
                params = []
                if width:
                    params.append(f'w={width}')
                if height:
                    params.append(f'h={height}')
                
                return f"{image_url}{separator}{'&'.join(params)}"
            
            return image_url
        
    except Exception as e:
        print(f"Error generating optimized URL: {e}")
        return image_url or ''


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


def get_reliable_image_url(
    image_url: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    fallback_enabled: bool = True
) -> str:
    """
    Get a reliable image URL that handles both Cloudinary and external URLs
    with proper fallback mechanisms for the frontend.
    
    Args:
        image_url: Original image URL (Cloudinary, Unsplash, or other external)
        width: Desired width for optimization
        height: Desired height for optimization
        fallback_enabled: Whether to provide fallback URL if original fails
        
    Returns:
        Optimized URL with fallback logic
    """
    if not image_url:
        if fallback_enabled:
            return f"https://picsum.photos/{width or 400}/{height or 300}?random=food"
        return ''
    
    try:
        # Handle Cloudinary URLs - optimize them
        if 'cloudinary.com' in image_url:
            return get_optimized_url(image_url, width, height)
        
        # Handle Unsplash URLs - add optimization parameters
        elif 'unsplash.com' in image_url:
            return _optimize_unsplash_url(image_url, width, height)
        
        # Handle other external URLs - return as-is but add CORS-friendly parameters where possible
        elif image_url.startswith('http'):
            return image_url
        
        # Handle relative paths - assume they should be Cloudinary URLs
        else:
            return _construct_cloudinary_url(image_url, width, height)
            
    except Exception as e:
        print(f"Error processing image URL {image_url}: {e}")
        if fallback_enabled:
            return f"https://picsum.photos/{width or 400}/{height or 300}?random=food"
        return image_url


def _optimize_unsplash_url(image_url: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
    """Optimize Unsplash URLs with proper parameters"""
    try:
        base_url = image_url.split('?')[0]  # Remove existing parameters
        params = []
        
        # Add optimization parameters
        if width:
            params.append(f'w={width}')
        if height:
            params.append(f'h={height}')
        
        # Add quality and format optimization
        params.extend(['auto=format', 'fit=crop', 'q=80'])
        
        if params:
            return f"{base_url}?{'&'.join(params)}"
        
        return image_url
    except Exception:
        return image_url


def _construct_cloudinary_url(relative_path: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
    """Construct Cloudinary URL from relative path"""
    try:
        configure_cloudinary()
        cloud_name = settings.CLOUDINARY_STORAGE.get('CLOUD_NAME', 'dqbl2r4ct')
        
        # Clean the path
        clean_path = relative_path.lstrip('/')
        
        # Build transformation string
        transformations = ['f_auto', 'q_auto']
        if width:
            transformations.append(f'w_{width}')
        if height:
            transformations.append(f'h_{height}')
        if width and height:
            transformations.append('c_fill')
        
        transformation_str = ','.join(transformations)
        
        return f"https://res.cloudinary.com/{cloud_name}/image/upload/{transformation_str}/{clean_path}"
    except Exception:
        return relative_path