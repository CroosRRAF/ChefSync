from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.communications.utils import NotificationManager
from .models import Cook

User = get_user_model()


@receiver(post_save, sender=User)
def notify_cook_profile_update(sender, instance, created, **kwargs):
    """
    Send notification to cook when their profile is updated successfully
    """
    if not created and instance.role in ['cook', 'Cook']:
        # Check if this is a profile update (not just any user save)
        # We can track this by checking if certain profile fields were updated
        update_fields = kwargs.get('update_fields', None)
        
        # If update_fields is None, it means save() was called without specifying fields
        # which usually indicates a profile update
        if update_fields is None or any(field in ['name', 'phone_no', 'address'] for field in update_fields):
            NotificationManager.notify_profile_updated(instance)


@receiver(post_save, sender=Cook)
def notify_cook_profile_cook_update(sender, instance, created, **kwargs):
    """
    Send notification to cook when their Cook profile is updated
    """
    if not created:
        # Cook profile was updated
        NotificationManager.create_notification(
            user=instance.user,
            subject="Chef Profile Updated",
            message="Your chef profile has been updated successfully. Your specialty cuisine, experience level, and kitchen location are now updated.",
            notification_type='profile'
        )