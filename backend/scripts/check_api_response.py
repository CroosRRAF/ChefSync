#!/usr/bin/env python3
"""
Check Food API response from Django context
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

from apps.food.models import Food
from apps.food.serializers import FoodSerializer

def check_food_api_response():
    """Check what the API would return"""
    print("🧪 CHECKING FOOD API RESPONSE FROM DJANGO")
    print("=" * 50)
    
    try:
        # Check database directly
        foods_in_db = Food.objects.filter(status='Approved', is_available=True).count()
        print(f"📊 Foods in database: {foods_in_db}")
        
        # Check what the serializer would return
        foods_queryset = Food.objects.filter(status='Approved', is_available=True)
        foods_list = list(foods_queryset)
        
        print(f"🍽️  Foods to serialize: {len(foods_list)}")
        
        # Show sample foods
        print(f"\n📝 Sample foods:")
        for i, food in enumerate(foods_list[:10]):
            print(f"  {i+1}. {food.name} (ID: {food.food_id}) - Status: {food.status}")
        
        if len(foods_list) > 10:
            print(f"  ... and {len(foods_list) - 10} more")
        
        # Test serialization of first 5 foods
        print(f"\n🔄 Testing serialization...")
        sample_foods = foods_list[:5]
        serializer = FoodSerializer(sample_foods, many=True)
        serialized_data = serializer.data
        
        print(f"✅ Serialized {len(serialized_data)} foods successfully")
        
        # Show serialized sample
        if serialized_data:
            sample_food = serialized_data[0]
            print(f"\n📋 Sample serialized food:")
            print(f"  Name: {sample_food.get('name')}")
            print(f"  ID: {sample_food.get('food_id')}")
            print(f"  Available: {sample_food.get('is_available')}")
            print(f"  Status: {sample_food.get('status', 'N/A')}")
            print(f"  Images: {len(sample_food.get('images', []))}")
        
        print(f"\n" + "=" * 50)
        print(f"✅ Django API check completed successfully!")
        print(f"📊 Expected API response: {len(foods_list)} foods")
        
        if len(foods_list) >= 25:
            print(f"🎉 SUCCESS: Found {len(foods_list)} foods (>=25)")
        else:
            print(f"⚠️  WARNING: Only found {len(foods_list)} foods")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_food_api_response()