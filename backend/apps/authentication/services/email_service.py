"""
Email service for sending beautiful HTML emails
"""
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.utils import timezone
from datetime import timedelta
import random
import string
import base64
import os
from apps.authentication.models import EmailOTP


class EmailService:
    """Service for sending beautiful HTML emails"""
    
    @staticmethod
    def get_logo_base64():
        """Get the logo as base64 encoded string with fallback handling"""
        try:
            logo_path = os.path.join(settings.BASE_DIR, 'templates', 'emails', 'logo.svg')
            if os.path.exists(logo_path):
                with open(logo_path, 'rb') as logo_file:
                    logo_data = logo_file.read()
                    if logo_data:  # Check if file is not empty
                        return base64.b64encode(logo_data).decode('utf-8')
            
            # Fallback: return None so template can show emoji instead
            print("Logo file not found or empty, template will use emoji fallback")
            return None
        except Exception as e:
            print(f"Failed to load logo: {e}, using emoji fallback")
            return None
    
    @staticmethod
    def send_otp(email, purpose='registration', user_name='User'):
        """
        Send OTP to email for verification
        
        Args:
            email: Email address to send OTP to
            purpose: Purpose of OTP ('registration', 'password_reset', 'email_verification')
            user_name: Name of the user (optional)
        
        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            # Generate OTP
            otp_length = getattr(settings, 'OTP_LENGTH', 6)
            otp = ''.join(random.choices(string.digits, k=otp_length))
            
            # Set expiry time
            expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
            
            # Delete any existing OTPs for this email and purpose
            EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False).delete()
            
            # Create new OTP record
            otp_record = EmailOTP.objects.create(
                email=email,
                otp=otp,
                purpose=purpose,
                expires_at=expires_at
            )
            
            # Prepare email content (remove emojis to avoid spam filters)
            if purpose == 'registration':
                subject = 'ChefSync - Email Verification Code'
            elif purpose == 'password_reset':
                subject = 'ChefSync - Password Reset Code'
            else:
                subject = 'ChefSync - Verification Code'
            
            # Prepare context for HTML template
            context = {
                'user_name': user_name,
                'email': email,
                'otp_code': otp,
                'purpose': purpose,
                'expiry_minutes': expiry_minutes,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:8080'),
            }
            
            # Render HTML email template
            html_content = render_to_string('emails/otp_email_beautiful.html', context)
            
            # Create plain text version
            text_content = f"""
Hello {user_name},

Please use the verification code below:

Verification Code: {otp}

This code will expire in {expiry_minutes} minutes.

If you didn't request this code, please ignore this email.

Best regards,
The ChefSync Team
            """
            
            # Send email with HTML template
            email_message = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
                headers={
                    'X-Priority': '3',
                    'X-MSMail-Priority': 'Normal',
                    'X-Mailer': 'ChefSync Application',
                }
            )
            
            # Attach HTML version
            email_message.attach_alternative(html_content, "text/html")
            
            # Send email (do not fail silently so errors are visible during troubleshooting)
            sent_count = email_message.send(fail_silently=False)
            if sent_count == 0:
                raise Exception('No emails were sent by the SMTP backend')
            
            print(f"✅ Email sent successfully to {email} with OTP: {otp}")  # Debug log
            
            return {
                'success': True,
                'message': f'Verification code sent to {email}'
            }
            
        except Exception as e:
            # Log the exception for debugging and return structured error
            import traceback
            tb = traceback.format_exc()
            print(f"Failed to send OTP: {repr(e)}\n{tb}")
            return {
                'success': False,
                'message': f'Failed to send verification code: {str(e)}',
                'details': tb
            }
    
    @staticmethod
    def verify_otp(email, otp, purpose='registration'):
        """
        Verify OTP for email verification
        
        Args:
            email: Email address
            otp: OTP code to verify
            purpose: Purpose of OTP ('registration', 'password_reset', 'email_verification')
        
        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            # Find the OTP record
            otp_record = EmailOTP.objects.filter(
                email=email,
                purpose=purpose,
                is_used=False
            ).order_by('-created_at').first()
            
            if not otp_record:
                return {
                    'success': False,
                    'message': 'No verification code found for this email'
                }
            
            # Check if OTP has expired
            if timezone.now() > otp_record.expires_at:
                otp_record.is_used = True  # Mark as used to prevent reuse
                otp_record.save()
                return {
                    'success': False,
                    'message': 'Verification code has expired. Please request a new one.'
                }
            
            # Check if OTP matches
            if otp_record.otp != otp:
                # Increment attempts
                otp_record.attempts += 1
                otp_record.save()
                
                # If too many attempts, mark as used
                if otp_record.attempts >= 3:
                    otp_record.is_used = True
                    otp_record.save()
                    return {
                        'success': False,
                        'message': 'Too many failed attempts. Please request a new verification code.'
                    }
                
                return {
                    'success': False,
                    'message': 'Invalid verification code. Please try again.'
                }
            
            # OTP is valid - mark as used
            otp_record.is_used = True
            otp_record.save()
            
            return {
                'success': True,
                'message': 'Verification code verified successfully'
            }
            
        except Exception as e:
            print(f"Failed to verify OTP: {e}")
            return {
                'success': False,
                'message': f'Failed to verify code: {str(e)}'
            }
    
    @staticmethod
    def send_approval_email(user, status, admin_notes=None):
        """
        Send approval/rejection email to user
        
        Args:
            user: User instance
            status: 'approved' or 'rejected'
            admin_notes: Optional admin notes for rejection
        """
        try:
            # Get logo as base64
            logo_base64 = EmailService.get_logo_base64()
            
            # Prepare context for email template
            context = {
                'user_name': user.name,
                'user_email': user.email,
                'role_display': user.get_role_display(),
                'status': status,
                'admin_notes': admin_notes,
                'login_url': f"{settings.FRONTEND_URL}/auth/login",
                'support_url': f"{settings.FRONTEND_URL}/contact",
                'logo_base64': logo_base64,
            }
            
            # Render HTML email template
            html_content = render_to_string('emails/approval_email.html', context)
            
            # Create plain text version
            text_content = strip_tags(html_content)
            
            # Determine subject and sender
            if status == 'approved':
                subject = f'🎉 Account Approved - Welcome to ChefSync!'
            else:
                subject = f'Account Application Update - ChefSync'
            
            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            email.send()
            
            return True
            
        except Exception as e:
            print(f"Failed to send approval email: {e}")
            return False
    
    @staticmethod
    def send_welcome_email(user):
        """
        Send welcome email to newly registered user
        
        Args:
            user: User instance
        """
        try:
            context = {
                'user_name': user.name,
                'user_email': user.email,
                'role_display': user.get_role_display(),
                'login_url': f"{settings.FRONTEND_URL}/auth/login",
                'support_url': f"{settings.FRONTEND_URL}/contact",
            }
            
            html_content = render_to_string('emails/welcome_email.html', context)
            text_content = strip_tags(html_content)
            
            subject = f'Welcome to ChefSync, {user.name}!'
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            return True
            
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
            return False
    
    @staticmethod
    def send_document_upload_notification(user, document_type):
        """
        Send notification when user uploads a document
        
        Args:
            user: User instance
            document_type: DocumentType instance
        """
        try:
            context = {
                'user_name': user.name,
                'document_type': document_type.name,
                'support_url': f"{settings.FRONTEND_URL}/contact",
            }
            
            html_content = render_to_string('emails/document_upload_notification.html', context)
            text_content = strip_tags(html_content)
            
            subject = f'Document Upload Confirmation - {document_type.name}'
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            return True
            
        except Exception as e:
            print(f"Failed to send document upload notification: {e}")
            return False