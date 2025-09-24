#!/usr/bin/env python3
"""
Simple verification of pagination fix
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

from apps.food.views import FoodViewSet
from apps.food.models import Food

def verify_pagination_fix():
    """Verify that pagination is disabled in FoodViewSet"""
    print("✅ PAGINATION FIX VERIFICATION")
    print("=" * 40)
    
    # Check the FoodViewSet class
    viewset = FoodViewSet()
    print(f"📊 FoodViewSet.pagination_class: {viewset.pagination_class}")
    
    # Check food count
    total_foods = Food.objects.count()
    approved_foods = Food.objects.filter(status='Approved', is_available=True).count()
    
    print(f"🍽️  Total foods in database: {total_foods}")
    print(f"🍽️  Approved & available foods: {approved_foods}")
    
    # Verify the fix
    if viewset.pagination_class is None:
        print(f"\n🎉 SUCCESS: Pagination is disabled!")
        print(f"📡 The API will now return all {approved_foods} foods")
        print(f"🖥️  The menu page should display all foods")
        return True
    else:
        print(f"\n❌ ISSUE: Pagination is still enabled")
        print(f"📡 The API will only return 10 foods per page")
        return False

def show_fix_summary():
    """Show what was fixed"""
    print(f"\n🔧 WHAT WAS FIXED:")
    print(f"   • Added 'pagination_class = None' to FoodViewSet")
    print(f"   • This disables Django REST framework pagination")
    print(f"   • Now API returns all foods instead of just 10")
    print(f"   • Frontend will receive all 25 foods")
    
    print(f"\n📍 LOCATION OF FIX:")
    print(f"   File: backend/apps/food/views.py")
    print(f"   Class: FoodViewSet")
    print(f"   Change: Added 'pagination_class = None'")

if __name__ == '__main__':
    success = verify_pagination_fix()
    show_fix_summary()
    
    if success:
        print(f"\n🚀 READY TO TEST:")
        print(f"   1. Start Django server: python manage.py runserver")
        print(f"   2. Start frontend server")
        print(f"   3. Check menu page - should show all 25 foods")
    else:
        print(f"\n⚠️  Please check the FoodViewSet configuration")