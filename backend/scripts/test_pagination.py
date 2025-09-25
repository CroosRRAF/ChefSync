#!/usr/bin/env python3
"""
Direct test of FoodViewSet to verify pagination is disabled
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

def test_food_viewset_pagination():
    """Test FoodViewSet pagination settings"""
    print("🧪 TESTING FOODVIEWSET PAGINATION SETTINGS")
    print("=" * 50)
    
    # Check the FoodViewSet class directly
    viewset = FoodViewSet()
    
    print("🔍 FoodViewSet Configuration:")
    print(f"   pagination_class: {viewset.pagination_class}")
    
    # Check queryset
    queryset = viewset.get_queryset()
    food_count = queryset.count()
    print(f"   queryset count: {food_count}")
    
    # Check if pagination_class is None
    if viewset.pagination_class is None:
        print("   ✅ SUCCESS: pagination_class is None (disabled)")
    else:
        print(f"   ⚠️  pagination_class is set to: {viewset.pagination_class}")
    
    # Simulate what the API would return
    print(f"\n📊 Database Check:")
    total_foods = Food.objects.count()
    approved_foods = Food.objects.filter(status='Approved', is_available=True).count()
    print(f"   Total foods in DB: {total_foods}")
    print(f"   Approved & Available: {approved_foods}")
    
    # Check REST framework settings
    from django.conf import settings
    rest_settings = getattr(settings, 'REST_FRAMEWORK', {})
    default_pagination = rest_settings.get('DEFAULT_PAGINATION_CLASS')
    page_size = rest_settings.get('PAGE_SIZE')
    
    print(f"\n⚙️  REST Framework Settings:")
    print(f"   DEFAULT_PAGINATION_CLASS: {default_pagination}")
    print(f"   PAGE_SIZE: {page_size}")
    
    # Test the viewset behavior
    print(f"\n🎯 Expected Result:")
    if viewset.pagination_class is None:
        print(f"   With pagination disabled: API should return all {approved_foods} foods")
    else:
        print(f"   With pagination enabled: API would return {min(page_size or 10, approved_foods)} foods per page")
    
    print(f"\n" + "=" * 50)
    
    if viewset.pagination_class is None and approved_foods >= 25:
        print(f"🎉 SUCCESS: Pagination is disabled and we have {approved_foods} foods!")
        print(f"   The menu page should now display all foods.")
    elif viewset.pagination_class is None:
        print(f"⚠️  Pagination is disabled but only {approved_foods} foods found.")
    else:
        print(f"❌ Pagination is still enabled. The menu will only show {page_size or 10} foods.")
    
    return viewset.pagination_class is None

if __name__ == '__main__':
    test_food_viewset_pagination()