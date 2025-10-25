"""
Management command to auto-cancel orders that haven't been confirmed by chef within 10 minutes.
This should be run as a scheduled task (e.g., via cron or Celery beat).
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.orders.models import Order, OrderStatusHistory


class Command(BaseCommand):
    help = 'Auto-cancel orders pending chef confirmation for more than 10 minutes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cancelled without actually cancelling',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get current time
        now = timezone.now()
        cutoff_time = now - timedelta(minutes=10)
        
        # Find all pending orders older than 10 minutes
        pending_orders = Order.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        )
        
        cancelled_count = 0
        
        for order in pending_orders:
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'[DRY RUN] Would cancel Order #{order.order_number} '
                        f'(created: {order.created_at})'
                    )
                )
            else:
                try:
                    # Cancel the order
                    order.status = 'cancelled'
                    order.cancelled_at = now
                    order.chef_notes = 'Auto-cancelled: Chef did not confirm within 10 minutes'
                    order.save()
                    
                    # Create status history entry
                    OrderStatusHistory.objects.create(
                        order=order,
                        status='cancelled',
                        changed_by=order.chef,  # Auto-cancellation is attributed to chef
                        notes='Auto-cancelled: Chef did not confirm within 10 minutes'
                    )
                    
                    # Send notification to customer
                    try:
                        from apps.communications.services.order_notification_service import (
                            OrderNotificationService,
                        )
                        
                        # Create custom notification for auto-cancellation
                        from apps.communications.models import Notification
                        
                        Notification.objects.create(
                            user=order.customer,
                            subject=f'Order #{order.order_number} - Chef Did Not Respond',
                            message=f'Unfortunately, your order #{order.order_number} (LKR {float(order.total_amount):.2f}) was automatically cancelled because the chef did not confirm it within 10 minutes.\n\n'
                                   f'🔄 What to do next:\n'
                                   f'• Try ordering from another chef in your area\n'
                                   f'• Browse our available chefs and place a new order\n'
                                   f'• Your payment (if any) will be refunded within 3-5 business days\n\n'
                                   f'💡 Tip: Look for chefs with faster response times or higher ratings!',
                            status='Unread'
                        )
                        
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  └─ Notification sent to {order.customer.username}'
                            )
                        )
                    except Exception as notif_error:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  └─ Failed to send notification: {str(notif_error)}'
                            )
                        )
                    
                    cancelled_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Cancelled Order #{order.order_number} '
                            f'(customer: {order.customer.username})'
                        )
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'Error cancelling Order #{order.order_number}: {str(e)}'
                        )
                    )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'\n[DRY RUN] Would have cancelled {cancelled_count} orders'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSuccessfully cancelled {cancelled_count} orders'
                )
            )

