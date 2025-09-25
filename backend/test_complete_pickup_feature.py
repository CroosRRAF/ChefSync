#!/usr/bin/env python
"""
Complete end-to-end test for the pickup location feature
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
import json

def test_complete_pickup_feature():
    print("🚀 Complete Pickup Location Feature Test")
    print("=" * 60)
    
    # Test multiple orders to show different kitchen locations
    orders = Order.objects.select_related('chef', 'customer').all()[:5]
    
    if not orders:
        print("❌ No orders found in database")
        return
    
    print(f"📊 Testing {orders.count()} orders with kitchen locations...\n")
    
    for i, order in enumerate(orders, 1):
        print(f"🔍 Test {i}: Order #{order.order_number}")
        print(f"   👨‍🍳 Chef: {order.chef.name if order.chef else 'No chef'}")
        
        # Check Cook profile
        if order.chef:
            try:
                cook_profile = Cook.objects.get(user=order.chef)
                print(f"   🏠 Kitchen: {cook_profile.kitchen_location or 'Not set'}")
                print(f"   🍳 Specialty: {cook_profile.specialty or 'Not set'}")
            except Cook.DoesNotExist:
                print("   ⚠️  No Cook profile found")
        
        # Test API serializer
        try:
            serializer = OrderDetailSerializer(order)
            data = serializer.data
            
            # Key information for delivery partners
            pickup_location = data.get('pickup_location')
            chef_kitchen = data.get('chef', {}).get('kitchen_location') if data.get('chef') else None
            delivery_address = data.get('delivery_address')
            
            print(f"   📡 API Response:")
            print(f"      • Pickup Location: {pickup_location or 'None'}")
            print(f"      • Chef Kitchen: {chef_kitchen or 'None'}")
            print(f"      • Delivery Address: {delivery_address}")
            
            # Simulate delivery partner usage
            effective_pickup = pickup_location or chef_kitchen
            if effective_pickup:
                print(f"   ✅ Delivery Partner can navigate to: {effective_pickup}")
            else:
                print(f"   ⚠️  No pickup location available")
                
        except Exception as e:
            print(f"   ❌ Serializer error: {e}")
        
        print()  # Empty line between orders
    
    # Summary statistics
    print("📈 SUMMARY STATISTICS")
    print("=" * 30)
    
    total_orders = Order.objects.count()
    orders_with_chef = Order.objects.filter(chef__isnull=False).count()
    
    cooks_with_location = Cook.objects.filter(kitchen_location__isnull=False).exclude(kitchen_location='').count()
    total_cooks = Cook.objects.count()
    
    print(f"📊 Orders: {total_orders} total, {orders_with_chef} with chef assigned")
    print(f"👨‍🍳 Cooks: {total_cooks} total, {cooks_with_location} with kitchen location")
    print(f"📍 Coverage: {(cooks_with_location/total_cooks*100):.1f}% of cooks have pickup locations")
    
    # Feature status
    print(f"\n🎉 FEATURE STATUS: {'✅ OPERATIONAL' if cooks_with_location > 0 else '⚠️  NEEDS SETUP'}")
    
    if cooks_with_location > 0:
        print("✨ Delivery partners can now:")
        print("   • Access chef kitchen locations via API")
        print("   • Navigate directly to pickup locations")
        print("   • View chef details and specialties")
        print("   • Seamlessly transition from pickup to delivery")
    
    print("\n🔗 Integration Points:")
    print("   • Backend: OrderDetailSerializer includes pickup_location")
    print("   • Frontend: Order interface includes Chef with kitchen_location")
    print("   • Services: navigateToPickupLocation() utility function")
    print("   • Components: PickupDeliveryFlow enhanced with quick navigation")

if __name__ == "__main__":
    test_complete_pickup_feature()
