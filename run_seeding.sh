#!/bin/bash
cd /Users/arun/Documents/GitHub/ChefSync/backend
source venv/bin/activate
echo "Running seeding command..."
python manage.py seed_data --clear
echo "Checking database contents..."
python manage.py shell -c "
from delivery.models import Order, Delivery, DeliveryNotification
from django.contrib.auth import get_user_model
User = get_user_model()
print(f'✅ Users: {User.objects.count()}')
print(f'✅ Orders: {Order.objects.count()}') 
print(f'✅ Deliveries: {Delivery.objects.count()}')
print(f'✅ Notifications: {DeliveryNotification.objects.count()}')
"
echo "Seeding completed!"
