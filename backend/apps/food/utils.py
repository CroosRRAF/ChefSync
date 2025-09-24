"""
Utility functions for the food app
"""
import base64
from .cloudinary_utils import get_optimized_url


def convert_image_to_data_url(image_data):
    """
    Helper function to convert base64 blob data to proper data URL format
    
    Args:
        image_data: Can be a string (base64), bytes, or file object
        
    Returns:
        str: Data URL format string or None if conversion fails
    """
    if not image_data:
        return None
    
    try:
        # If it's already a Cloudinary URL, return optimized version
        if isinstance(image_data, str) and 'cloudinary.com' in image_data:
            return get_optimized_url(image_data, width=800, height=600, quality='auto')
        
        # If it's already a base64 string, convert to data URL
        if isinstance(image_data, str):
            # Check if it's already a data URL
            if image_data.startswith('data:'):
                return image_data
            # Check if it's already a regular URL
            if image_data.startswith('http'):
                return image_data
            # Assume it's base64 and convert to data URL
            return f"data:image/jpeg;base64,{image_data}"
        
        # If it's bytes, encode to base64 then create data URL
        if isinstance(image_data, bytes):
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return f"data:image/jpeg;base64,{base64_string}"
        
        # If it has a url attribute (file field), return the URL
        if hasattr(image_data, 'url'):
            return image_data.url
        
        return None
    except Exception as e:
        print(f"Error converting image to data URL: {e}")
        return None


def get_image_mime_type(image_data):
    """
    Determine the MIME type of an image based on its content
    
    Args:
        image_data: Image data as bytes or base64 string
        
    Returns:
        str: MIME type (e.g., 'image/jpeg', 'image/png')
    """
    if not image_data:
        return 'image/jpeg'  # Default
    
    try:
        if isinstance(image_data, str):
            # Decode base64 to bytes for analysis
            image_bytes = base64.b64decode(image_data)
        elif isinstance(image_data, bytes):
            image_bytes = image_data
        else:
            return 'image/jpeg'  # Default
        
        # Check magic numbers for common image formats
        if image_bytes.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        elif image_bytes.startswith(b'\x89PNG'):
            return 'image/png'
        elif image_bytes.startswith(b'GIF8'):
            return 'image/gif'
        elif image_bytes.startswith(b'RIFF') and b'WEBP' in image_bytes[:20]:
            return 'image/webp'
        else:
            return 'image/jpeg'  # Default fallback
            
    except Exception as e:
        print(f"Error determining image MIME type: {e}")
        return 'image/jpeg'  # Default fallback


def convert_image_with_proper_mime_type(image_data):
    """
    Convert image to data URL with proper MIME type detection
    Priority: Cloudinary URLs > Regular URLs > Data URLs > Base64/Blob data
    
    Args:
        image_data: Image data as string, bytes, or file object
        
    Returns:
        str: Optimized URL or data URL with proper MIME type
    """
    if not image_data:
        return None
    
    try:
        # If it's a Cloudinary URL, return optimized version
        if isinstance(image_data, str) and 'cloudinary.com' in image_data:
            return get_optimized_url(
                image_data, 
                width=800, 
                height=600, 
                quality='auto',
                format='auto'
            )
        
        # Get the proper MIME type for non-URL data
        mime_type = get_image_mime_type(image_data)
        
        # If it's already a base64 string, convert to data URL with proper MIME type
        if isinstance(image_data, str):
            # Check if it's already a data URL
            if image_data.startswith('data:'):
                return image_data
            # Check if it's already a regular URL
            if image_data.startswith('http'):
                return image_data
            # Convert base64 to data URL with proper MIME type
            return f"data:{mime_type};base64,{image_data}"
        
        # If it's bytes, encode to base64 then create data URL with proper MIME type
        if isinstance(image_data, bytes):
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return f"data:{mime_type};base64,{base64_string}"
        
        # If it has a url attribute (file field), return the URL
        if hasattr(image_data, 'url'):
            return image_data.url
        
        return None
    except Exception as e:
        print(f"Error converting image with proper MIME type: {e}")
        return None


def get_thumbnail_url(image_url, width=150, height=150):
    """
    Get thumbnail version of an image URL
    
    Args:
        image_url: Original image URL (Cloudinary or other)
        width: Thumbnail width
        height: Thumbnail height
        
    Returns:
        str: Thumbnail URL
    """
    if not image_url:
        return None
    
    try:
        # If it's a Cloudinary URL, return optimized thumbnail
        if 'cloudinary.com' in image_url:
            return get_optimized_url(
                image_url, 
                width=width, 
                height=height, 
                quality='auto',
                format='auto'
            )
        
        # For other URLs, return as-is (could be enhanced with other services)
        return image_url
        
    except Exception as e:
        print(f"Error getting thumbnail URL: {e}")
        return image_url