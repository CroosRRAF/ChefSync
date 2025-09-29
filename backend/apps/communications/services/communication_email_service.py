"""
Communication Email Service
Handles email notifications for communication responses and updates
"""

import base64
import os

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class CommunicationEmailService:
    """Email service for communication notifications"""

    @staticmethod
    def get_logo_base64():
        """Get the logo as base64 encoded string with fallback handling"""
        try:
            logo_path = os.path.join(
                settings.BASE_DIR, "templates", "emails", "logo.svg"
            )
            if os.path.exists(logo_path):
                with open(logo_path, "rb") as logo_file:
                    logo_data = logo_file.read()
                    if logo_data:
                        return base64.b64encode(logo_data).decode("utf-8")
            return None
        except Exception as e:
            print(f"Failed to load logo: {e}, using emoji fallback")
            return None

    @staticmethod
    def send_response_notification(communication, response, responder):
        """
        Send email notification to user when admin responds to their communication

        Args:
            communication: Communication instance
            response: CommunicationResponse instance
            responder: User who responded (admin)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            logo_base64 = CommunicationEmailService.get_logo_base64()

            context = {
                "user_name": communication.user.name,
                "communication_type": communication.communication_type.title(),
                "reference_number": communication.reference_number,
                "subject": communication.subject,
                "original_message": communication.message,
                "response": response.message,
                "responder_name": responder.name,
                "responder_role": responder.role.title(),
                "response_date": response.created_at.strftime("%B %d, %Y at %I:%M %p"),
                "logo_base64": logo_base64,
                "site_name": "ChefSync Kitchen",
            }

            # Render HTML and text versions
            html_content = render_to_string(
                "emails/communication_response.html", context
            )
            text_content = strip_tags(html_content)

            # Create email
            subject = f"Response to your {communication.communication_type.title()}: {communication.reference_number}"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = communication.user.email

            email = EmailMultiAlternatives(
                subject=subject, body=text_content, from_email=from_email, to=[to_email]
            )
            email.attach_alternative(html_content, "text/html")

            # Send email
            email.send()

            return True

        except Exception as e:
            print(f"Failed to send communication response email: {e}")
            return False

    @staticmethod
    def send_communication_received_notification(communication):
        """
        Send email notification to admin when new communication is received

        Args:
            communication: Communication instance

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            logo_base64 = CommunicationEmailService.get_logo_base64()

            context = {
                "communication_type": communication.communication_type.title(),
                "reference_number": communication.reference_number,
                "subject": communication.subject,
                "message": communication.message,
                "user_name": communication.user.name,
                "user_email": communication.user.email,
                "user_phone": communication.user.phone_no or "Not provided",
                "priority": communication.priority.title(),
                "submitted_date": communication.created_at.strftime(
                    "%B %d, %Y at %I:%M %p"
                ),
                "logo_base64": logo_base64,
                "site_name": "ChefSync Kitchen",
                "admin_panel_url": f"{settings.FRONTEND_URL}/admin/communications",
            }

            # Render HTML and text versions
            html_content = render_to_string(
                "emails/new_communication_admin.html", context
            )
            text_content = strip_tags(html_content)

            # Create email - send to admin email
            subject = f"New {communication.communication_type.title()} Received: {communication.reference_number}"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = settings.ADMIN_EMAIL  # Assuming this is set in settings

            email = EmailMultiAlternatives(
                subject=subject, body=text_content, from_email=from_email, to=[to_email]
            )
            email.attach_alternative(html_content, "text/html")

            # Send email
            email.send()

            return True

        except Exception as e:
            print(f"Failed to send new communication email: {e}")
            return False
