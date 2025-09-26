#!/usr/bin/env python
import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(__file__))
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.orders.views import place_order
from rest_framework.test import APIRequestFactory

User = get_user_model()

# Create a test request
factory = APIRequestFactory()
user = User.objects.filter(role='customer').first()
if not user:
    print("No customer user found")
    sys.exit(1)

print(f"Using user: {user.username} ({user.pk})")

# Create request
data = {
    'chef_id': 1,
    'delivery_address_id': 0,
    'delivery_latitude': 9.676068962007701,
    'delivery_longitude': 80.02113204738593,
    'delivery_address': 'Test Address',
    'customer_notes': 'Test order'
}

request = factory.post('/api/orders/place/', data, format='json')
request.user = user

print(f"Request user: {request.user}")
print(f"Request user authenticated: {request.user.is_authenticated}")

# Call the view
try:
    response = place_order(request)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()