#!/usr/bin/env python
"""
Test script to verify that pickup location (kitchen_location) is available in order data
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.orders.models import Order
from apps.orders.serializers import OrderDetailSerializer
from apps.authentication.models import Cook, User

def test_pickup_location():
    print("🧪 Testing pickup location feature for delivery partners...")
    print("=" * 60)
    
    # Get a sample order
    order = Order.objects.first()
    if not order:
        print("❌ No orders found in database")
        return
    
    print(f"📋 Testing with Order: {order.order_number}")
    print(f"🧑‍🍳 Chef: {order.chef.name if order.chef else 'No chef assigned'}")
    
    # Check if chef has a Cook profile with kitchen_location
    if order.chef:
        try:
            cook_profile = Cook.objects.get(user=order.chef)
            print(f"🏠 Chef's kitchen location: {cook_profile.kitchen_location or 'Not set'}")
        except Cook.DoesNotExist:
            print("⚠️  Chef doesn't have a Cook profile")
    
    # Test the serializer
    try:
        serializer = OrderDetailSerializer(order)
        data = serializer.data
        
        print("\n📤 API Response includes:")
        print(f"   - Order ID: {data.get('id')}")
        print(f"   - Order Number: {data.get('order_number')}")
        print(f"   - Delivery Address: {data.get('delivery_address')}")
        print(f"   - Pickup Location: {data.get('pickup_location')}")
        
        # Check chef data
        if 'chef' in data and data['chef']:
            chef_data = data['chef']
            print(f"\n👨‍🍳 Chef Details in API:")
            print(f"   - Name: {chef_data.get('name')}")
            print(f"   - Kitchen Location: {chef_data.get('kitchen_location')}")
            print(f"   - Specialty: {chef_data.get('specialty')}")
        
        # Final assessment
        pickup_location = data.get('pickup_location')
        chef_kitchen = data.get('chef', {}).get('kitchen_location') if data.get('chef') else None
        
        if pickup_location or chef_kitchen:
            print(f"\n✅ SUCCESS! Delivery partners can now access pickup location:")
            print(f"   - Via order.pickup_location: {pickup_location}")
            print(f"   - Via order.chef.kitchen_location: {chef_kitchen}")
        else:
            print(f"\n⚠️  Kitchen location not available - chef needs to update their profile")
            
    except Exception as e:
        print(f"❌ Serializer error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pickup_location()
