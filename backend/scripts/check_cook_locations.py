"""
Script to check and add kitchen locations for cooks
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from apps.users.models import Address, KitchenLocation
from apps.food.models import FoodPrice
from decimal import Decimal

def check_and_create_kitchen_locations():
    """Check which cooks have food prices but no kitchen location"""
    
    # Get all unique cook IDs from FoodPrice
    cook_ids = FoodPrice.objects.values_list('cook_id', flat=True).distinct()
    
    print(f"\n{'='*60}")
    print(f"Found {len(cook_ids)} cooks with food prices")
    print(f"{'='*60}\n")
    
    cooks_without_kitchen = []
    cooks_with_kitchen = []
    
    for cook_id in cook_ids:
        try:
            user = User.objects.get(user_id=cook_id)
            
            # Check if cook has a kitchen address
            kitchen_address = Address.objects.filter(
                user=user,
                address_type='kitchen',
                is_active=True
            ).first()
            
            if not kitchen_address:
                cooks_without_kitchen.append(user)
                print(f"[X] Cook {user.user_id} ({user.name}) - NO kitchen address")
            elif not kitchen_address.latitude or not kitchen_address.longitude:
                cooks_without_kitchen.append(user)
                print(f"[!] Cook {user.user_id} ({user.name}) - Kitchen address exists but missing coordinates")
            else:
                cooks_with_kitchen.append(user)
                print(f"[OK] Cook {user.user_id} ({user.name}) - Kitchen location: ({kitchen_address.latitude}, {kitchen_address.longitude})")
                
        except User.DoesNotExist:
            print(f"[X] Cook ID {cook_id} not found in Users table")
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Cooks WITH kitchen locations: {len(cooks_with_kitchen)}")
    print(f"  Cooks WITHOUT kitchen locations: {len(cooks_without_kitchen)}")
    print(f"{'='*60}\n")
    
    if cooks_without_kitchen:
        print("\n[+] Creating default kitchen locations for cooks without addresses...\n")
        
        # Default locations in Jaffna, Sri Lanka (you can adjust these)
        default_locations = [
            {'lat': 9.6615, 'lng': 80.0255, 'area': 'Jaffna Town'},
            {'lat': 9.6701, 'lng': 80.0180, 'area': 'Nallur'},
            {'lat': 9.6503, 'lng': 80.0340, 'area': 'Chundikuli'},
            {'lat': 9.6800, 'lng': 80.0100, 'area': 'Kopay'},
            {'lat': 9.6400, 'lng': 80.0200, 'area': 'Vannarpannai'},
        ]
        
        for idx, cook in enumerate(cooks_without_kitchen):
            location = default_locations[idx % len(default_locations)]
            
            # Create or update kitchen address
            kitchen_address, created = Address.objects.update_or_create(
                user=cook,
                address_type='kitchen',
                defaults={
                    'full_address': f"{location['area']}, Jaffna, Sri Lanka",
                    'street_address': f"Kitchen Street, {location['area']}",
                    'city': 'Jaffna',
                    'state': 'Northern Province',
                    'postal_code': '40000',
                    'country': 'Sri Lanka',
                    'latitude': Decimal(str(location['lat'])),
                    'longitude': Decimal(str(location['lng'])),
                    'is_default': True,
                    'is_active': True
                }
            )
            
            if created:
                print(f"[OK] Created kitchen address for Cook {cook.user_id} ({cook.name}) at {location['area']}")
                
                # Create KitchenLocation details
                KitchenLocation.objects.update_or_create(
                    address=kitchen_address,
                    defaults={
                        'kitchen_name': f"{cook.name}'s Kitchen",
                        'kitchen_type': 'home',
                        'contact_number': cook.phone_no or '+94771234567',
                        'operating_hours': {
                            'monday': '9:00-21:00',
                            'tuesday': '9:00-21:00',
                            'wednesday': '9:00-21:00',
                            'thursday': '9:00-21:00',
                            'friday': '9:00-21:00',
                            'saturday': '9:00-21:00',
                            'sunday': '9:00-21:00'
                        },
                        'max_orders_per_day': 50,
                        'delivery_radius_km': 10,
                        'is_verified': True
                    }
                )
                print(f"   └─ Kitchen details created")
            else:
                print(f"[OK] Updated kitchen address for Cook {cook.user_id} ({cook.name}) at {location['area']}")
    
    print(f"\n{'='*60}")
    print(f"Kitchen location setup complete!")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    check_and_create_kitchen_locations()

