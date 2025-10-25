"""
Background Scheduler for Order Management
Automatically cancels orders that haven't been confirmed by chef within 10 minutes
"""
import logging
from datetime import timedelta

from django.utils import timezone
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from apps.orders.models import Order, OrderStatusHistory
from apps.communications.models import Notification

logger = logging.getLogger(__name__)


def auto_cancel_unconfirmed_orders():
    """
    Automatically cancel orders that haven't been confirmed by chef within 10 minutes.
    This runs every minute in the background.
    """
    try:
        now = timezone.now()
        cutoff_time = now - timedelta(minutes=10)
        
        # Find all pending orders older than 10 minutes
        pending_orders = Order.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        ).select_related('customer', 'chef')
        
        cancelled_count = 0
        
        for order in pending_orders:
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
                    changed_by=order.chef,  # Auto-cancellation attributed to chef
                    notes='Auto-cancelled: Chef did not confirm within 10 minutes'
                )
                
                # Send notification to customer
                try:
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
                    logger.info(f'✅ Auto-cancelled Order #{order.order_number} and notified customer {order.customer.username}')
                except Exception as notif_error:
                    logger.error(f'❌ Failed to send notification for Order #{order.order_number}: {str(notif_error)}')
                
                cancelled_count += 1
                
            except Exception as order_error:
                logger.error(f'❌ Error cancelling Order #{order.order_number}: {str(order_error)}')
        
        if cancelled_count > 0:
            logger.info(f'🔄 Auto-cancelled {cancelled_count} orders due to chef non-response')
        
        return cancelled_count
        
    except Exception as e:
        logger.error(f'❌ Error in auto_cancel_unconfirmed_orders: {str(e)}')
        return 0


def delete_old_job_executions(max_age=604_800):
    """
    Delete APScheduler job execution entries older than `max_age` from the database.
    Prevents db from filling up with old job entries.
    Default max_age is 7 days (604800 seconds)
    """
    try:
        DjangoJobExecution.objects.delete_old_job_executions(max_age)
        logger.info(f'🧹 Cleaned up old job executions (older than {max_age} seconds)')
    except Exception as e:
        logger.error(f'❌ Error cleaning up old job executions: {str(e)}')


# Create the scheduler instance
scheduler = BackgroundScheduler()
scheduler.add_jobstore(DjangoJobStore(), "default")


def start_scheduler():
    """
    Start the background scheduler.
    Called from apps.py when Django starts up.
    """
    if scheduler.running:
        logger.info('⚠️ Scheduler is already running!')
        return
    
    try:
        # Register the auto-cancel job - runs every minute
        scheduler.add_job(
            auto_cancel_unconfirmed_orders,
            trigger=IntervalTrigger(minutes=1),
            id='auto_cancel_orders',
            name='Auto-cancel unconfirmed orders',
            replace_existing=True,
            max_instances=1,  # Only one instance should run at a time
        )
        
        # Register cleanup job - runs once a week
        scheduler.add_job(
            delete_old_job_executions,
            trigger=IntervalTrigger(weeks=1),
            id='delete_old_job_executions',
            name='Clean up old job executions',
            replace_existing=True,
            max_instances=1,
        )
        
        # Start the scheduler
        scheduler.start()
        logger.info('✅ Order Auto-Cancel Scheduler started successfully!')
        logger.info('🔄 Auto-cancellation will run every 1 minute')
        
    except Exception as e:
        logger.error(f'❌ Error starting scheduler: {str(e)}')


def stop_scheduler():
    """
    Stop the background scheduler.
    Called when Django shuts down.
    """
    if scheduler.running:
        scheduler.shutdown()
        logger.info('🛑 Order Auto-Cancel Scheduler stopped')

