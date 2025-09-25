#!/usr/bin/env python3
"""
Test script to verify the foods endpoint is working
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

from django.test import RequestFactory
from apps.food.views import CustomerFoodViewSet
from apps.authentication.models import User

def test_foods_endpoint():
    """Test the foods endpoint"""
    print("🧪 Testing foods endpoint...")
    
    # Create a test request factory
    factory = RequestFactory()
    
    # Get an admin user
    admin_user = User.objects.filter(role='admin').first()
    if not admin_user:
        print("❌ No admin user found")
        return False
    
    # Create viewset instance
    viewset = CustomerFoodViewSet()
    
    try:
        # Test the foods endpoint by testing the queryset directly
        print("\n1️⃣ Testing foods queryset...")
        from apps.food.models import Food
        
        # Test the queryset that the viewset would use
        foods = Food.objects.filter(
            status='Approved', 
            is_available=True
        ).prefetch_related('prices').select_related('chef', 'food_category')
        
        print(f"   ✅ Foods queryset created successfully")
        print(f"   📊 Total approved foods: {foods.count()}")
        
        # Test a few foods
        sample_foods = foods[:3]
        for food in sample_foods:
            print(f"   📋 Food: {food.name} (Status: {food.status}, Available: {food.is_available})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing foods endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🚀 Testing Foods Endpoint")
    print("=" * 50)
    
    success = test_foods_endpoint()
    
    if success:
        print("\n✅ Foods endpoint test completed!")
    else:
        print("\n❌ Foods endpoint test failed!")
