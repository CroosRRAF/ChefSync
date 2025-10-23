"""
Simplified PDF processing service that works without external dependencies
"""
import os
import logging
from typing import Dict, List, Optional
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from utils.cloudinary_utils import upload_image_to_cloudinary, configure_cloudinary
import cloudinary.uploader

logger = logging.getLogger(__name__)


class PDFValidationError(Exception):
    """Custom exception for PDF validation errors"""
    pass


class PDFConversionError(Exception):
    """Custom exception for PDF conversion errors"""
    pass


class SimplePDFService:
    """
    Simplified PDF service that uploads PDFs directly to Cloudinary
    without local conversion dependencies
    """
    
    MAX_PAGES = 3  # We'll rely on client-side validation for now
    MAX_FILE_SIZE_MB = 15
    
    def __init__(self):
        """Initialize the simplified PDF service"""
        configure_cloudinary()
    
    def validate_pdf(self, file: UploadedFile) -> Dict[str, any]:
        """
        Basic PDF validation without heavy dependencies
        
        Args:
            file: UploadedFile object containing the PDF
            
        Returns:
            Dict containing validation results
        """
        try:
            # Basic file validation
            if not file or file.size == 0:
                raise PDFValidationError("PDF file is empty")
            
            # Check file size
            max_size_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
            if file.size > max_size_bytes:
                file_size_mb = round(file.size / (1024 * 1024), 2)
                raise PDFValidationError(
                    f"PDF file size ({file_size_mb}MB) exceeds maximum allowed size ({self.MAX_FILE_SIZE_MB}MB)"
                )
            
            # Basic PDF header check
            file.seek(0)
            header = file.read(4)
            file.seek(0)  # Reset file pointer
            
            if not header.startswith(b'%PDF'):
                raise PDFValidationError("File is not a valid PDF document")
            
            # For now, we'll trust client-side page validation
            # In the future, you could add server-side page counting if needed
            
            return {
                'success': True,
                'message': 'PDF validation successful',
                'file_size': file.size,
                'file_name': file.name,
                'estimated_pages': 'Unknown (client-side validated)'
            }
            
        except PDFValidationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during PDF validation: {str(e)}")
            raise PDFValidationError(f"PDF validation failed: {str(e)}")
    
    def upload_pdf_to_cloudinary(self, file: UploadedFile, user_email: str, document_type: str) -> Dict[str, any]:
        """
        Upload PDF directly to Cloudinary
        
        Args:
            file: UploadedFile object containing the PDF
            user_email: User's email for organizing uploads
            document_type: Type of document for tagging
            
        Returns:
            Dict containing upload results
        """
        try:
            # Validate PDF first
            validation_result = self.validate_pdf(file)
            if not validation_result['success']:
                raise PDFConversionError(validation_result['message'])
            
            # Prepare upload parameters
            folder = f"chefsync/documents/{user_email.replace('@', '_at_').replace('.', '_')}"
            public_id = f"{document_type}_{file.name.split('.')[0]}"
            
            # Upload PDF to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file,
                folder=folder,
                public_id=public_id,
                resource_type="raw",  # Use "raw" for non-image files like PDFs
                tags=[
                    'chefsync', 
                    'document', 
                    'pdf', 
                    document_type.lower().replace(' ', '_'),
                    user_email
                ],
                # Enable PDF preview in Cloudinary
                pages=True,
                # Generate a preview image of the first page
                eager=[
                    {"format": "jpg", "page": 1, "quality": "auto"}
                ]
            )
            
            # Extract important information from upload result
            result = {
                'success': True,
                'message': 'PDF uploaded successfully',
                'file_url': upload_result.get('secure_url', upload_result.get('url')),
                'public_id': upload_result.get('public_id'),
                'file_size': upload_result.get('bytes', file.size),
                'format': upload_result.get('format', 'pdf'),
                'resource_type': upload_result.get('resource_type', 'raw'),
                'cloudinary_data': upload_result,
                'preview_available': True,
                # For compatibility with existing code
                'converted_images': [],
                'is_pdf_converted': False  # We're keeping it as PDF
            }
            
            # If Cloudinary generated a preview image, include it
            if 'eager' in upload_result and upload_result['eager']:
                preview_url = upload_result['eager'][0].get('secure_url', upload_result['eager'][0].get('url'))
                if preview_url:
                    result['preview_image_url'] = preview_url
            
            logger.info(f"Successfully uploaded PDF to Cloudinary: {upload_result.get('public_id')}")
            return result
            
        except PDFValidationError as e:
            raise PDFConversionError(str(e))
        except Exception as e:
            logger.error(f"Failed to upload PDF to Cloudinary: {str(e)}")
            raise PDFConversionError(f"PDF upload failed: {str(e)}")
    
    def process_pdf_document(self, file: UploadedFile, user_email: str, document_type: str) -> Dict[str, any]:
        """
        Main method to process PDF documents
        
        Args:
            file: UploadedFile object containing the PDF
            user_email: User's email for organizing uploads  
            document_type: Type of document for tagging
            
        Returns:
            Dict containing processing results
        """
        try:
            # Upload PDF directly to Cloudinary
            upload_result = self.upload_pdf_to_cloudinary(file, user_email, document_type)
            
            if not upload_result['success']:
                raise PDFConversionError(upload_result['message'])
            
            return {
                'success': True,
                'message': 'PDF document processed successfully',
                'file_url': upload_result['file_url'],
                'public_id': upload_result['public_id'],
                'preview_image_url': upload_result.get('preview_image_url'),
                'file_size': upload_result['file_size'],
                'cloudinary_data': upload_result['cloudinary_data'],
                # For compatibility with existing code structure
                'converted_images': upload_result['converted_images'],
                'is_pdf_converted': upload_result['is_pdf_converted']
            }
            
        except (PDFValidationError, PDFConversionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error processing PDF: {str(e)}")
            raise PDFConversionError(f"PDF processing failed: {str(e)}")


# Create singleton instance
pdf_service = SimplePDFService()


def validate_and_process_pdf(file: UploadedFile, user_email: str, document_type: str) -> Dict[str, any]:
    """
    Convenience function to validate and process PDF files
    
    Args:
        file: UploadedFile object containing the PDF
        user_email: User's email for organizing uploads
        document_type: Type of document for tagging
        
    Returns:
        Dict containing processing results
    """
    return pdf_service.process_pdf_document(file, user_email, document_type)