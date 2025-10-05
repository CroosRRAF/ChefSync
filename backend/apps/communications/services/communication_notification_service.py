"""
Communication Notification Service
Handles automated notifications for communication status changes
"""

from django.utils import timezone


class CommunicationNotificationService:
    """Service for handling communication notifications"""
    
    def send_status_change_notification(self, communication, old_status, new_status, admin_user, notes=None):
        """Send notification when communication status changes"""
        
        # Create in-app notification
        self._create_in_app_notification(communication, old_status, new_status, admin_user, notes)
        
        # Send email notification
        self._send_email_notification(communication, old_status, new_status, admin_user, notes)
    
    def _create_in_app_notification(self, communication, old_status, new_status, admin_user, notes=None):
        """Create in-app notification for user"""
        from ..models import Notification
        
        # Get status-specific message
        message = self._get_status_message(new_status, communication.communication_type, notes)
        
        # Create notification
        Notification.objects.create(
            user=communication.user,
            subject=f"Update on your {communication.communication_type.title()}: {communication.reference_number}",
            message=message,
            status='Unread'
        )
    
    def _send_email_notification(self, communication, old_status, new_status, admin_user, notes=None):
        """Send email notification to user"""
        from .communication_email_service import CommunicationEmailService
        
        email_service = CommunicationEmailService()
        email_service.send_status_change_email(
            communication=communication,
            old_status=old_status,
            new_status=new_status,
            admin_user=admin_user,
            notes=notes
        )
    
    def _get_status_message(self, status, communication_type, notes=None):
        """Get appropriate message based on status"""
        messages = {
            'pending': f"Your {communication_type} has been received and is being reviewed by our team.",
            'in_progress': f"Your {communication_type} is now being investigated. We will inform you as soon as possible.",
            'resolved': f"Your {communication_type} has been resolved. " + (notes or "Thank you for your patience."),
            'closed': f"Your {communication_type} has been closed. " + (notes or "If you have any further concerns, please contact us.")
        }
        return messages.get(status, f"Your {communication_type} status has been updated.")
    
    def get_status_info(self, status, communication_type):
        """Get status-specific information for email templates"""
        status_info = {
            'pending': {
                'title': 'Communication Received',
                'message': f'Your {communication_type} has been received and is being reviewed by our team.',
                'icon': '📋',
                'color': '#fbbf24'  # yellow
            },
            'in_progress': {
                'title': 'Under Investigation',
                'message': f'Your {communication_type} is now being investigated. We will inform you as soon as possible.',
                'icon': '🔍',
                'color': '#3b82f6'  # blue
            },
            'resolved': {
                'title': 'Issue Resolved',
                'message': f'Your {communication_type} has been resolved. Thank you for your patience.',
                'icon': '✅',
                'color': '#10b981'  # green
            },
            'closed': {
                'title': 'Communication Closed',
                'message': f'Your {communication_type} has been closed. If you have any further concerns, please contact us.',
                'icon': '🔒',
                'color': '#6b7280'  # gray
            }
        }
        return status_info.get(status, {
            'title': 'Status Updated',
            'message': 'Your communication status has been updated.',
            'icon': '📝',
            'color': '#6b7280'
        })
