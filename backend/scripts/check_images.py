#!/usr/bin/env python
"""
Script to check the images that were added to the database
"""
import os
import sys
import django

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.food.models import Cuisine, Food
from apps.authentication.models import User

def main():
    print("=" * 50)
    print("IMAGE STATUS REPORT")
    print("=" * 50)
    
    print(f"\nCuisines with images ({Cuisine.objects.exclude(image='').count()}/{Cuisine.objects.count()}):")
    for c in Cuisine.objects.exclude(image='')[:10]:
        print(f"  - {c.name}: {c.image.name}")
    
    print(f"\nFoods with images ({Food.objects.exclude(image='').count()}/{Food.objects.count()}):")
    for f in Food.objects.exclude(image='')[:10]:
        print(f"  - {f.name}: {f.image.name}")
    
    print(f"\nUsers with profile images ({User.objects.exclude(profile_picture='').count()}/{User.objects.count()}):")
    for u in User.objects.exclude(profile_picture='')[:10]:
        print(f"  - {u.first_name} {u.last_name} ({u.role}): {u.profile_picture.name}")
    
    print("\n" + "=" * 50)
    print("SAMPLE DATA SUMMARY")
    print("=" * 50)
    print(f"Total Users: {User.objects.count()}")
    print(f"Total Cuisines: {Cuisine.objects.count()}")
    print(f"Total Foods: {Food.objects.count()}")
    print(f"Total Food Prices: {Food.objects.count() * 3}")  # Each food has 3 sizes
    print("=" * 50)

if __name__ == "__main__":
    main()