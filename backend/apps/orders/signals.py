from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.communications.utils import NotificationManager
from .models import Order, BulkOrder

User = get_user_model()


@receiver(post_save, sender=Order)
def notify_chef_new_order(sender, instance, created, **kwargs):
    """
    Send notification to chef when a new order is placed
    """
    if created and instance.chef:
        # Check if this is a bulk order
        try:
            bulk_order = BulkOrder.objects.get(order=instance)
            # It's a bulk order
            NotificationManager.notify_bulk_order_placed(bulk_order)
        except BulkOrder.DoesNotExist:
            # Regular order
            NotificationManager.notify_order_placed(instance)


@receiver(post_save, sender=Order)
def notify_customer_order_status_change(sender, instance, created, **kwargs):
    """
    Send notification to customer when order status changes
    """
    if not created:
        # Order status was updated
        NotificationManager.notify_order_status_change(instance, instance.status)


@receiver(post_save, sender=BulkOrder)
def notify_bulk_order_collaboration(sender, instance, created, **kwargs):
    """
    Send notification when bulk order collaboration status changes
    """
    if not created and hasattr(instance, '_collaboration_update'):
        # This would be set when collaboration status changes
        # For now, we'll create a general collaboration notification
        NotificationManager.create_notification(
            user=instance.order.chef,
            subject=f"Bulk Order Collaboration Update: #{instance.order.order_number}",
            message=f"There has been an update to the collaboration status for bulk order #{instance.order.order_number}.",
            notification_type='bulk_order'
        )