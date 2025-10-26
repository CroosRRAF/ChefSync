"""
Order Notification Service
Handles creating and managing notifications for order status changes
"""
from django.contrib.auth import get_user_model
from apps.communications.models import Notification

User = get_user_model()


class OrderNotificationService:
    """Service for managing order-related notifications"""

    @staticmethod
    def create_order_notification(user, order, notification_type, order_status):
        """
        Create a notification for order status changes
        
        Args:
            user: The user to notify
            order: The order object
            notification_type: Type of notification (placed, confirmed, preparing, etc.)
            order_status: Current order status
        """
        # Define notification messages based on type
        notification_messages = {
            'placed': {
                'subject': f'Order #{order.order_number} Placed Successfully',
                'message': f'Your order #{order.order_number} (ID: {order.id}) has been placed and is waiting for chef approval. Order total: ₹{order.total_amount}. Click to track your order.'
            },
            'confirmed': {
                'subject': f'Order #{order.order_number} Confirmed',
                'message': f'Great news! Your order #{order.order_number} (ID: {order.id}) has been confirmed by the chef and will be prepared soon. Click to track.'
            },
            'preparing': {
                'subject': f'Order #{order.order_number} is Being Prepared',
                'message': f'Your order #{order.order_number} (ID: {order.id}) is now being prepared by the chef. It will be ready soon! Click to track.'
            },
            'ready': {
                'subject': f'Order #{order.order_number} is Ready',
                'message': f'Your order #{order.order_number} (ID: {order.id}) is ready for pickup/delivery! Click to view details.'
            },
            'out_for_delivery': {
                'subject': f'Order #{order.order_number} is Out for Delivery',
                'message': f'Your order #{order.order_number} (ID: {order.id}) is on its way! Click to track your delivery in real-time.'
            },
            'delivered': {
                'subject': f'Order #{order.order_number} Delivered',
                'message': f'Your order #{order.order_number} (ID: {order.id}) has been delivered. Enjoy your meal! Click to leave a review.'
            },
            'cancelled': {
                'subject': f'Order #{order.order_number} Cancelled',
                'message': f'Your order #{order.order_number} (ID: {order.id}) has been cancelled. Refund will be processed within 3-5 business days.'
            },
            'rejected': {
                'subject': f'Order #{order.order_number} Not Accepted',
                'message': f'Unfortunately, the chef could not accept your order #{order.order_number} (ID: {order.id}). Please try ordering from another chef.'
            },
        }

        # Get notification content
        notification_content = notification_messages.get(
            notification_type,
            {
                'subject': f'Order #{order.order_number} Update',
                'message': f'Your order status has been updated to {order_status}.'
            }
        )

        # Create notification
        notification = Notification.objects.create(
            user=user,
            subject=notification_content['subject'],
            message=notification_content['message'],
            status='Unread'
        )

        return notification

    @staticmethod
    def notify_customer_order_placed(order):
        """Notify customer when order is placed"""
        return OrderNotificationService.create_order_notification(
            user=order.customer,
            order=order,
            notification_type='placed',
            order_status=order.status
        )

    @staticmethod
    def notify_chef_new_order(order):
        """Notify chef when new order is received"""
        if not order.chef:
            return None

        notification = Notification.objects.create(
            user=order.chef,
            subject=f'New Order Received: #{order.order_number}',
            message=f'You have received a new order #{order.order_number} (ID: {order.id}) from {order.customer.name or order.customer.username}. Total: ₹{order.total_amount}. Please review and accept.',
            status='Unread'
        )
        return notification

    @staticmethod
    def notify_order_confirmed(order):
        """Notify customer when chef confirms order"""
        return OrderNotificationService.create_order_notification(
            user=order.customer,
            order=order,
            notification_type='confirmed',
            order_status=order.status
        )

    @staticmethod
    def notify_order_rejected(order, reason=None):
        """Notify customer when chef rejects order"""
        notification = Notification.objects.create(
            user=order.customer,
            subject=f'Order #{order.order_number} Not Accepted',
            message=f'Unfortunately, the chef could not accept your order #{order.order_number} (ID: {order.id}). {f"Reason: {reason}" if reason else ""}',
            status='Unread'
        )
        return notification

    @staticmethod
    def notify_order_preparing(order):
        """Notify customer when order is being prepared"""
        return OrderNotificationService.create_order_notification(
            user=order.customer,
            order=order,
            notification_type='preparing',
            order_status=order.status
        )

    @staticmethod
    def notify_order_ready(order):
        """Notify customer and delivery partner when order is ready"""
        notifications = []
        
        # Notify customer
        customer_notification = OrderNotificationService.create_order_notification(
            user=order.customer,
            order=order,
            notification_type='ready',
            order_status=order.status
        )
        notifications.append(customer_notification)
        
        # Notify delivery partner if assigned
        if order.delivery_partner:
            delivery_notification = Notification.objects.create(
                user=order.delivery_partner,
                subject=f'Order #{order.order_number} Ready for Pickup',
                message=f'Order #{order.order_number} (ID: {order.id}) is ready for pickup from {order.chef.name or order.chef.username}. Click to view details.',
                status='Unread'
            )
            notifications.append(delivery_notification)
        
        return notifications

    @staticmethod
    def notify_order_out_for_delivery(order):
        """Notify customer when order is out for delivery"""
        return OrderNotificationService.create_order_notification(
            user=order.customer,
            order=order,
            notification_type='out_for_delivery',
            order_status=order.status
        )

    @staticmethod
    def notify_order_delivered(order):
        """Notify customer and chef when order is delivered"""
        notifications = []
        
        # Notify customer
        customer_notification = OrderNotificationService.create_order_notification(
            user=order.customer,
            order=order,
            notification_type='delivered',
            order_status=order.status
        )
        notifications.append(customer_notification)
        
        # Notify chef
        if order.chef:
            chef_notification = Notification.objects.create(
                user=order.chef,
                subject=f'Order #{order.order_number} Delivered Successfully',
                message=f'Your order #{order.order_number} (ID: {order.id}) to {order.customer.name or order.customer.username} has been delivered. Great job!',
                status='Unread'
            )
            notifications.append(chef_notification)
        
        return notifications

    @staticmethod
    def notify_order_cancelled(order, cancelled_by=None, reason=None):
        """Notify relevant parties when order is cancelled"""
        notifications = []
        
        # Notify chef if cancelled by customer
        if cancelled_by == 'customer' and order.chef:
            chef_notification = Notification.objects.create(
                user=order.chef,
                subject=f'Order #{order.order_number} Cancelled by Customer',
                message=f'Order #{order.order_number} (ID: {order.id}) from {order.customer.name or order.customer.username} has been cancelled. {f"Reason: {reason}" if reason else ""}',
                status='Unread'
            )
            notifications.append(chef_notification)
        
        # Notify customer if cancelled by chef
        elif cancelled_by == 'chef':
            customer_notification = OrderNotificationService.create_order_notification(
                user=order.customer,
                order=order,
                notification_type='cancelled',
                order_status=order.status
            )
            notifications.append(customer_notification)
        
        # Notify delivery partner if assigned
        if order.delivery_partner:
            delivery_notification = Notification.objects.create(
                user=order.delivery_partner,
                subject=f'Order #{order.order_number} Cancelled',
                message=f'Order #{order.order_number} (ID: {order.id}) has been cancelled and is no longer available for delivery.',
                status='Unread'
            )
            notifications.append(delivery_notification)
        
        return notifications

