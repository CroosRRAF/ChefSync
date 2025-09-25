#!/usr/bin/env python3
"""
Simple test script to check Django setup
"""
import os
import sys
import django
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Food, Cuisine, FoodCategory, FoodImage
from apps.authentication.models import User

def test_database():
    print("Testing database connection...")
    
    try:
        # Test basic counts
        print(f"Foods: {Food.objects.count()}")
        print(f"Cuisines: {Cuisine.objects.count()}")
        print(f"Categories: {FoodCategory.objects.count()}")
        print(f"Images: {FoodImage.objects.count()}")
        print(f"Users: {User.objects.count()}")
        
        print("✅ Database test successful!")
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")

if __name__ == '__main__':
    test_database()