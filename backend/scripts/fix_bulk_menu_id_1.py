"""
Fix bulk menu ID 1 with proper details
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.food.models import BulkMenu, BulkMenuItem
from decimal import Decimal

User = get_user_model()

def fix_bulk_menu_id_1():
    """Update bulk menu ID 1 with complete details"""
    
    print("=" * 80)
    print("🔧 FIXING BULK MENU ID 1")
    print("=" * 80)
    
    try:
        # Get the menu
        menu = BulkMenu.objects.get(id=1)
        print(f"\n📋 Found Menu ID 1: {menu.menu_name}")
        print(f"   Current Chef: {menu.chef.name}")
        print(f"   Current Price: LKR {menu.base_price_per_person}/person")
        
        # Delete existing items if any
        old_items = menu.items.all()
        if old_items.exists():
            print(f"\n🗑️  Deleting {old_items.count()} old items...")
            old_items.delete()
        
        # Update menu with proper details
        print("\n✏️  Updating menu details...")
        menu.meal_type = 'lunch'
        menu.menu_name = 'Traditional Home-Style Lunch'
        menu.description = 'Authentic home-cooked Sri Lankan lunch with multiple curries and rice. Perfect for family gatherings and traditional events. Comfort food at its best!'
        menu.base_price_per_person = Decimal('299.00')
        menu.min_persons = 20
        menu.max_persons = 200
        menu.advance_notice_hours = 24
        menu.availability_status = True
        menu.approval_status = 'approved'
        menu.image = 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800'
        menu.save()
        
        print(f"   ✅ Updated to: {menu.menu_name}")
        print(f"   ✅ Price: LKR {menu.base_price_per_person}/person")
        print(f"   ✅ Capacity: {menu.min_persons}-{menu.max_persons} persons")
        
        # Add proper menu items
        items_data = [
            {
                'name': 'Steamed White Rice',
                'description': 'Premium quality white rice',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'mild'
            },
            {
                'name': 'Chicken Curry',
                'description': 'Traditional Sri Lankan chicken curry',
                'spice_level': 'medium'
            },
            {
                'name': 'Fish Curry',
                'description': 'Fresh fish in spicy curry',
                'spice_level': 'hot'
            },
            {
                'name': 'Dal Curry',
                'description': 'Red lentil curry',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'medium'
            },
            {
                'name': 'Mixed Vegetable Curry',
                'description': 'Seasonal vegetables in coconut gravy',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'mild'
            },
            {
                'name': 'Potato Curry',
                'description': 'Spiced potato curry',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'medium'
            },
            {
                'name': 'Coconut Sambol',
                'description': 'Spicy coconut chutney',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'very_hot'
            },
            {
                'name': 'Papadam',
                'description': 'Crispy lentil crackers',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'mild'
            },
            {
                'name': 'Fresh Curd',
                'description': 'Homemade yogurt',
                'is_vegetarian': True,
                'spice_level': 'mild'
            },
            {
                'name': 'Seasonal Fruit',
                'description': 'Fresh tropical fruit',
                'is_vegetarian': True,
                'is_vegan': True,
                'spice_level': 'mild'
            },
            {
                'name': 'Additional Crab Curry',
                'description': 'Premium crab curry for seafood lovers',
                'is_optional': True,
                'extra_cost': Decimal('120.00'),
                'spice_level': 'hot'
            }
        ]
        
        print(f"\n📝 Adding {len(items_data)} menu items...")
        for idx, item_data in enumerate(items_data, 1):
            BulkMenuItem.objects.create(
                bulk_menu=menu,
                item_name=item_data['name'],
                description=item_data['description'],
                is_optional=item_data.get('is_optional', False),
                extra_cost=item_data.get('extra_cost', Decimal('0.00')),
                is_vegetarian=item_data.get('is_vegetarian', False),
                is_vegan=item_data.get('is_vegan', False),
                is_gluten_free=item_data.get('is_gluten_free', False),
                spice_level=item_data.get('spice_level'),
                sort_order=idx
            )
            optional = " (Optional +LKR " + str(item_data.get('extra_cost', 0)) + ")" if item_data.get('is_optional') else ""
            print(f"   ✅ {item_data['name']}{optional}")
        
        print("\n" + "=" * 80)
        print("✨ BULK MENU ID 1 FIXED SUCCESSFULLY!")
        print("=" * 80)
        print(f"\n📊 Final Details:")
        print(f"   Menu ID: 1")
        print(f"   Name: {menu.menu_name}")
        print(f"   Chef: {menu.chef.name}")
        print(f"   Price: LKR {menu.base_price_per_person}/person")
        print(f"   Meal Type: {menu.get_meal_type_display()}")
        print(f"   Items: {menu.items.count()} items")
        print(f"   Mandatory: {menu.items.filter(is_optional=False).count()}")
        print(f"   Optional: {menu.items.filter(is_optional=True).count()}")
        print(f"   Status: {menu.approval_status.upper()}")
        print("=" * 80)
        
        return True
        
    except BulkMenu.DoesNotExist:
        print("\n❌ ERROR: Bulk menu ID 1 not found!")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = fix_bulk_menu_id_1()
    if success:
        print("\n🎉 You can now view the updated menu at:")
        print("   - Customer Dashboard: /customer/bulk-orders")
        print("   - Admin Panel: /admin/food/bulkmenu/1/change/")
        print("   - API: /api/food/bulk-menus/1/")
    sys.exit(0 if success else 1)

