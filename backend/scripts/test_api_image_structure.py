#!/usr/bin/env python3
"""
Quick test to see what image data is being returned by the API
"""
import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food
from apps.food.serializers import FoodSerializer

# Get first 3 foods and their serialized data
foods = Food.objects.all()[:3]

print("🔍 API RESPONSE STRUCTURE TEST")
print("=" * 50)

for food in foods:
    serializer = FoodSerializer(food)
    data = serializer.data
    
    print(f"\n🍽️ Food: {data['name']}")
    print(f"   Primary Image: {data.get('primary_image', 'None')}")
    print(f"   Image URL: {data.get('image_url', 'None')}")
    print(f"   Thumbnail URL: {data.get('thumbnail_url', 'None')}")
    print(f"   Images Array ({len(data.get('images', []))}):")
    
    for idx, image in enumerate(data.get('images', [])[:2], 1):  # Show first 2 images
        print(f"     {idx}. ID: {image.get('id')}")
        print(f"        image_url: {image.get('image_url', 'None')}")
        print(f"        thumbnail_url: {image.get('thumbnail_url', 'None')}")
        print(f"        optimized_url: {image.get('optimized_url', 'None')}")
        print(f"        thumbnail: {image.get('thumbnail', 'None')}")
        print(f"        is_primary: {image.get('is_primary', False)}")

print(f"\n📋 Sample API Response Structure:")
if foods.exists():
    sample_food = FoodSerializer(foods.first()).data
    # Show just the image-related fields
    sample_response = {
        'name': sample_food['name'],
        'primary_image': sample_food.get('primary_image'),
        'image_url': sample_food.get('image_url'), 
        'thumbnail_url': sample_food.get('thumbnail_url'),
        'images': sample_food.get('images', [])[:1]  # Just first image
    }
    print(json.dumps(sample_response, indent=2))

print(f"\n✅ Test completed!")