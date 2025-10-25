"""
Management command to confirm all pending cash-on-delivery orders
"""
from django.core.management.base import BaseCommand
from apps.orders.models import Order, OrderStatusHistory
from django.utils import timezone


class Command(BaseCommand):
    help = 'Confirm all pending cash-on-delivery orders'

    def handle(self, *args, **options):
        # Find all pending orders with cash payment method
        pending_orders = Order.objects.filter(
            status='pending',
            payment_method='cash'
        )

        count = 0
        for order in pending_orders:
            # Update order status
            order.status = 'confirmed'
            order.confirmed_at = timezone.now()
            order.save()

            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                status='confirmed',
                changed_by=order.customer,  # Use customer as the one who changed it
                notes='Order auto-confirmed (cash on delivery) via management command.'
            )

            count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Confirmed order {order.order_number} (ID: {order.id})'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Successfully confirmed {count} pending orders'
            )
        )

