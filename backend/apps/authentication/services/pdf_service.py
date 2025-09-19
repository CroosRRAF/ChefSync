"""
PDF processing service for document validation and conversion
"""
import os
import tempfile
import logging
from typing import Dict, List, Tuple, Optional
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
import PyPDF2
from pdf2image import convert_from_path, convert_from_bytes
from PIL import Image
import cloudinary
import cloudinary.uploader
from io import BytesIO

logger = logging.getLogger(__name__)


class PDFValidationError(Exception):
    """Custom exception for PDF validation errors"""
    pass


class PDFConversionError(Exception):
    """Custom exception for PDF conversion errors"""
    pass


class PDFService:
    """
    Service for PDF validation and conversion to images
    """
    
    MAX_PAGES = 3
    SUPPORTED_FORMATS = ['pdf']
    IMAGE_QUALITY = 85
    IMAGE_FORMAT = 'JPEG'
    
    def __init__(self):
        """Initialize the PDF service"""
        self.temp_dir = None
        self.poppler_path = self._find_poppler_path()
    
    def _find_poppler_path(self):
        """Try to find Poppler installation path automatically."""
        import platform
        
        # Check if poppler path is set in settings
        poppler_path = getattr(settings, 'POPPLER_PATH', None)
        if poppler_path and os.path.exists(poppler_path):
            return poppler_path
        
        # Common Windows paths for Poppler
        if platform.system() == "Windows":
            possible_paths = [
                r"C:\poppler\bin",
                r"C:\Program Files\poppler\bin",
                r"C:\Program Files (x86)\poppler\bin",
                r"C:\tools\poppler\bin",
                os.path.join(os.path.expanduser("~"), "poppler", "bin"),
                os.path.join(os.path.expanduser("~"), "AppData", "Local", "poppler", "bin"),
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    logger.info(f"Found Poppler at: {path}")
                    return path
        
        # For Linux/Mac, try common locations
        else:
            possible_paths = [
                "/usr/bin",
                "/usr/local/bin",
                "/opt/poppler/bin",
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    logger.info(f"Found Poppler at: {path}")
                    return path
        
        # If no path found, return None and let pdf2image handle it
        logger.warning("Poppler not found in common locations. pdf2image will try to find it automatically.")
        return None
        
    def validate_pdf(self, file: UploadedFile) -> Dict[str, any]:
        """
        Validate PDF file for page count and other requirements
        
        Args:
            file: UploadedFile object containing the PDF
            
        Returns:
            Dict containing validation results
            
        Raises:
            PDFValidationError: If validation fails
        """
        try:
            # Reset file pointer
            file.seek(0)
            
            # Read PDF content
            pdf_content = file.read()
            file.seek(0)  # Reset again for potential future use
            
            # Validate file size
            if len(pdf_content) == 0:
                raise PDFValidationError("PDF file is empty")
            
            # Check if it's a valid PDF
            if not pdf_content.startswith(b'%PDF'):
                raise PDFValidationError("File is not a valid PDF")
            
            # Count pages using PyPDF2
            try:
                pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
                page_count = len(pdf_reader.pages)
            except Exception as e:
                logger.error(f"Error reading PDF with PyPDF2: {str(e)}")
                # Fallback: try with pdf2image
                try:
                    images = convert_from_bytes(
                        pdf_content, 
                        first_page=1, 
                        last_page=1,
                        poppler_path=self.poppler_path
                    )
                    if images:
                        # If we can convert at least one page, it's likely valid
                        # We'll do a more thorough check during conversion
                        page_count = None  # Will be determined during conversion
                    else:
                        raise PDFValidationError("Unable to read PDF file")
                except Exception as e2:
                    logger.error(f"Error with pdf2image fallback: {str(e2)}")
                    if "poppler" in str(e2).lower() or "path" in str(e2).lower():
                        error_msg = (
                            "PDF validation failed: Poppler is not installed or not in PATH.\n\n"
                            "To fix this on Windows:\n"
                            "1. Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases/\n"
                            "2. Extract to C:\\poppler\\\n"
                            "3. Add C:\\poppler\\bin to your system PATH\n"
                            "4. Restart your terminal/IDE\n\n"
                            "Alternatively, you can install via conda: conda install -c conda-forge poppler"
                        )
                        raise PDFValidationError(error_msg)
                    else:
                        raise PDFValidationError("Invalid PDF file format")
            
            # If we have a page count, validate it
            if page_count is not None and page_count > self.MAX_PAGES:
                raise PDFValidationError(f"PDF has {page_count} pages. Maximum allowed is {self.MAX_PAGES} pages.")
            
            return {
                'is_valid': True,
                'page_count': page_count,
                'file_size': len(pdf_content),
                'message': 'PDF validation successful'
            }
            
        except PDFValidationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during PDF validation: {str(e)}")
            raise PDFValidationError(f"PDF validation failed: {str(e)}")
    
    def convert_pdf_to_images(self, file: UploadedFile, user_email: str, document_type_name: str) -> List[Dict[str, str]]:
        """
        Convert PDF to images and upload to Cloudinary
        
        Args:
            file: UploadedFile object containing the PDF
            user_email: User's email for organizing files
            document_type_name: Type of document for organizing files
            
        Returns:
            List of dictionaries containing image URLs and metadata
            
        Raises:
            PDFConversionError: If conversion fails
        """
        try:
            # Reset file pointer
            file.seek(0)
            pdf_content = file.read()
            file.seek(0)
            
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
                secure=True
            )
            
            # Convert PDF to images
            logger.info(f"Converting PDF to images for user: {user_email}")
            
            # Use pdf2image to convert PDF to images
            try:
                images = convert_from_bytes(
                    pdf_content,
                    dpi=200,  # Good quality for document viewing
                    fmt='jpeg',
                    jpegopt={'quality': self.IMAGE_QUALITY},
                    poppler_path=self.poppler_path
                )
            except Exception as e:
                if "poppler" in str(e).lower() or "path" in str(e).lower():
                    # Provide helpful error message with installation instructions
                    error_msg = (
                        "PDF conversion failed: Poppler is not installed or not in PATH.\n\n"
                        "To fix this on Windows:\n"
                        "1. Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases/\n"
                        "2. Extract to C:\\poppler\\\n"
                        "3. Add C:\\poppler\\bin to your system PATH\n"
                        "4. Restart your terminal/IDE\n\n"
                        "Alternatively, you can install via conda: conda install -c conda-forge poppler"
                    )
                    raise PDFConversionError(error_msg)
                else:
                    raise PDFConversionError(f"PDF conversion failed: {str(e)}")
            
            # Validate page count after conversion
            if len(images) > self.MAX_PAGES:
                raise PDFConversionError(f"PDF has {len(images)} pages. Maximum allowed is {self.MAX_PAGES} pages.")
            
            if len(images) == 0:
                raise PDFConversionError("No pages found in PDF")
            
            # Upload images to Cloudinary
            uploaded_images = []
            
            for i, image in enumerate(images):
                try:
                    # Prepare image data
                    img_buffer = BytesIO()
                    image.save(img_buffer, format=self.IMAGE_FORMAT, quality=self.IMAGE_QUALITY, optimize=True)
                    img_buffer.seek(0)
                    
                    # Generate unique filename
                    safe_email = user_email.replace('@', '_at_').replace('.', '_')
                    safe_doc_type = document_type_name.replace(' ', '_').lower()
                    filename = f"{safe_email}_{safe_doc_type}_page_{i+1}"
                    
                    # Upload to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        img_buffer,
                        folder=f"chefsync/documents/{safe_email}",
                        public_id=filename,
                        resource_type="image",
                        format="jpg",
                        quality="auto",
                        fetch_format="auto"
                    )
                    
                    uploaded_images.append({
                        'page_number': i + 1,
                        'image_url': upload_result['secure_url'],
                        'public_id': upload_result['public_id'],
                        'width': upload_result['width'],
                        'height': upload_result['height'],
                        'file_size': upload_result['bytes']
                    })
                    
                    logger.info(f"Successfully uploaded page {i+1} to Cloudinary: {upload_result['public_id']}")
                    
                except Exception as e:
                    logger.error(f"Error uploading page {i+1}: {str(e)}")
                    raise PDFConversionError(f"Failed to upload page {i+1}: {str(e)}")
            
            logger.info(f"Successfully converted and uploaded {len(uploaded_images)} pages for user: {user_email}")
            
            return uploaded_images
            
        except PDFConversionError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during PDF conversion: {str(e)}")
            raise PDFConversionError(f"PDF conversion failed: {str(e)}")
    
    def validate_and_convert_pdf(self, file: UploadedFile, user_email: str, document_type_name: str) -> Dict[str, any]:
        """
        Validate PDF and convert to images in one operation
        
        Args:
            file: UploadedFile object containing the PDF
            user_email: User's email for organizing files
            document_type_name: Type of document for organizing files
            
        Returns:
            Dict containing validation results and converted images
        """
        try:
            # First validate the PDF
            validation_result = self.validate_pdf(file)
            
            # If validation passes, convert to images
            converted_images = self.convert_pdf_to_images(file, user_email, document_type_name)
            
            return {
                'validation': validation_result,
                'converted_images': converted_images,
                'success': True,
                'message': f'PDF successfully validated and converted to {len(converted_images)} images'
            }
            
        except (PDFValidationError, PDFConversionError) as e:
            return {
                'validation': {'is_valid': False, 'error': str(e)},
                'converted_images': [],
                'success': False,
                'message': str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error in validate_and_convert_pdf: {str(e)}")
            return {
                'validation': {'is_valid': False, 'error': f'Unexpected error: {str(e)}'},
                'converted_images': [],
                'success': False,
                'message': f'PDF processing failed: {str(e)}'
            }
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                import shutil
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temporary directory: {self.temp_dir}")
            except Exception as e:
                logger.error(f"Error cleaning up temp directory: {str(e)}")
    
    def __del__(self):
        """Destructor to clean up temporary files"""
        self.cleanup_temp_files()


# Utility functions for easy access
def validate_pdf_file(file: UploadedFile) -> Dict[str, any]:
    """
    Utility function to validate a PDF file
    
    Args:
        file: UploadedFile object containing the PDF
        
    Returns:
        Dict containing validation results
    """
    service = PDFService()
    try:
        return service.validate_pdf(file)
    finally:
        service.cleanup_temp_files()


def convert_pdf_to_images(file: UploadedFile, user_email: str, document_type_name: str) -> List[Dict[str, str]]:
    """
    Utility function to convert PDF to images
    
    Args:
        file: UploadedFile object containing the PDF
        user_email: User's email for organizing files
        document_type_name: Type of document for organizing files
        
    Returns:
        List of dictionaries containing image URLs and metadata
    """
    service = PDFService()
    try:
        return service.convert_pdf_to_images(file, user_email, document_type_name)
    finally:
        service.cleanup_temp_files()


def validate_and_convert_pdf(file: UploadedFile, user_email: str, document_type_name: str) -> Dict[str, any]:
    """
    Utility function to validate and convert PDF in one operation
    
    Args:
        file: UploadedFile object containing the PDF
        user_email: User's email for organizing files
        document_type_name: Type of document for organizing files
        
    Returns:
        Dict containing validation results and converted images
    """
    service = PDFService()
    try:
        return service.validate_and_convert_pdf(file, user_email, document_type_name)
    finally:
        service.cleanup_temp_files()
