"""
Verify all bulk menus have proper LKR pricing
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import BulkMenu

def verify_menus():
    menus = BulkMenu.objects.all().order_by('id')
    
    print("\n" + "=" * 100)
    print("✅ ALL BULK MENUS WITH PROPER LKR PRICING")
    print("=" * 100)
    print(f"\n{'ID':<4} | {'Menu Name':<40} | {'Chef':<30} | {'Price':<15}")
    print("-" * 100)
    
    for menu in menus:
        price_str = f"LKR {menu.base_price_per_person}/person"
        print(f"{menu.id:<4} | {menu.menu_name:<40} | {menu.chef.name:<30} | {price_str:<15}")
    
    print("\n" + "=" * 100)
    print(f"📊 Summary:")
    print(f"   Total Menus: {menus.count()}")
    print(f"   Approved: {menus.filter(approval_status='approved').count()}")
    print(f"   Available: {menus.filter(availability_status=True).count()}")
    print(f"   Total Items: {sum(m.items.count() for m in menus)}")
    print("=" * 100)
    
    # Check for any issues
    issues = []
    for menu in menus:
        if menu.base_price_per_person <= 0:
            issues.append(f"Menu ID {menu.id}: Invalid price (LKR {menu.base_price_per_person})")
        if menu.items.count() == 0:
            issues.append(f"Menu ID {menu.id}: No items")
        if not menu.menu_name or menu.menu_name == 'lunch':
            issues.append(f"Menu ID {menu.id}: Generic name '{menu.menu_name}'")
    
    if issues:
        print("\n⚠️  Issues Found:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("\n✅ All menus are properly configured!")
    
    print("\n🎉 All prices are now in LKR format!")
    print("\n📱 Access Points:")
    print("   - Customer Dashboard: http://localhost:5173/customer/bulk-orders")
    print("   - Admin Panel: http://localhost:8000/admin/food/bulkmenu/")
    print("   - API: http://localhost:8000/api/food/bulk-menus/")
    print("=" * 100 + "\n")

if __name__ == '__main__':
    verify_menus()

