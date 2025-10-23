"""
Script to add realistic bulk menus with images for existing cooks
Run: python manage.py shell < scripts/add_bulk_menus_with_images.py
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.food.models import BulkMenu, BulkMenuItem
from decimal import Decimal
import cloudinary.uploader

User = get_user_model()

# Sample bulk menu data with diverse cuisines
BULK_MENUS_DATA = [
    {
        'chef_id': 5,  # Chef Nilanthi Tharmalingam (user_id)
        'menus': [
            {
                'meal_type': 'lunch',
                'menu_name': 'Traditional Jaffna Feast',
                'description': 'Authentic Jaffna Tamil cuisine perfect for weddings and celebrations. Features traditional recipes passed down through generations with the perfect balance of spices.',
                'base_price_per_person': Decimal('450.00'),
                'min_persons': 50,
                'max_persons': 500,
                'advance_notice_hours': 48,
                'image_url': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',  # Indian thali
                'items': [
                    {'name': 'Steamed Rice', 'description': 'Premium basmati rice', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Jaffna Crab Curry', 'description': 'Signature crab curry with aromatic spices', 'spice_level': 'hot'},
                    {'name': 'Mutton Varuval', 'description': 'Dry mutton with traditional spices', 'spice_level': 'medium'},
                    {'name': 'Brinjal Moju', 'description': 'Sweet and tangy eggplant pickle', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Coconut Sambol', 'description': 'Fresh coconut chutney', 'is_vegetarian': True, 'spice_level': 'hot'},
                    {'name': 'Papadam', 'description': 'Crispy lentil crackers', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Curd', 'description': 'Fresh homemade yogurt', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Watalappan', 'description': 'Traditional coconut pudding', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Additional Prawn Curry', 'description': 'Extra prawn curry for seafood lovers', 'is_optional': True, 'extra_cost': Decimal('100.00'), 'spice_level': 'hot'},
                ]
            },
            {
                'meal_type': 'dinner',
                'menu_name': 'Jaffna Wedding Special',
                'description': 'Grand wedding feast with premium seafood and authentic Jaffna flavors. Includes our signature crab and prawn preparations.',
                'base_price_per_person': Decimal('650.00'),
                'min_persons': 100,
                'max_persons': 1000,
                'advance_notice_hours': 72,
                'image_url': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',  # Wedding feast
                'items': [
                    {'name': 'Biryani Rice', 'description': 'Fragrant basmati biryani', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Jaffna Crab Curry (Premium)', 'description': 'Large crabs in rich curry', 'spice_level': 'hot'},
                    {'name': 'Prawn Masala', 'description': 'Jumbo prawns in spicy masala', 'spice_level': 'hot'},
                    {'name': 'Chicken 65', 'description': 'Spicy fried chicken appetizer', 'spice_level': 'very_hot'},
                    {'name': 'Paneer Butter Masala', 'description': 'Creamy vegetarian option', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Garlic Naan', 'description': 'Fresh tandoor naan', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Raita', 'description': 'Cucumber yogurt', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Gulab Jamun', 'description': 'Sweet milk dumplings', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Ice Cream', 'description': 'Assorted flavors', 'is_vegetarian': True, 'spice_level': 'mild'},
                ]
            }
        ]
    },
    {
        'chef_id': 6,  # Chef Sutharsiny Kanagarajah
        'menus': [
            {
                'meal_type': 'breakfast',
                'menu_name': 'South Indian Breakfast Bonanza',
                'description': 'Complete South Indian breakfast spread perfect for morning events and corporate gatherings. Fresh, healthy, and delicious.',
                'base_price_per_person': Decimal('200.00'),
                'min_persons': 20,
                'max_persons': 200,
                'advance_notice_hours': 12,
                'image_url': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800',  # South Indian breakfast
                'items': [
                    {'name': 'Idli (4 pieces)', 'description': 'Steamed rice cakes', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Dosa (2 pieces)', 'description': 'Crispy rice crepes', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Vada (2 pieces)', 'description': 'Crispy lentil donuts', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Sambar', 'description': 'Lentil vegetable stew', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'medium'},
                    {'name': 'Coconut Chutney', 'description': 'Fresh coconut chutney', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Tomato Chutney', 'description': 'Tangy tomato chutney', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'medium'},
                    {'name': 'Filter Coffee', 'description': 'South Indian filter coffee', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Masala Dosa', 'description': 'Dosa with potato filling', 'is_optional': True, 'extra_cost': Decimal('50.00'), 'is_vegetarian': True, 'spice_level': 'medium'},
                ]
            },
            {
                'meal_type': 'snacks',
                'menu_name': 'Evening Snacks Platter',
                'description': 'Perfect for evening events, tea parties, and casual gatherings. A mix of savory and sweet treats.',
                'base_price_per_person': Decimal('150.00'),
                'min_persons': 15,
                'max_persons': 150,
                'advance_notice_hours': 6,
                'image_url': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',  # Indian snacks
                'items': [
                    {'name': 'Samosas (3 pieces)', 'description': 'Crispy vegetable samosas', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Pakoras', 'description': 'Mixed vegetable fritters', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Murukku', 'description': 'Crunchy rice spirals', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Bajji', 'description': 'Banana or chili fritters', 'is_vegetarian': True, 'spice_level': 'hot'},
                    {'name': 'Mint Chutney', 'description': 'Fresh mint dip', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Tamarind Chutney', 'description': 'Sweet and tangy', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Masala Tea', 'description': 'Spiced Indian tea', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Assorted Sweets', 'description': 'Mini laddoos and mysore pak', 'is_optional': True, 'extra_cost': Decimal('40.00'), 'is_vegetarian': True, 'spice_level': 'mild'},
                ]
            }
        ]
    },
    {
        'chef_id': 7,  # Chef Aravinth Yogarajah
        'menus': [
            {
                'meal_type': 'lunch',
                'menu_name': 'Corporate Executive Lunch',
                'description': 'Professional lunch menu for corporate events and business meetings. Balanced, elegant, and satisfying. Perfect for office parties and client meetings.',
                'base_price_per_person': Decimal('350.00'),
                'min_persons': 25,
                'max_persons': 250,
                'advance_notice_hours': 24,
                'image_url': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',  # Elegant meal
                'items': [
                    {'name': 'Garden Fresh Salad', 'description': 'Mixed greens with vinaigrette', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Vegetable Rice', 'description': 'Flavored rice with vegetables', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Grilled Chicken', 'description': 'Herb marinated grilled chicken', 'spice_level': 'mild'},
                    {'name': 'Dal Tadka', 'description': 'Tempered yellow lentils', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Mix Vegetable Curry', 'description': 'Seasonal vegetables in mild curry', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Chapati (3 pieces)', 'description': 'Whole wheat flatbread', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Pickle & Papad', 'description': 'Indian condiments', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Fruit Salad', 'description': 'Fresh seasonal fruits', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Fish Fry', 'description': 'Crispy fried fish', 'is_optional': True, 'extra_cost': Decimal('80.00'), 'spice_level': 'medium'},
                ]
            },
            {
                'meal_type': 'dinner',
                'menu_name': 'Premium North Indian Spread',
                'description': 'Rich and flavorful North Indian cuisine for special occasions. Features tandoori specialties and creamy curries.',
                'base_price_per_person': Decimal('550.00'),
                'min_persons': 30,
                'max_persons': 300,
                'advance_notice_hours': 36,
                'image_url': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800',  # North Indian food
                'items': [
                    {'name': 'Tandoori Chicken', 'description': 'Clay oven roasted chicken', 'spice_level': 'hot'},
                    {'name': 'Butter Chicken', 'description': 'Creamy tomato chicken curry', 'spice_level': 'medium'},
                    {'name': 'Paneer Tikka Masala', 'description': 'Grilled cottage cheese in rich gravy', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Dal Makhani', 'description': 'Creamy black lentils', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Jeera Rice', 'description': 'Cumin flavored rice', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Garlic Naan', 'description': 'Tandoor naan with garlic', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Raita', 'description': 'Yogurt with cucumber', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Kheer', 'description': 'Rice pudding', 'is_vegetarian': True, 'spice_level': 'mild'},
                ]
            }
        ]
    },
    {
        'chef_id': 8,  # Chef Dharshan Rajadurai
        'menus': [
            {
                'meal_type': 'lunch',
                'menu_name': 'Healthy Vegetarian Feast',
                'description': 'Complete vegetarian menu with nutritious and delicious options. Perfect for health-conscious groups and vegetarian events.',
                'base_price_per_person': Decimal('300.00'),
                'min_persons': 20,
                'max_persons': 300,
                'advance_notice_hours': 18,
                'image_url': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',  # Vegetarian food
                'items': [
                    {'name': 'Brown Rice', 'description': 'Healthy whole grain rice', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Quinoa Salad', 'description': 'Protein-rich quinoa with vegetables', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Paneer Curry', 'description': 'Cottage cheese in tomato gravy', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Chickpea Curry', 'description': 'Protein-rich chickpea masala', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'medium'},
                    {'name': 'Vegetable Stir Fry', 'description': 'Fresh seasonal vegetables', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Multigrain Roti (3 pieces)', 'description': 'Healthy flatbread', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Raita', 'description': 'Probiotic yogurt dip', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Fresh Fruit', 'description': 'Seasonal fruit bowl', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Tofu Tikka', 'description': 'Grilled marinated tofu', 'is_optional': True, 'extra_cost': Decimal('60.00'), 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'medium'},
                ]
            },
            {
                'meal_type': 'dinner',
                'menu_name': 'Pan-Asian Delight',
                'description': 'Fusion Asian cuisine with flavors from across the continent. Modern and exciting menu for contemporary events.',
                'base_price_per_person': Decimal('480.00'),
                'min_persons': 30,
                'max_persons': 250,
                'advance_notice_hours': 24,
                'image_url': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800',  # Asian food
                'items': [
                    {'name': 'Vegetable Spring Rolls', 'description': 'Crispy spring rolls', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Chicken Manchurian', 'description': 'Indo-Chinese chicken', 'spice_level': 'hot'},
                    {'name': 'Hakka Noodles', 'description': 'Stir-fried noodles with vegetables', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Fried Rice', 'description': 'Mixed vegetable fried rice', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Sweet and Sour Vegetables', 'description': 'Tangy vegetable dish', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Chili Paneer', 'description': 'Spicy cottage cheese', 'is_vegetarian': True, 'spice_level': 'hot'},
                    {'name': 'Soy Sauce', 'description': 'Condiments', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Lychee with Ice Cream', 'description': 'Tropical dessert', 'is_vegetarian': True, 'spice_level': 'mild'},
                ]
            }
        ]
    },
    {
        'chef_id': 9,  # Chef Poornachandran Sivakumar
        'menus': [
            {
                'meal_type': 'lunch',
                'menu_name': 'Sri Lankan Rice & Curry',
                'description': 'Authentic Sri Lankan home-style rice and curry spread. Multiple curries with traditional accompaniments.',
                'base_price_per_person': Decimal('320.00'),
                'min_persons': 25,
                'max_persons': 300,
                'advance_notice_hours': 24,
                'image_url': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',  # Rice and curry
                'items': [
                    {'name': 'White Rice', 'description': 'Premium quality rice', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Fish Curry', 'description': 'Traditional Sri Lankan fish curry', 'spice_level': 'hot'},
                    {'name': 'Chicken Curry', 'description': 'Sri Lankan style chicken', 'spice_level': 'medium'},
                    {'name': 'Dhal Curry', 'description': 'Red lentil curry', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'medium'},
                    {'name': 'Potato Curry', 'description': 'Spiced potato curry', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'medium'},
                    {'name': 'Green Beans Curry', 'description': 'Fresh beans with coconut', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Pol Sambol', 'description': 'Coconut chili sambol', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'very_hot'},
                    {'name': 'Papadam', 'description': 'Crispy papadam', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Wattalapan', 'description': 'Coconut custard pudding', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Crab Curry', 'description': 'Premium crab curry', 'is_optional': True, 'extra_cost': Decimal('120.00'), 'spice_level': 'hot'},
                ]
            }
        ]
    },
    {
        'chef_id': 10,  # Chef Tharsheni Balasingam
        'menus': [
            {
                'meal_type': 'breakfast',
                'menu_name': 'Continental Breakfast Buffet',
                'description': 'International breakfast spread perfect for hotels and corporate events. Includes both western and eastern options.',
                'base_price_per_person': Decimal('280.00'),
                'min_persons': 30,
                'max_persons': 300,
                'advance_notice_hours': 12,
                'image_url': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',  # Continental breakfast
                'items': [
                    {'name': 'Scrambled Eggs', 'description': 'Fluffy scrambled eggs', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Bacon', 'description': 'Crispy bacon strips', 'spice_level': 'mild'},
                    {'name': 'Hash Browns', 'description': 'Golden potato hash', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Pancakes', 'description': 'Pancakes with syrup', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Fresh Fruit Platter', 'description': 'Seasonal fruits', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Yogurt with Granola', 'description': 'Greek yogurt with granola', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Assorted Breads', 'description': 'Toast, croissants, muffins', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Coffee & Tea', 'description': 'Hot beverages', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Smoked Salmon', 'description': 'Premium salmon with cream cheese', 'is_optional': True, 'extra_cost': Decimal('150.00'), 'spice_level': 'mild'},
                ]
            },
            {
                'meal_type': 'snacks',
                'menu_name': 'International Finger Food',
                'description': 'Cocktail-style finger foods perfect for receptions and networking events. Mix of international flavors.',
                'base_price_per_person': Decimal('250.00'),
                'min_persons': 20,
                'max_persons': 200,
                'advance_notice_hours': 18,
                'image_url': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800',  # Finger food
                'items': [
                    {'name': 'Mini Sandwiches', 'description': 'Assorted club sandwiches', 'spice_level': 'mild'},
                    {'name': 'Cheese Platter', 'description': 'International cheese selection', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Vegetable Crudités', 'description': 'Fresh veggies with dip', 'is_vegetarian': True, 'is_vegan': True, 'spice_level': 'mild'},
                    {'name': 'Chicken Satay', 'description': 'Skewered chicken with peanut sauce', 'spice_level': 'medium'},
                    {'name': 'Spring Rolls', 'description': 'Vegetable spring rolls', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Stuffed Mushrooms', 'description': 'Cheese stuffed mushrooms', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Mini Quiches', 'description': 'Assorted quiche bites', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Brownie Bites', 'description': 'Chocolate brownies', 'is_vegetarian': True, 'spice_level': 'mild'},
                ]
            }
        ]
    },
    {
        'chef_id': 13,  # jeyachandran
        'menus': [
            {
                'meal_type': 'dinner',
                'menu_name': 'BBQ & Grill Party Pack',
                'description': 'Perfect for outdoor events and celebrations. Grilled specialties with international and local flavors.',
                'base_price_per_person': Decimal('580.00'),
                'min_persons': 40,
                'max_persons': 400,
                'advance_notice_hours': 48,
                'image_url': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',  # BBQ
                'items': [
                    {'name': 'Grilled Chicken', 'description': 'BBQ marinated chicken', 'spice_level': 'medium'},
                    {'name': 'Beef Steak', 'description': 'Grilled beef steaks', 'spice_level': 'mild'},
                    {'name': 'Grilled Fish', 'description': 'Fresh fish with herbs', 'spice_level': 'mild'},
                    {'name': 'Vegetable Skewers', 'description': 'Grilled vegetable kebabs', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Garlic Bread', 'description': 'Toasted garlic bread', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Coleslaw', 'description': 'Creamy coleslaw salad', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'Potato Wedges', 'description': 'Seasoned potato wedges', 'is_vegetarian': True, 'spice_level': 'mild'},
                    {'name': 'BBQ Sauce', 'description': 'House special sauce', 'is_vegetarian': True, 'spice_level': 'medium'},
                    {'name': 'Grilled Prawns', 'description': 'Jumbo prawns', 'is_optional': True, 'extra_cost': Decimal('150.00'), 'spice_level': 'medium'},
                ]
            }
        ]
    }
]

def add_bulk_menus():
    """Add bulk menus with images for existing cooks"""
    
    print("=" * 80)
    print("🍽️  ADDING REALISTIC BULK MENUS WITH IMAGES")
    print("=" * 80)
    
    total_menus_added = 0
    total_items_added = 0
    
    for chef_data in BULK_MENUS_DATA:
        chef_id = chef_data['chef_id']
        
        try:
            chef = User.objects.get(user_id=chef_id, role='cook')
            print(f"\n👨‍🍳 Processing Chef: {chef.name} (ID: {chef_id})")
            print("-" * 80)
            
            for menu_data in chef_data['menus']:
                # Create bulk menu
                bulk_menu = BulkMenu.objects.create(
                    chef=chef,
                    meal_type=menu_data['meal_type'],
                    menu_name=menu_data['menu_name'],
                    description=menu_data['description'],
                    base_price_per_person=menu_data['base_price_per_person'],
                    min_persons=menu_data['min_persons'],
                    max_persons=menu_data['max_persons'],
                    advance_notice_hours=menu_data['advance_notice_hours'],
                    availability_status=True,
                    approval_status='approved'  # Pre-approved for demo
                )
                
                # Add image URL (we'll use Unsplash for demo)
                if menu_data.get('image_url'):
                    # For demo, we'll store the URL directly
                    # In production, you'd upload to Cloudinary
                    bulk_menu.image = menu_data['image_url']
                    bulk_menu.save()
                
                print(f"  ✅ Created Menu: {menu_data['menu_name']}")
                print(f"     Meal Type: {menu_data['meal_type'].upper()}")
                print(f"     Price: LKR {menu_data['base_price_per_person']}/person")
                print(f"     Capacity: {menu_data['min_persons']}-{menu_data['max_persons']} persons")
                
                total_menus_added += 1
                
                # Add menu items
                for idx, item_data in enumerate(menu_data['items'], 1):
                    BulkMenuItem.objects.create(
                        bulk_menu=bulk_menu,
                        item_name=item_data['name'],
                        description=item_data.get('description', ''),
                        is_optional=item_data.get('is_optional', False),
                        extra_cost=item_data.get('extra_cost', Decimal('0.00')),
                        is_vegetarian=item_data.get('is_vegetarian', False),
                        is_vegan=item_data.get('is_vegan', False),
                        is_gluten_free=item_data.get('is_gluten_free', False),
                        spice_level=item_data.get('spice_level'),
                        sort_order=idx
                    )
                    total_items_added += 1
                
                print(f"     Items: {len(menu_data['items'])} items added")
                
        except User.DoesNotExist:
            print(f"  ❌ Chef with ID {chef_id} not found!")
            continue
        except Exception as e:
            print(f"  ❌ Error processing chef {chef_id}: {str(e)}")
            continue
    
    print("\n" + "=" * 80)
    print("✨ BULK MENU ADDITION COMPLETE!")
    print("=" * 80)
    print(f"📊 Statistics:")
    print(f"   - Total Menus Created: {total_menus_added}")
    print(f"   - Total Items Added: {total_items_added}")
    print(f"   - Chefs with Menus: {len(BULK_MENUS_DATA)}")
    print("=" * 80)
    print("\n🎉 All bulk menus have been successfully added to the database!")
    print("🔍 You can now view them in:")
    print("   - Admin Panel: /admin/food/bulkmenu/")
    print("   - Customer Dashboard: /customer/bulk-orders")
    print("   - API: /api/food/bulk-menus/")
    print("\n💡 Test the AI Search with queries like:")
    print("   - 'healthy vegetarian food for corporate event'")
    print("   - 'spicy Indian dinner for wedding'")
    print("   - 'breakfast for 50 people'")
    print("=" * 80)

if __name__ == '__main__':
    add_bulk_menus()

