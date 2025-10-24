from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Food, BulkMenu, BulkMenuItem
from apps.communications.utils import NotificationManager

User = get_user_model()


@receiver(post_save, sender=Food)
def notify_admin_on_food_submission(sender, instance, created, **kwargs):
    """
    Send notification to admin when chef submits a new food item
    """
    if created and instance.status == 'Pending':
        # Notify admin about new submission
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        
        for admin in admin_users:
            NotificationManager.create_notification(
                user=admin,
                subject=f"New Food Submission: {instance.name}",
                message=f"Chef {instance.chef.get_full_name() if instance.chef else 'Unknown'} has submitted a new food item '{instance.name}' for approval. Please review and approve/reject.",
                notification_type='menu'
            )


@receiver(post_save, sender=Food)
def notify_chef_on_food_creation(sender, instance, created, **kwargs):
    """
    Send confirmation notification to chef when they create a new food item
    """
    if created and instance.chef:
        NotificationManager.notify_menu_item_created(instance.chef, instance.name)


@receiver(post_save, sender=Food)
def notify_chef_on_status_change(sender, instance, created, **kwargs):
    """
    Send notification to chef when food status changes from pending to approved/rejected
    """
    if not created and instance.chef:
        # Check if status changed from previous value
        if hasattr(instance, '_previous_status') and instance._previous_status != instance.status:
            if instance.status == 'Approved':
                NotificationManager.notify_menu_item_approved(instance.chef, instance.name)
            elif instance.status == 'Rejected':
                NotificationManager.notify_menu_item_rejected(instance.chef, instance.name)


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


# BULK MENU CREATION NOTIFICATIONS

@receiver(post_save, sender=BulkMenu)
def notify_chef_on_bulk_menu_creation(sender, instance, created, **kwargs):
    """
    Send notification to chef when they create a new bulk menu
    """
    if created and instance.chef:
        NotificationManager.notify_bulk_menu_created(
            instance.chef, 
            instance.menu_name, 
            instance.get_meal_type_display().lower(),
            instance.base_price_per_person
        )


@receiver(post_save, sender=BulkMenu)
def notify_admin_on_bulk_menu_submission(sender, instance, created, **kwargs):
    """
    Send notification to admin when chef creates a new bulk menu
    """
    if created and instance.approval_status == 'pending':
        # Notify admin about new bulk menu submission
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        
        for admin in admin_users:
            NotificationManager.create_notification(
                user=admin,
                subject=f"New Bulk Menu Submission: {instance.menu_name}",
                message=f"Chef {instance.chef.get_full_name() if instance.chef else 'Unknown'} has submitted a new bulk menu '{instance.menu_name}' for {instance.get_meal_type_display().lower()}. Price: ₹{instance.base_price_per_person}/person. Please review and approve/reject.",
                notification_type='bulk_order'
            )


@receiver(post_save, sender=BulkMenuItem)
def notify_chef_on_bulk_menu_item_creation(sender, instance, created, **kwargs):
    """
    Send notification to chef when they add a new item to bulk menu
    """
    if created and instance.bulk_menu and instance.bulk_menu.chef:
        NotificationManager.notify_bulk_menu_item_created(
            instance.bulk_menu.chef,
            instance.item_name,
            instance.bulk_menu.menu_name,
            instance.is_optional,
            instance.extra_cost
        )


# DELETION NOTIFICATIONS

@receiver(pre_delete, sender=Food)
def notify_chef_on_food_deletion(sender, instance, **kwargs):
    """
    Send notification to chef when their food item is deleted
    """
    if instance.chef:
        # Get additional context from the request if available
        # This will help distinguish between chef deletion vs admin deletion
        NotificationManager.notify_menu_item_deleted(instance.chef, instance.name)


@receiver(pre_delete, sender=BulkMenu)
def notify_chef_on_bulk_menu_deletion(sender, instance, **kwargs):
    """
    Send notification to chef when their bulk menu is deleted
    """
    if instance.chef:
        items_count = instance.items.count()
        NotificationManager.notify_bulk_menu_deleted(
            instance.chef, 
            instance.menu_name, 
            items_count
        )


@receiver(pre_delete, sender=BulkMenuItem)
def notify_chef_on_bulk_menu_item_deletion(sender, instance, **kwargs):
    """
    Send notification to chef when a bulk menu item is deleted
    """
    if instance.bulk_menu and instance.bulk_menu.chef:
        NotificationManager.notify_bulk_menu_item_deleted(
            instance.bulk_menu.chef,
            instance.item_name,
            instance.bulk_menu.menu_name
        )