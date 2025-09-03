from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from delivery.models import Order, Delivery, DeliveryNotification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample data for ChefSync delivery system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            DeliveryNotification.objects.all().delete()
            Delivery.objects.all().delete()
            Order.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        # Create users
        self.stdout.write('Creating users...')
        
        # Create customers
        customers = []
        customer_data = [
            {'username': 'john_doe', 'email': 'john@example.com', 'first_name': 'John', 'last_name': 'Doe'},
            {'username': 'jane_smith', 'email': 'jane@example.com', 'first_name': 'Jane', 'last_name': 'Smith'},
            {'username': 'mike_wilson', 'email': 'mike@example.com', 'first_name': 'Mike', 'last_name': 'Wilson'},
            {'username': 'sarah_brown', 'email': 'sarah@example.com', 'first_name': 'Sarah', 'last_name': 'Brown'},
            {'username': 'tom_davis', 'email': 'tom@example.com', 'first_name': 'Tom', 'last_name': 'Davis'},
        ]
        
        for data in customer_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name']
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            customers.append(user)

        # Create delivery agents
        agents = []
        agent_data = [
            {'username': 'agent_alex', 'email': 'alex@chefsync.com', 'first_name': 'Alex', 'last_name': 'Rodriguez'},
            {'username': 'agent_emma', 'email': 'emma@chefsync.com', 'first_name': 'Emma', 'last_name': 'Johnson'},
            {'username': 'agent_david', 'email': 'david@chefsync.com', 'first_name': 'David', 'last_name': 'Lee'},
        ]
        
        for data in agent_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name']
                }
            )
            if created:
                user.set_password('agent123')
                user.save()
            agents.append(user)

        # Create admin user if it doesn't exist
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@chefsync.com',
                password='admin123'
            )
            self.stdout.write(self.style.SUCCESS('Admin user created (username: admin, password: admin123)'))

        self.stdout.write(self.style.SUCCESS(f'Created {len(customers)} customers and {len(agents)} delivery agents'))

        # Create orders with different statuses
        self.stdout.write('Creating orders...')
        
        food_items = [
            'Margherita Pizza', 'Chicken Burger', 'Caesar Salad', 'Spaghetti Carbonara',
            'Sushi Roll Combo', 'Beef Tacos', 'Thai Green Curry', 'Fish & Chips',
            'Vegetarian Wrap', 'BBQ Ribs', 'Mushroom Risotto', 'Grilled Salmon',
            'Chicken Wings', 'Pad Thai', 'Greek Gyros'
        ]
        
        order_statuses = ['Placed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered']
        
        orders = []
        now = timezone.now()
        
        for i in range(15):
            # Create orders with varying creation times (last 3 days)
            created_time = now - timedelta(days=2, hours=i*2, minutes=i*15)
            
            order = Order.objects.create(
                customer=customers[i % len(customers)],
                food_item=food_items[i % len(food_items)],
                status=order_statuses[min(i // 3, len(order_statuses) - 1)],
                created_at=created_time,
                updated_at=created_time + timedelta(minutes=30 + i*10)
            )
            orders.append(order)

        self.stdout.write(self.style.SUCCESS(f'Created {len(orders)} orders'))

        # Create deliveries
        self.stdout.write('Creating deliveries...')
        
        delivery_statuses = ['Pending', 'Accepted', 'Out for Delivery', 'Delivered']
        deliveries = []
        
        for i, order in enumerate(orders):
            # Only create deliveries for orders that are Ready or beyond
            if order.status in ['Ready', 'Out for Delivery', 'Delivered']:
                delivery_status = delivery_statuses[min(i // 4, len(delivery_statuses) - 1)]
                
                # Assign agent for accepted deliveries
                agent = agents[i % len(agents)] if delivery_status != 'Pending' else None
                
                delivery = Delivery.objects.create(
                    order=order,
                    agent=agent,
                    status=delivery_status,
                    created_at=order.created_at + timedelta(minutes=45),
                    updated_at=order.updated_at
                )
                
                # Set timestamps based on delivery status
                base_time = delivery.created_at
                if delivery_status in ['Accepted', 'Out for Delivery', 'Delivered']:
                    delivery.assigned_at = base_time
                    delivery.accepted_at = base_time + timedelta(minutes=10)
                
                if delivery_status in ['Out for Delivery', 'Delivered']:
                    delivery.picked_at = base_time + timedelta(minutes=25)
                
                if delivery_status == 'Delivered':
                    delivery.delivered_at = base_time + timedelta(minutes=45)
                
                delivery.save()
                deliveries.append(delivery)

        self.stdout.write(self.style.SUCCESS(f'Created {len(deliveries)} deliveries'))

        # Create notifications
        self.stdout.write('Creating notifications...')
        
        notification_messages = [
            'Your delivery has been assigned to an agent',
            'Delivery agent has accepted your order',
            'Your order is out for delivery',
            'Your order has been delivered successfully',
            'Delivery delayed due to traffic',
            'Agent is at your location',
            'Please be available for delivery'
        ]
        
        notifications = []
        for i, delivery in enumerate(deliveries):
            # Create 1-3 notifications per delivery
            num_notifications = min(3, max(1, i % 4))
            
            for j in range(num_notifications):
                notification = DeliveryNotification.objects.create(
                    delivery=delivery,
                    message=notification_messages[(i + j) % len(notification_messages)],
                    created_at=delivery.created_at + timedelta(minutes=15 + j*20),
                    is_read=j == 0  # Mark first notification as read
                )
                notifications.append(notification)

        self.stdout.write(self.style.SUCCESS(f'Created {len(notifications)} notifications'))

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('SEEDING COMPLETED SUCCESSFULLY!'))
        self.stdout.write('='*50)
        self.stdout.write(f'📊 Database Summary:')
        self.stdout.write(f'   👥 Users: {User.objects.count()}')
        self.stdout.write(f'   🍕 Orders: {Order.objects.count()}')
        self.stdout.write(f'   🚚 Deliveries: {Delivery.objects.count()}')
        self.stdout.write(f'   📧 Notifications: {DeliveryNotification.objects.count()}')
        self.stdout.write('\n🔑 Admin Login: username=admin, password=admin123')
        self.stdout.write('🔑 Customer Login: username=john_doe, password=password123')
        self.stdout.write('🔑 Agent Login: username=agent_alex, password=agent123')
        self.stdout.write('='*50)
