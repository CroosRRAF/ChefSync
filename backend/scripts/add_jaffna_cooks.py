#!/usr/bin/env python3
"""Seed six sample cooks with kitchens in the Jaffna District."""
import os
import sys
from pathlib import Path
from decimal import Decimal

import django
from django.db import transaction
from django.utils import timezone

# Ensure the backend package is importable when the script is executed directly
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.authentication.models import User, Cook  # noqa: E402  pylint: disable=wrong-import-position
from apps.users.models import (
    UserProfile,
    Address,
    KitchenLocation,
    ChefProfile,
)  # noqa: E402  pylint: disable=wrong-import-position
from apps.food.models import (  # noqa: E402  pylint: disable=wrong-import-position
    Cuisine,
    FoodCategory,
    Food,
    FoodPrice,
)


class JaffnaCookSeeder:
    """Utility to create a curated set of cooks based in the Jaffna District."""

    def __init__(self):
        self.cook_specs = [
            {
                "name": "Chef Nilanthi Tharmalingam",
                "email": "nilanthi.jaffna@chefsync.com",
                "phone": "+94761234560",
                "gender": "Female",
                "specialty": "Northern Sri Lankan Seafood",
                "experience_years": 12,
                "rating": Decimal("4.8"),
                "availability_hours": "07:00 AM - 09:00 PM",
                "kitchen_text": "Point Pedro Seafood Kitchen, Jaffna District",
                "chef_profile": {
                    "specialty_cuisines": ["Seafood", "Northern Sri Lankan"],
                    "bio": "Award-winning seafood specialist bringing fresh lagoon catches and coastal flavors to Point Pedro.",
                    "certifications": ["SLTB Food Handler Certification"],
                    "is_featured": True,
                    "total_orders": 240,
                    "total_reviews": 68,
                },
                "kitchen": {
                    "label": "Primary Kitchen",
                    "address_line1": "12 Beach Road",
                    "address_line2": "Point Pedro",
                    "landmark": "Near Point Pedro Harbour",
                    "city": "Point Pedro",
                    "state": "Northern Province",
                    "country": "Sri Lanka",
                    "pincode": "400001",
                    "latitude": Decimal("9.816700"),
                    "longitude": Decimal("80.233300"),
                    "kitchen_name": "Point Pedro Seafood Kitchen",
                    "kitchen_type": "commercial",
                    "has_parking": True,
                    "pickup_instructions": "Use the side entrance marked for ChefSync pickups.",
                    "delivery_radius_km": 18,
                },
            },
            {
                "name": "Chef Sutharsiny Kanagarajah",
                "email": "sutharsiny.nallur@chefsync.com",
                "phone": "+94761234561",
                "gender": "Female",
                "specialty": "Vegetarian Tamil Cuisine",
                "experience_years": 9,
                "rating": Decimal("4.6"),
                "availability_hours": "09:00 AM - 08:00 PM",
                "kitchen_text": "Nallur Greens Kitchen, Jaffna District",
                "chef_profile": {
                    "specialty_cuisines": ["Vegetarian Tamil", "Organic"],
                    "bio": "Plant-forward chef curating temple-inspired vegetarian feasts with organic produce.",
                    "certifications": ["Certified Vegan Chef Level 2"],
                    "is_featured": False,
                    "total_orders": 185,
                    "total_reviews": 52,
                },
                "kitchen": {
                    "label": "Temple View Kitchen",
                    "address_line1": "45 Kovil Lane",
                    "address_line2": "Nallur",
                    "landmark": "Opposite Nallur Kandaswamy Temple",
                    "city": "Nallur",
                    "state": "Northern Province",
                    "country": "Sri Lanka",
                    "pincode": "400002",
                    "latitude": Decimal("9.666700"),
                    "longitude": Decimal("80.023300"),
                    "kitchen_name": "Nallur Greens Kitchen",
                    "kitchen_type": "home",
                    "has_parking": False,
                    "pickup_instructions": "Ring the bell by the left gate and wait for staff.",
                    "delivery_radius_km": 12,
                },
            },
            {
                "name": "Chef Aravinth Yogarajah",
                "email": "aravinth.jaffna@chefsync.com",
                "phone": "+94761234562",
                "gender": "Male",
                "specialty": "Jaffna Crab Specialties",
                "experience_years": 15,
                "rating": Decimal("4.9"),
                "availability_hours": "11:00 AM - 10:00 PM",
                "kitchen_text": "Old Dutch Market Kitchen, Jaffna City",
                "chef_profile": {
                    "specialty_cuisines": ["Jaffna Crab", "Heritage Tamil"],
                    "bio": "Heritage chef celebrated for iconic Jaffna crab curries and market-fresh specials.",
                    "certifications": ["Sri Lanka Tourism Culinary Excellence"],
                    "is_featured": True,
                    "total_orders": 312,
                    "total_reviews": 95,
                },
                "kitchen": {
                    "label": "Market Kitchen",
                    "address_line1": "88 Old Market Street",
                    "address_line2": "Jaffna Town",
                    "landmark": "Beside Jaffna Dutch Fort",
                    "city": "Jaffna",
                    "state": "Northern Province",
                    "country": "Sri Lanka",
                    "pincode": "400003",
                    "latitude": Decimal("9.661500"),
                    "longitude": Decimal("80.025500"),
                    "kitchen_name": "Old Dutch Market Kitchen",
                    "kitchen_type": "restaurant",
                    "has_parking": True,
                    "pickup_instructions": "ChefSync pickup counter is to the right of the main entrance.",
                    "delivery_radius_km": 20,
                },
            },
            {
                "name": "Chef Dharshan Rajadurai",
                "email": "dharshan.karainagar@chefsync.com",
                "phone": "+94761234563",
                "gender": "Male",
                "specialty": "Lagoon Inspired Grill",
                "experience_years": 11,
                "rating": Decimal("4.7"),
                "availability_hours": "10:00 AM - 09:00 PM",
                "kitchen_text": "Karainagar Lagoon Kitchen, Jaffna District",
                "chef_profile": {
                    "specialty_cuisines": ["Grilled Seafood", "Lagoon Inspired"],
                    "bio": "Lagoon grill expert firing smoky platters with tropical spice rubs and coconut chutneys.",
                    "certifications": ["Open Fire Culinary Mastery"],
                    "is_featured": False,
                    "total_orders": 198,
                    "total_reviews": 61,
                },
                "kitchen": {
                    "label": "Lagoon Kitchen",
                    "address_line1": "6 Ferry Road",
                    "address_line2": "Karainagar",
                    "landmark": "Near Karainagar Jetty",
                    "city": "Karainagar",
                    "state": "Northern Province",
                    "country": "Sri Lanka",
                    "pincode": "400004",
                    "latitude": Decimal("9.683400"),
                    "longitude": Decimal("79.850000"),
                    "kitchen_name": "Karainagar Lagoon Kitchen",
                    "kitchen_type": "cloud_kitchen",
                    "has_parking": True,
                    "pickup_instructions": "Follow the ChefSync signage past the main gate.",
                    "delivery_radius_km": 22,
                },
            },
            {
                "name": "Chef Poornachandran Sivakumar",
                "email": "poornachandran.chavakachcheri@chefsync.com",
                "phone": "+94761234564",
                "gender": "Male",
                "specialty": "Spiced Curry Classics",
                "experience_years": 8,
                "rating": Decimal("4.5"),
                "availability_hours": "08:00 AM - 08:00 PM",
                "kitchen_text": "Chavakachcheri Spice House, Jaffna District",
                "chef_profile": {
                    "specialty_cuisines": ["Spice-Forward Curries", "Comfort Classics"],
                    "bio": "Spice maestro crafting slow-cooked curries layered with roasted masalas and heirloom recipes.",
                    "certifications": ["Regional Curry Championship Finalist"],
                    "is_featured": False,
                    "total_orders": 164,
                    "total_reviews": 47,
                },
                "kitchen": {
                    "label": "Spice House",
                    "address_line1": "102 Main Bazaar Road",
                    "address_line2": "Chavakachcheri",
                    "landmark": "Corner of Market Junction",
                    "city": "Chavakachcheri",
                    "state": "Northern Province",
                    "country": "Sri Lanka",
                    "pincode": "400005",
                    "latitude": Decimal("9.666700"),
                    "longitude": Decimal("80.166700"),
                    "kitchen_name": "Chavakachcheri Spice House",
                    "kitchen_type": "commercial",
                    "has_parking": False,
                    "pickup_instructions": "Parking available along Market Junction Road; call ahead for assistance.",
                    "delivery_radius_km": 14,
                },
            },
            {
                "name": "Chef Tharsheni Balasingam",
                "email": "tharsheni.vaddukoddai@chefsync.com",
                "phone": "+94761234565",
                "gender": "Female",
                "specialty": "Heritage Vegan Dishes",
                "experience_years": 7,
                "rating": Decimal("4.4"),
                "availability_hours": "07:30 AM - 07:30 PM",
                "kitchen_text": "Vaddukoddai Heritage Kitchen, Jaffna District",
                "chef_profile": {
                    "specialty_cuisines": ["Heritage Vegan", "Millet-Based"],
                    "bio": "Heritage vegan storyteller reimagining traditional recipes with millets and coastal greens.",
                    "certifications": ["Plant-Based Culinary Diploma"],
                    "is_featured": True,
                    "total_orders": 142,
                    "total_reviews": 39,
                },
                "kitchen": {
                    "label": "Heritage Kitchen",
                    "address_line1": "55 University Avenue",
                    "address_line2": "Vaddukoddai",
                    "landmark": "Opposite Jaffna University Campus",
                    "city": "Vaddukoddai",
                    "state": "Northern Province",
                    "country": "Sri Lanka",
                    "pincode": "400006",
                    "latitude": Decimal("9.733300"),
                    "longitude": Decimal("79.983300"),
                    "kitchen_name": "Vaddukoddai Heritage Kitchen",
                    "kitchen_type": "home",
                    "has_parking": False,
                    "pickup_instructions": "Use the rear entrance adjacent to the campus parking area.",
                    "delivery_radius_km": 10,
                },
            },
        ]

        self.food_specs = [
            {
                "name": "Jaffna Crab Curry",
                "chef_email": "aravinth.jaffna@chefsync.com",
                "category": "Heritage Curries",
                "description": "Signature lagoon crab simmered in roasted Jaffna spices, tamarind, and coconut milk.",
                "image": "https://images.unsplash.com/photo-1604908177730-16a119bb1610?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "lagoon crab",
                    "tamarind",
                    "roasted masala",
                    "coconut milk",
                    "curry leaves",
                ],
                "allergens": ["shellfish"],
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "spice_level": "hot",
                "preparation_time": 45,
                "calories": 540,
                "rating": Decimal("4.9"),
                "total_reviews": 112,
                "total_orders": 386,
                "is_featured": True,
                "prices": {
                    "Small": {"price": "12.50", "prep_time": 35},
                    "Medium": {"price": "16.50", "prep_time": 42},
                    "Large": {"price": "22.00", "prep_time": 50},
                },
            },
            {
                "name": "Spicy Lagoon Prawn Curry",
                "chef_email": "dharshan.karainagar@chefsync.com",
                "category": "Seafood Specials",
                "description": "Karainagar prawns tossed in chilli paste, coconut cream, and pandan for a fiery finish.",
                "image": "https://images.unsplash.com/photo-1608033226091-9bd87c684c0b?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "lagoon prawns",
                    "chilli paste",
                    "coconut cream",
                    "pandan",
                    "mustard seeds",
                ],
                "allergens": ["shellfish"],
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "spice_level": "very_hot",
                "preparation_time": 40,
                "calories": 510,
        "rating": Decimal("4.8"),
        "total_reviews": 87,
        "total_orders": 294,
                "is_featured": True,
                "prices": {
                    "Small": {"price": "11.00", "prep_time": 30},
                    "Medium": {"price": "15.25", "prep_time": 38},
                    "Large": {"price": "20.75", "prep_time": 45},
                },
            },
            {
                "name": "Odiyal Kool Seafood Stew",
                "chef_email": "nilanthi.jaffna@chefsync.com",
                "category": "Seafood Specials",
                "description": "Traditional Odiyal Kool with crab, cuttlefish, prawns, and root vegetables in a collagen-rich broth.",
                "image": "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "crab",
                    "cuttlefish",
                    "prawns",
                    "odiyal flour",
                    "root vegetables",
                ],
                "allergens": ["shellfish", "fish"],
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "spice_level": "medium",
                "preparation_time": 50,
                "calories": 480,
                "rating": Decimal("4.7"),
                "total_reviews": 76,
                "total_orders": 248,
                "is_featured": False,
                "prices": {
                    "Small": {"price": "9.75", "prep_time": 40},
                    "Medium": {"price": "13.75", "prep_time": 48},
                    "Large": {"price": "18.50", "prep_time": 55},
                },
            },
            {
                "name": "Nallur Saivam Feast Thali",
                "chef_email": "sutharsiny.nallur@chefsync.com",
                "category": "Plant-Based Plates",
                "description": "Temple-inspired vegan platter with beetroot poriyal, jackfruit curry, red rice, and chutneys.",
                "image": "https://images.unsplash.com/photo-1477629758821-0434482e7411?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "red rice",
                    "jackfruit",
                    "beetroot",
                    "pol sambol",
                    "coconut chutney",
                ],
                "allergens": ["coconut"],
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": True,
                "spice_level": "medium",
                "preparation_time": 35,
                "calories": 620,
                "rating": Decimal("4.6"),
                "total_reviews": 64,
                "total_orders": 215,
                "is_featured": True,
                "prices": {
                    "Small": {"price": "8.50", "prep_time": 25},
                    "Medium": {"price": "11.75", "prep_time": 32},
                    "Large": {"price": "15.00", "prep_time": 38},
                },
            },
            {
                "name": "Palmyrah Jaggery Appam",
                "chef_email": "tharsheni.vaddukoddai@chefsync.com",
                "category": "Desserts",
                "description": "Fermented rice appam drizzled with palmyrah treacle and topped with toasted coconut flakes.",
                "image": "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "rice batter",
                    "palmyrah jaggery",
                    "coconut milk",
                    "cardamom",
                    "toasted coconut",
                ],
                "allergens": ["coconut"],
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": True,
                "spice_level": "mild",
                "preparation_time": 20,
                "calories": 320,
                "rating": Decimal("4.5"),
                "total_reviews": 52,
                "total_orders": 168,
                "is_featured": False,
                "prices": {
                    "Small": {"price": "5.25", "prep_time": 15},
                    "Medium": {"price": "7.00", "prep_time": 18},
                    "Large": {"price": "9.50", "prep_time": 22},
                },
            },
            {
                "name": "Chavakachcheri Mutton Poriyal",
                "chef_email": "poornachandran.chavakachcheri@chefsync.com",
                "category": "Heritage Curries",
                "description": "Tender mutton pan-seared with black pepper, roasted coconut, and hand-ground masala.",
                "image": "https://images.unsplash.com/photo-1604908178059-4a2b50d73ec9?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "mutton",
                    "black pepper",
                    "roasted coconut",
                    "ginger",
                    "shallots",
                ],
                "allergens": [],
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "spice_level": "hot",
                "preparation_time": 55,
                "calories": 650,
                "rating": Decimal("4.7"),
                "total_reviews": 71,
                "total_orders": 232,
                "is_featured": False,
                "prices": {
                    "Small": {"price": "11.25", "prep_time": 40},
                    "Medium": {"price": "15.75", "prep_time": 50},
                    "Large": {"price": "21.00", "prep_time": 58},
                },
            },
            {
                "name": "Jaffna Fish Cutlet Platter",
                "chef_email": "aravinth.jaffna@chefsync.com",
                "category": "Street Eats",
                "description": "Golden fried fish cutlets filled with smoked tuna, potato, and curry leaves served with lime aioli.",
                "image": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "smoked tuna",
                    "potato",
                    "curry leaves",
                    "breadcrumbs",
                    "lime aioli",
                ],
                "allergens": ["fish", "gluten"],
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": False,
                "spice_level": "medium",
                "preparation_time": 30,
                "calories": 410,
                "rating": Decimal("4.6"),
                "total_reviews": 59,
                "total_orders": 205,
                "is_featured": False,
                "prices": {
                    "Small": {"price": "7.25", "prep_time": 25},
                    "Medium": {"price": "9.90", "prep_time": 28},
                    "Large": {"price": "12.50", "prep_time": 32},
                },
            },
            {
                "name": "Karainagar Grilled Reef Fish",
                "chef_email": "dharshan.karainagar@chefsync.com",
                "category": "Seafood Specials",
                "description": "Charcoal grilled reef fish brushed with tamarind glaze, served with green mango salad.",
                "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "reef fish",
                    "tamarind glaze",
                    "green mango",
                    "chilli flakes",
                    "coconut oil",
                ],
                "allergens": ["fish"],
                "is_vegetarian": False,
                "is_vegan": False,
                "is_gluten_free": True,
                "spice_level": "medium",
                "preparation_time": 35,
                "calories": 455,
                "rating": Decimal("4.7"),
                "total_reviews": 66,
                "total_orders": 221,
                "is_featured": True,
                "prices": {
                    "Small": {"price": "10.50", "prep_time": 28},
                    "Medium": {"price": "14.75", "prep_time": 33},
                    "Large": {"price": "19.95", "prep_time": 40},
                },
            },
            {
                "name": "Vaddukoddai Heritage Veg Kothu",
                "chef_email": "tharsheni.vaddukoddai@chefsync.com",
                "category": "Street Eats",
                "description": "Whole wheat godhamba roti tossed with tempered vegetables, millet tofu, and roasted masala.",
                "image": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "godhamba roti",
                    "millet tofu",
                    "carrot",
                    "cabbage",
                    "roasted masala",
                ],
                "allergens": ["gluten", "soy"],
                "is_vegetarian": True,
                "is_vegan": True,
                "is_gluten_free": False,
                "spice_level": "medium",
                "preparation_time": 25,
                "calories": 540,
                "rating": Decimal("4.4"),
                "total_reviews": 44,
                "total_orders": 156,
                "is_featured": False,
                "prices": {
                    "Small": {"price": "7.90", "prep_time": 18},
                    "Medium": {"price": "10.80", "prep_time": 22},
                    "Large": {"price": "13.60", "prep_time": 26},
                },
            },
            {
                "name": "Palmyrah Toddy Infused Payasam",
                "chef_email": "poornachandran.chavakachcheri@chefsync.com",
                "category": "Desserts",
                "description": "Creamy payasam slow-cooked with palmyrah toddy reduction, roasted cashews, and raisins.",
                "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1000&q=80",
                "ingredients": [
                    "vermicelli",
                    "palmyrah toddy",
                    "coconut milk",
                    "cashews",
                    "raisins",
                ],
                "allergens": ["nuts"],
                "is_vegetarian": True,
                "is_vegan": False,
                "is_gluten_free": False,
                "spice_level": "mild",
                "preparation_time": 30,
                "calories": 430,
                "rating": Decimal("4.5"),
                "total_reviews": 41,
                "total_orders": 139,
                "is_featured": False,
                "prices": {
                    "Small": {"price": "5.75", "prep_time": 20},
                    "Medium": {"price": "7.50", "prep_time": 24},
                    "Large": {"price": "9.90", "prep_time": 28},
                },
            },
        ]

    @staticmethod
    def _normalise_gender(gender):
        mapping = {
            "male": "male",
            "female": "female",
            "other": "other",
        }
        return mapping.get(gender.lower(), "prefer_not_to_say") if gender else "prefer_not_to_say"

    def create_foods_and_prices(self, cook_accounts):
        cuisine, _ = Cuisine.objects.get_or_create(
            name="Northern Sri Lankan",
            defaults={
                "description": "Regional specialties from the Jaffna peninsula with bold spices and palm-infused techniques.",
                "image": self.food_specs[0]["image"],
                "sort_order": Cuisine.objects.count() + 1,
            },
        )

        Food.objects.filter(
            name="Point Pedro Sea Crab Cakes",
            chef__email__iexact="nilanthi.jaffna@chefsync.com",
        ).delete()

        category_map = {}
        seen_categories = set()
        for index, category_name in enumerate(sorted({spec["category"] for spec in self.food_specs})):  # noqa: PLE1148
            if category_name in seen_categories:
                continue
            category_spec = next(spec for spec in self.food_specs if spec["category"] == category_name)
            category, _ = FoodCategory.objects.get_or_create(
                cuisine=cuisine,
                name=category_name,
                defaults={
                    "description": f"{category_name} celebrating Northern Sri Lankan flavors.",
                    "image": category_spec["image"],
                    "sort_order": index + 1,
                },
            )
            category_map[category_name] = category
            seen_categories.add(category_name)

        admin_user = (
            User.objects.filter(role__in=["Admin", "admin"]).order_by("user_id").first()
            or User.objects.filter(is_staff=True).order_by("user_id").first()
        )

        created_foods = 0
        created_prices = 0

        for spec in self.food_specs:
            cook_user = cook_accounts.get(spec["chef_email"].lower()) or User.objects.filter(email=spec["chef_email"]).first()
            if not cook_user:
                continue

            category = category_map[spec["category"]]
            nutrition = spec.get(
                "nutrition",
                {
                    "calories_kcal": spec["calories"],
                    "protein_g": 28,
                    "carbs_g": 34,
                    "fat_g": 18,
                },
            )

            food_defaults = {
                "category": spec["category"],
                "description": spec["description"],
                "image": spec["image"],
                "status": "Approved",
                "admin": admin_user,
                "food_category": category,
                "is_available": True,
                "is_featured": spec["is_featured"],
                "preparation_time": spec["preparation_time"],
                "calories_per_serving": spec["calories"],
                "ingredients": spec["ingredients"],
                "allergens": spec["allergens"],
                "nutritional_info": nutrition,
                "is_vegetarian": spec["is_vegetarian"],
                "is_vegan": spec["is_vegan"],
                "is_gluten_free": spec["is_gluten_free"],
                "spice_level": spec["spice_level"],
                "rating_average": spec["rating"],
                "total_reviews": spec["total_reviews"],
                "total_orders": spec["total_orders"],
            }

            food, created_food = Food.objects.update_or_create(
                name=spec["name"],
                chef=cook_user,
                defaults=food_defaults,
            )
            if created_food:
                created_foods += 1

            for size, price_meta in spec["prices"].items():
                price_value = Decimal(str(price_meta["price"]))
                price_defaults = {
                    "price": price_value,
                    "preparation_time": price_meta.get("prep_time", spec["preparation_time"]),
                    "image_url": price_meta.get("image_url", spec["image"]),
                }

                _, created_price = FoodPrice.objects.update_or_create(
                    food=food,
                    cook=cook_user,
                    size=size,
                    defaults=price_defaults,
                )
                if created_price:
                    created_prices += 1

        return created_foods, created_prices

    def run(self):
        created_users = 0
        created_cooks = 0
        created_kitchens = 0
        created_chef_profiles = 0
        cook_accounts = {}

        with transaction.atomic():
            for spec in self.cook_specs:
                user, user_created = User.objects.get_or_create(
                    email=spec["email"],
                    defaults={
                        "name": spec["name"],
                        "phone_no": spec["phone"],
                        "gender": spec["gender"],
                        "address": f"{spec['kitchen']['address_line1']}, {spec['kitchen']['city']}, {spec['kitchen']['state']}",
                        "role": "Cook",
                        "password": "temporary",  # overwritten below
                        "email_verified": True,
                        "approval_status": "approved",
                        "is_active": True,
                    },
                )

                if user_created:
                    user.set_password("cook123")
                    user.username = user.username or spec["email"].split("@")[0]
                    user.approved_at = timezone.now()
                    user.save()
                    created_users += 1
                else:
                    updated_fields = []
                    for field, value in (
                        ("name", spec["name"]),
                        ("phone_no", spec["phone"]),
                        ("gender", spec["gender"]),
                        (
                            "address",
                            f"{spec['kitchen']['address_line1']}, {spec['kitchen']['city']}, {spec['kitchen']['state']}",
                        ),
                    ):
                        if getattr(user, field) != value:
                            setattr(user, field, value)
                            updated_fields.append(field)

                    if user.role not in {"Cook", "cook"}:
                        user.role = "Cook"
                        updated_fields.append("role")

                    if not user.is_active:
                        user.is_active = True
                        updated_fields.append("is_active")

                    if user.approval_status != "approved":
                        user.approval_status = "approved"
                        updated_fields.append("approval_status")

                    if not user.email_verified:
                        user.email_verified = True
                        updated_fields.append("email_verified")

                    if not user.username:
                        user.username = spec["email"].split("@")[0]
                        updated_fields.append("username")

                    if updated_fields:
                        user.approved_at = timezone.now()
                        updated_fields.append("approved_at")
                        user.save(update_fields=list(set(updated_fields)))

                cook_defaults = {
                    "specialty": spec["specialty"],
                    "kitchen_location": spec["kitchen_text"],
                    "experience_years": spec["experience_years"],
                    "rating_avg": spec["rating"],
                    "availability_hours": spec["availability_hours"],
                }

                cook, cook_created = Cook.objects.update_or_create(
                    user=user,
                    defaults=cook_defaults,
                )
                if cook_created:
                    created_cooks += 1

                profile_defaults = {
                    "bio": f"Chef {spec['name']} crafts {spec['specialty']} from Jaffna District.",
                    "gender": self._normalise_gender(spec["gender"]),
                    "preferences": {
                        "primary_kitchen": spec["kitchen"]["kitchen_name"],
                        "delivery_radius_km": spec["kitchen"]["delivery_radius_km"],
                    },
                }
                UserProfile.objects.update_or_create(user=user, defaults=profile_defaults)

                chef_profile_meta = spec.get("chef_profile", {})
                chef_profile_defaults = {
                    "specialty_cuisines": chef_profile_meta.get("specialty_cuisines", [spec["specialty"]]),
                    "experience_years": spec["experience_years"],
                    "certifications": chef_profile_meta.get("certifications", []),
                    "bio": chef_profile_meta.get(
                        "bio",
                        f"Chef {spec['name']} crafts {spec['specialty']} experiences across the Jaffna District.",
                    ),
                    "approval_status": "approved",
                    "rating_average": spec["rating"],
                    "total_orders": chef_profile_meta.get("total_orders", 0),
                    "total_reviews": chef_profile_meta.get("total_reviews", 0),
                    "is_featured": chef_profile_meta.get("is_featured", False),
                }

                _, chef_profile_created = ChefProfile.objects.update_or_create(
                    user=user,
                    defaults=chef_profile_defaults,
                )
                if chef_profile_created:
                    created_chef_profiles += 1

                cook_accounts[spec["email"].lower()] = user

                kitchen_address_defaults = {
                    "address_line1": spec["kitchen"]["address_line1"],
                    "address_line2": spec["kitchen"].get("address_line2"),
                    "landmark": spec["kitchen"].get("landmark"),
                    "city": spec["kitchen"]["city"],
                    "state": spec["kitchen"]["state"],
                    "country": spec["kitchen"].get("country", "Sri Lanka"),
                    "pincode": spec["kitchen"]["pincode"],
                    "latitude": spec["kitchen"]["latitude"],
                    "longitude": spec["kitchen"]["longitude"],
                    "is_default": True,
                    "is_active": True,
                }

                address, address_created = Address.objects.update_or_create(
                    user=user,
                    address_type="kitchen",
                    label=spec["kitchen"]["label"],
                    defaults=kitchen_address_defaults,
                )

                operating_hours = {
                    "monday": "07:00-21:00",
                    "tuesday": "07:00-21:00",
                    "wednesday": "07:00-21:00",
                    "thursday": "07:00-21:00",
                    "friday": "07:00-21:00",
                    "saturday": "08:00-22:00",
                    "sunday": "08:00-20:00",
                }

                kitchen_defaults = {
                    "kitchen_name": spec["kitchen"]["kitchen_name"],
                    "kitchen_type": spec["kitchen"]["kitchen_type"],
                    "contact_number": spec["phone"],
                    "alternate_contact": spec["phone"],
                    "operating_hours": operating_hours,
                    "max_orders_per_day": 60,
                    "delivery_radius_km": spec["kitchen"]["delivery_radius_km"],
                    "has_parking": spec["kitchen"]["has_parking"],
                    "pickup_instructions": spec["kitchen"]["pickup_instructions"],
                    "is_verified": True,
                    "verification_notes": "Seeded sample kitchen in Jaffna District.",
                    "verified_at": timezone.now(),
                }

                KitchenLocation.objects.update_or_create(
                    address=address,
                    defaults=kitchen_defaults,
                )

                if address_created:
                    created_kitchens += 1

        created_foods, created_prices = self.create_foods_and_prices(cook_accounts)

        return (
            created_users,
            created_cooks,
            created_chef_profiles,
            created_kitchens,
            created_foods,
            created_prices,
        )


def main():
    seeder = JaffnaCookSeeder()
    (
        users,
        cooks,
        chef_profiles,
        kitchens,
        foods,
        prices,
    ) = seeder.run()
    print("✅ Jaffna cook seeding completed")
    print(f"  • Users created: {users}")
    print(f"  • Cook profiles created: {cooks}")
    print(f"  • Chef profiles created: {chef_profiles}")
    print(f"  • Kitchen addresses added: {kitchens}")
    print(f"  • Foods added: {foods}")
    print(f"  • Food prices added: {prices}")


if __name__ == "__main__":
    main()
