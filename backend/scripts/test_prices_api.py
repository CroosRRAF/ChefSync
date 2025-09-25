#!/usr/bin/env python3
import os, sys, django, requests
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food

food = Food.objects.first()
print(f'Testing prices for: {food.name} (ID: {food.food_id})')
print(f'Prices in DB: {food.prices.count()}')

try:
    response = requests.get(f'http://localhost:8000/api/food/foods/{food.food_id}/prices/', timeout=5)
    print(f'API Response: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        count = len(data) if isinstance(data, list) else len(data.get('results', []))
        print(f'API returned: {count} prices')
        if count > 0:
            sample = data[0] if isinstance(data, list) else data.get('results', [])[0]
            print(f'Sample price: LKR {sample.get("price")} by {sample.get("cook_name")}')
    else:
        print(f'Error: {response.text[:100]}')
except Exception as e:
    print(f'Connection error: {e}')