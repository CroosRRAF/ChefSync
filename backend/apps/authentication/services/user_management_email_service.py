"""
User Management Email Service
Dedicated mail service for user approval and rejection notifications
Isolated from general email system as per requirements
"""
import base64
import os

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class UserManagementEmailService:
    """Dedicated email service for user management notifications"""

    @staticmethod
    def get_logo_base64():
        """Get the logo as base64 encoded string with fallback handling"""
        try:
            logo_path = os.path.join(settings.BASE_DIR, 'templates', 'emails', 'logo.svg')
            if os.path.exists(logo_path):
                with open(logo_path, 'rb') as logo_file:
                    logo_data = logo_file.read()
                    if logo_data:
                        return base64.b64encode(logo_data).decode('utf-8')
            return None
        except Exception as e:
            print(f"Failed to load logo: {e}, using emoji fallback")
            return None

    @staticmethod
    def send_user_approval_notification(user, admin_notes=None):
        """
        Send user approval notification

        Args:
            user: User instance that was approved
            admin_notes: Optional admin notes

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            logo_base64 = UserManagementEmailService.get_logo_base64()

            context = {
                'user_name': user.name,
                'user_email': user.email,
                'role_display': dict(user.ROLE_CHOICES).get(user.role, user.role),
                'approval_date': user.approved_at.strftime('%B %d, %Y') if user.approved_at else 'Recently',
                'admin_notes': admin_notes,
                'login_url': f"{settings.FRONTEND_URL}/auth/login",
                'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
                'support_url': f"{settings.FRONTEND_URL}/contact",
                'logo_base64': logo_base64,
            }

            # Render HTML template
            html_content = render_to_string('emails/user_management/approval_notification.html', context)
            text_content = strip_tags(html_content)

            subject = f'🎉 Account Approved - Welcome to ChefSync!'

            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                headers={
                    'X-Service': 'UserManagement-Approval',
                    'X-Priority': '1',  # High priority
                    'X-MSMail-Priority': 'High',
                }
            )

            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

            print(f"✅ User approval notification sent to {user.email}")
            return True

        except Exception as e:
            print(f"❌ Failed to send user approval notification: {e}")
            return False

    @staticmethod
    def send_user_rejection_notification(user, admin_notes=None):
        """
        Send user rejection notification

        Args:
            user: User instance that was rejected
            admin_notes: Admin notes explaining rejection

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            logo_base64 = UserManagementEmailService.get_logo_base64()

            context = {
                'user_name': user.name,
                'user_email': user.email,
                'role_display': dict(user.ROLE_CHOICES).get(user.role, user.role),
                'rejection_date': user.updated_at.strftime('%B %d, %Y'),
                'admin_notes': admin_notes or 'Please contact support for more information.',
                'support_url': f"{settings.FRONTEND_URL}/contact",
                'reapply_url': f"{settings.FRONTEND_URL}/auth/register",
                'logo_base64': logo_base64,
            }

            # Render HTML template
            html_content = render_to_string('emails/user_management/rejection_notification.html', context)
            text_content = strip_tags(html_content)

            subject = f'Account Application Update - ChefSync'

            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                headers={
                    'X-Service': 'UserManagement-Rejection',
                    'X-Priority': '1',  # High priority
                    'X-MSMail-Priority': 'High',
                }
            )

            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

            print(f"✅ User rejection notification sent to {user.email}")
            return True

        except Exception as e:
            print(f"❌ Failed to send user rejection notification: {e}")
            return False

    @staticmethod
    def send_user_activation_notification(user, activated=True):
        """
        Send user activation/deactivation notification

        Args:
            user: User instance
            activated: True if activated, False if deactivated

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            logo_base64 = UserManagementEmailService.get_logo_base64()

            context = {
                'user_name': user.name,
                'user_email': user.email,
                'activated': activated,
                'status_change_date': user.updated_at.strftime('%B %d, %Y'),
                'login_url': f"{settings.FRONTEND_URL}/auth/login" if activated else None,
                'support_url': f"{settings.FRONTEND_URL}/contact",
                'logo_base64': logo_base64,
            }

            # Render HTML template
            template_name = 'activation_notification.html' if activated else 'deactivation_notification.html'
            html_content = render_to_string(f'emails/user_management/{template_name}', context)
            text_content = strip_tags(html_content)

            subject = f'Account {"Activated" if activated else "Deactivated"} - ChefSync'

            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                headers={
                    'X-Service': f'UserManagement-{"Activation" if activated else "Deactivation"}',
                    'X-Priority': '2',  # Normal priority
                    'X-MSMail-Priority': 'Normal',
                }
            )

            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)

            print(f"✅ User {"activation" if activated else "deactivation"} notification sent to {user.email}")
            return True

        except Exception as e:
            print(f"❌ Failed to send user {"activation" if activated else "deactivation"} notification: {e}")
            return False
