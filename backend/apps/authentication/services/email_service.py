from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from ..models import EmailOTP
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp(email, purpose='registration', user_name=None):
        """
        Send OTP to email for verification
        """
        try:
            # Create OTP
            otp_obj = EmailOTP.objects.create(
                email=email,
                purpose=purpose
            )
            
            # Prepare email content
            context = {
                'otp': otp_obj.otp,
                'user_name': user_name or 'User',
                'purpose': purpose,
                'expiry_minutes': getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            }
            
            # Email templates
            subject_map = {
                'registration': 'Verify Your Email - ChefSync Registration',
                'password_reset': 'Password Reset OTP - ChefSync',
                'email_verification': 'Email Verification OTP - ChefSync'
            }
            
            subject = subject_map.get(purpose, 'OTP Verification - ChefSync')
            
            # HTML message
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">ChefSync</h1>
                    <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your Food Delivery Platform</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; border-left: 5px solid #667eea;">
                    <h2 style="color: #333; margin-top: 0;">Hello {context['user_name']}!</h2>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Thank you for registering with ChefSync! To complete your registration, please verify your email address using the OTP below:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px dashed #667eea;">
                        <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your Verification Code</p>
                        <h1 style="font-size: 36px; letter-spacing: 8px; color: #667eea; margin: 0; font-family: 'Courier New', monospace;">{context['otp']}</h1>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #0066cc;">
                            ⏰ This OTP will expire in <strong>{context['expiry_minutes']} minutes</strong>
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        If you didn't request this verification, please ignore this email.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        © 2024 ChefSync. All rights reserved.<br>
                        This is an automated email, please do not reply.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Plain text message
            message = f"""
            Hello {context['user_name']}!
            
            Thank you for registering with ChefSync! 
            
            Your verification code is: {context['otp']}
            
            This OTP will expire in {context['expiry_minutes']} minutes.
            
            If you didn't request this verification, please ignore this email.
            
            Best regards,
            ChefSync Team
            """
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"OTP sent successfully to {email} for {purpose}")
            return {
                'success': True,
                'message': 'OTP sent successfully',
                'otp_id': otp_obj.id
            }
            
        except Exception as e:
            logger.error(f"Failed to send OTP to {email}: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to send OTP: {str(e)}'
            }
    
    @staticmethod
    def verify_otp(email, otp, purpose='registration'):
        """
        Verify OTP for given email and purpose
        """
        try:
            otp_obj = EmailOTP.objects.filter(
                email=email,
                otp=otp,
                purpose=purpose,
                is_used=False
            ).first()
            
            if not otp_obj:
                # Check if OTP exists but was already used
                used_otp = EmailOTP.objects.filter(
                    email=email,
                    otp=otp,
                    purpose=purpose,
                    is_used=True
                ).first()
                
                if used_otp:
                    return {
                        'success': False,
                        'message': 'This verification code has already been used. Please request a new code.'
                    }
                
                return {
                    'success': False,
                    'message': 'Invalid verification code. Please check your code and try again.'
                }
            
            if not otp_obj.is_valid():
                return {
                    'success': False,
                    'message': 'Verification code has expired. Please request a new code.'
                }
            
            # Mark OTP as used
            otp_obj.mark_as_used()
            
            return {
                'success': True,
                'message': 'Email verified successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to verify OTP for {email}: {str(e)}")
            return {
                'success': False,
                'message': f'Verification failed: {str(e)}'
            }
    
    @staticmethod
    def cleanup_expired_otps():
        """
        Clean up expired OTP records
        """
        from django.utils import timezone
        expired_count = EmailOTP.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()[0]
        logger.info(f"Cleaned up {expired_count} expired OTP records")
        return expired_count
