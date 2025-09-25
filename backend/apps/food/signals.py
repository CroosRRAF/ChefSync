from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Food
from apps.communications.models import Notification

User = get_user_model()


@receiver(post_save, sender=Food)
def notify_admin_on_food_submission(sender, instance, created, **kwargs):
    """
    Send notification to admin when chef submits a new food item
    """
    if created and instance.status == 'Pending':
        # Get all admin users
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                subject=f"New Food Submission: {instance.name}",
                message=f"Chef {instance.chef.get_full_name() if instance.chef else 'Unknown'} has submitted a new food item '{instance.name}' for approval. Please review and approve/reject.",
                status='Unread'
            )


@receiver(post_save, sender=Food)
def notify_chef_on_status_change(sender, instance, created, **kwargs):
    """
    Send notification to chef when food status changes from pending to approved/rejected
    """
    if not created and instance.chef:
        # Check if status changed from previous value
        if hasattr(instance, '_previous_status') and instance._previous_status != instance.status:
            if instance.status == 'Approved':
                Notification.objects.create(
                    user=instance.chef,
                    subject=f"Food Approved: {instance.name}",
                    message=f"Great news! Your food item '{instance.name}' has been approved by admin and is now visible to customers.",
                    status='Unread'
                )
            elif instance.status == 'Rejected':
                Notification.objects.create(
                    user=instance.chef,
                    subject=f"Food Rejected: {instance.name}",
                    message=f"Your food item '{instance.name}' has been rejected by admin. Please review and resubmit with improvements.",
                    status='Unread'
                )


# Store previous status for comparison
@receiver(post_save, sender=Food)
def store_previous_status(sender, instance, **kwargs):
    """Store the current status to track changes"""
    if instance.pk:
        try:
            previous = Food.objects.get(pk=instance.pk)
            instance._previous_status = previous.status
        except Food.DoesNotExist:
            instance._previous_status = None