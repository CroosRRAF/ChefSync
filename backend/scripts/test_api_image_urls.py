#!/usr/bin/env python3
import os
import sys
import django
import json
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food
from apps.food.serializers import FoodSerializer
from rest_framework.request import Request
from django.test import RequestFactory

print("🔍 Testing API Image URL Response:")
print("=" * 50)

# Create a mock request for the serializer
factory = RequestFactory()
request = factory.get('/')

# Get a sample food item
food = Food.objects.first()
if not food:
    print("❌ No food items found in database")
    exit(1)

print(f"📍 Testing with food: {food.name}")
print(f"   Raw image field: {food.image}")

# Test the model properties
print(f"\n🔧 Model Properties:")
print(f"   image_url: {food.image_url}")
print(f"   primary_image: {food.primary_image}")
print(f"   optimized_image_url: {food.optimized_image_url}")
print(f"   thumbnail_url: {food.thumbnail_url}")

# Test the serializer
print(f"\n📡 Serializer Output:")
serializer = FoodSerializer(food, context={'request': request})
serialized_data = serializer.data

print(f"   image: {serialized_data.get('image')}")
print(f"   image_url: {serialized_data.get('image_url')}")
print(f"   primary_image: {serialized_data.get('primary_image')}")
print(f"   optimized_image_url: {serialized_data.get('optimized_image_url')}")
print(f"   thumbnail_url: {serialized_data.get('thumbnail_url')}")

# Test the food search endpoint output
from apps.food.views import food_search
from django.http import QueryDict

print(f"\n🔍 Food Search API Output:")
request.GET = QueryDict(f'q={food.name[:5]}')
response = food_search(request)
search_data = response.data

if search_data:
    first_result = search_data[0]
    print(f"   Search result image_url: {first_result.get('image_url')}")
else:
    print("   No search results found")

print("\n" + "=" * 50)
print("✅ Test completed. Check the image URLs above to ensure they're working correctly.")