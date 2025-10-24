"""
Notification utilities for creating notifications programmatically
"""
from apps.communications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationManager:
    """Utility class for creating and managing notifications"""
    
    @staticmethod
    def create_notification(user, subject, message, notification_type='info'):
        """
        Create a notification for a user
        
        Args:
            user: User instance to notify
            subject: Notification title/subject
            message: Notification message content
            notification_type: Type of notification (info, success, warning, error, order, bulk_order, etc.)
        
        Returns:
            Created Notification instance
        """
        return Notification.objects.create(
            user=user,
            subject=subject,
            message=message,
            status='Unread'
        )
    
    @staticmethod
    def notify_order_placed(order):
        """Notify chef when a new order is placed"""
        if order.chef:
            return NotificationManager.create_notification(
                user=order.chef,
                subject=f"New Order Received: #{order.order_number}",
                message=f"You have received a new order from {order.customer.name or order.customer.username}. Total: ₹{order.total_amount}. Please review and accept.",
                notification_type='order'
            )
    
    @staticmethod
    def notify_bulk_order_placed(bulk_order):
        """Notify chef when a new bulk order is placed"""
        if bulk_order.order.chef:
            return NotificationManager.create_notification(
                user=bulk_order.order.chef,
                subject=f"New Bulk Order Received: #{bulk_order.order.order_number}",
                message=f"You have received a new bulk order from {bulk_order.order.customer.name or bulk_order.order.customer.username}. Event for {bulk_order.event_details.get('num_persons', 'multiple')} persons. Total: ₹{bulk_order.order.total_amount}. Please review and accept.",
                notification_type='bulk_order'
            )
    
    @staticmethod
    def notify_profile_updated(user):
        """Notify user when their profile is updated successfully"""
        return NotificationManager.create_notification(
            user=user,
            subject="Profile Updated Successfully",
            message="Your profile has been updated successfully. Your information is now visible to customers and the system.",
            notification_type='profile'
        )
    
    @staticmethod
    def notify_menu_item_approved(user, food_name):
        """Notify chef when their menu item is approved"""
        return NotificationManager.create_notification(
            user=user,
            subject=f"Menu Item Approved: {food_name}",
            message=f"Great news! Your food item '{food_name}' has been approved by admin and is now visible to customers.",
            notification_type='menu'
        )
    
    @staticmethod
    def notify_menu_item_rejected(user, food_name):
        """Notify chef when their menu item is rejected"""
        return NotificationManager.create_notification(
            user=user,
            subject=f"Menu Item Rejected: {food_name}",
            message=f"Your food item '{food_name}' has been rejected by admin. Please review and resubmit with improvements.",
            notification_type='menu'
        )
    
    @staticmethod
    def notify_order_status_change(order, status):
        """Notify customer when order status changes"""
        status_messages = {
            'confirmed': f"Great news! Your order #{order.order_number} has been confirmed by the chef and will be prepared soon.",
            'preparing': f"Your order #{order.order_number} is now being prepared by the chef.",
            'ready': f"Your order #{order.order_number} is ready for pickup/delivery!",
            'out_for_delivery': f"Your order #{order.order_number} is out for delivery and will arrive soon.",
            'delivered': f"Your order #{order.order_number} has been delivered successfully. Enjoy your meal!",
            'cancelled': f"Your order #{order.order_number} has been cancelled."
        }
        
        if status in status_messages:
            return NotificationManager.create_notification(
                user=order.customer,
                subject=f"Order {status.title()}: #{order.order_number}",
                message=status_messages[status],
                notification_type='order'
            )
    
    @staticmethod
    def notify_menu_item_deleted(user, food_name):
        """Notify chef when their menu item is deleted"""
        return NotificationManager.create_notification(
            user=user,
            subject=f"🗑️ Menu Item Deleted: {food_name}",
            message=f"Your menu item '{food_name}' has been permanently deleted. This could be due to admin action or your own request. If this was unexpected, please contact support immediately or recreate the item from your menu page.",
            notification_type='menu'
        )
    
    @staticmethod
    def notify_bulk_menu_deleted(user, menu_name, items_count=0):
        """Notify chef when their bulk menu is deleted"""
        items_text = f"with {items_count} items" if items_count > 0 else "and all its items"
        return NotificationManager.create_notification(
            user=user,
            subject=f"🗑️ Bulk Menu Deleted: {menu_name}",
            message=f"Your bulk menu '{menu_name}' ({items_text}) has been permanently deleted. This could be due to admin action or your own request. If this was unexpected, please contact support immediately or recreate the menu from your bulk menu page.",
            notification_type='bulk_order'
        )
    
    @staticmethod
    def notify_bulk_menu_item_deleted(user, item_name, menu_name):
        """Notify chef when a bulk menu item is deleted"""
        return NotificationManager.create_notification(
            user=user,
            subject=f"📝 Menu Item Removed: {item_name}",
            message=f"The item '{item_name}' has been removed from your bulk menu '{menu_name}'. You can add it back or modify your menu items from the bulk menu management page.",
            notification_type='menu'
        )
    
    @staticmethod
    def notify_menu_item_created(user, food_name):
        """Notify chef when they create a new menu item"""
        return NotificationManager.create_notification(
            user=user,
            subject=f"✅ Food Item Added: {food_name}",
            message=f"Your new food item '{food_name}' has been successfully added to your menu and is now pending admin approval. You'll be notified once it's reviewed.",
            notification_type='menu'
        )
    
    @staticmethod
    def notify_bulk_menu_created(user, menu_name, meal_type, price_per_person):
        """Notify chef when they create a new bulk menu"""
        return NotificationManager.create_notification(
            user=user,
            subject=f"🍽️ Bulk Menu Created: {menu_name}",
            message=f"Your new bulk menu '{menu_name}' for {meal_type} has been successfully created and is now pending admin approval. Pricing: ₹{price_per_person}/person. You'll be notified once it's reviewed.",
            notification_type='bulk_order'
        )
    
    @staticmethod
    def notify_bulk_menu_item_created(user, item_name, menu_name, is_optional=False, extra_cost=0):
        """Notify chef when they add an item to bulk menu"""
        item_type = "Optional item" if is_optional else "Required item"
        cost_info = f"₹{extra_cost} extra cost" if extra_cost > 0 else "no extra cost"
        
        return NotificationManager.create_notification(
            user=user,
            subject=f"📝 Menu Item Added: {item_name}",
            message=f"New item '{item_name}' has been successfully added to your bulk menu '{menu_name}'. {item_type} with {cost_info}.",
            notification_type='menu'
        )