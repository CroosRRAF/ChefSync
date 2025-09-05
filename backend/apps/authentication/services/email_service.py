from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from ..models import EmailOTP
from string import Template
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

            # Purpose-specific body line
            if purpose == 'registration':
                body_line = 'Thank you for registering with ChefSync! Please use the verification code below to complete your sign up.'
            elif purpose == 'password_reset':
                body_line = 'Use the following code to reset your password securely.'
            elif purpose == 'email_verification':
                body_line = 'Please use the code below to verify your email address.'
            else:
                body_line = 'Use the verification code below.'

            # HTML message (responsive, email-client friendly with inline CSS) using Template to avoid f-string brace conflicts
            html_template = Template("""
            <!DOCTYPE html>
            <html lang=\"en\">
            <head>
              <meta charset=\"utf-8\">
              <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
              <meta http-equiv=\"x-ua-compatible\" content=\"ie=edge\">
              <title>$subject</title>
              <style>
                /* Client-specific styles */
                /* Force Outlook to provide a \"view in browser\" message */
                #outlook a{padding:0;}
                /* Force Hotmail to display emails at full width */
                .ReadMsgBody{width:100%;}
                .ExternalClass{width:100%;}
                /* Force Hotmail to display normal line spacing */
                .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div{line-height:100%;}
                /* Prevent WebKit and Windows mobile changing default text sizes */
                body, table, td, a{-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;}
                /* Remove spacing between tables in Outlook 2007 and up */
                table, td{mso-table-lspace:0pt; mso-table-rspace:0pt;}
                /* Fix for Yahoo truncation */
                .yshortcuts a{border-bottom:none !important;}
                /* Reset styles */
                img{border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}
                table{border-collapse:collapse !important;}
                body{margin:0 !important; padding:0 !important; width:100% !important;}
                /* Responsive styles */
                @media screen and (max-width: 600px) {
                  .container{width:100% !important;}
                  .p-24{padding:16px !important;}
                  .hero-title{font-size:22px !important;}
                  .otp{font-size:28px !important; letter-spacing:6px !important;}
                }
              </style>
            </head>
            <body style=\"background-color:#0b0d12; margin:0; padding:0;\">
              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" role=\"presentation\">
                <tr>
                  <td align=\"center\" style=\"padding:24px;\">
                    <table width=\"600\" class=\"container\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"width:600px; max-width:600px; background:linear-gradient(180deg,#0b0d12,#0f1320); border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.35);\">
                      <!-- Header / Brand -->
                      <tr>
                        <td align=\"center\" style=\"padding:32px 24px 16px 24px; background:linear-gradient(135deg,#7c3aed,#2563eb);\">
                          <table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">
                            <tr>
                              <td align=\"center\" style=\"background:rgba(255,255,255,0.15); padding:12px 16px; border-radius:12px;\">
                                <span style=\"display:inline-block; font-family:Arial,Helvetica,sans-serif; color:#ffffff; font-weight:700; font-size:18px; letter-spacing:0.5px;\">ChefSync</span>
                              </td>
                            </tr>
                          </table>
                          <div style=\"height:16px\"></div>
                          <div class=\"hero-title\" style=\"font-family:Arial,Helvetica,sans-serif; color:#f8fafc; font-size:24px; font-weight:800; letter-spacing:0.3px;\">$subject</div>
                          <div style=\"height:8px\"></div>
                          <div style=\"font-family:Arial,Helvetica,sans-serif; color:#e2e8f0; font-size:14px;\">
                            Hello $user_name,
                          </div>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td class=\"p-24\" style=\"padding:24px;\">
                          <table width=\"100%\" role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">
                            <tr>
                              <td style=\"font-family:Arial,Helvetica,sans-serif; color:#cbd5e1; font-size:15px; line-height:1.7;\">$body_line</td>
                            </tr>
                          </table>

                          <div style=\"height:20px\"></div>

                          <!-- OTP Box -->
                          <table width=\"100%\" role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:rgba(59,130,246,0.08); border:1px solid rgba(99,102,241,0.35); border-radius:14px;\">
                            <tr>
                              <td align=\"center\" style=\"padding:24px;\">
                                <div style=\"font-family:Arial,Helvetica,sans-serif; color:#94a3b8; font-size:12px; letter-spacing:0.6px; text-transform:uppercase;\">Your verification code</div>
                                <div class=\"otp\" style=\"font-family:Consolas,Monaco,'Courier New',monospace; color:#a78bfa; font-weight:800; font-size:34px; letter-spacing:10px; padding:10px 0;\">$otp</div>
                                <div style=\"font-family:Arial,Helvetica,sans-serif; color:#94a3b8; font-size:12px;\">Do not share this code with anyone.</div>
                              </td>
                            </tr>
                          </table>

                          <div style=\"height:16px\"></div>

                          <!-- Info -->
                          <table width=\"100%\" role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\">
                            <tr>
                              <td style=\"font-family:Arial,Helvetica,sans-serif; color:#a1a1aa; font-size:13px;\">⏰ This code expires in <strong style=\"color:#e5e7eb\">$expiry_minutes minutes</strong>.</td>
                            </tr>
                            <tr>
                              <td style=\"font-family:Arial,Helvetica,sans-serif; color:#737373; font-size:12px; padding-top:10px;\">
                                If you didn’t request this, you can safely ignore this email.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align=\"center\" style=\"padding:16px 24px 28px 24px; border-top:1px solid rgba(148,163,184,0.15);\">
                          <div style=\"font-family:Arial,Helvetica,sans-serif; color:#94a3b8; font-size:11px;\">
                            © 2024 ChefSync • All rights reserved
                          </div>
                          <div style=\"height:6px\"></div>
                          <div style=\"font-family:Arial,Helvetica,sans-serif; color:#6b7280; font-size:11px;\">This is an automated message, please do not reply.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """)

            html_message = html_template.safe_substitute(
                subject=subject,
                user_name=context['user_name'],
                otp=context['otp'],
                expiry_minutes=context['expiry_minutes'],
                body_line=body_line,
            )
            
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
