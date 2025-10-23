#!/usr/bin/env python
"""
Script to show current database table structures for chef profile data
"""
import os
import sys
import django
from pathlib import Path

# Add the project root to the Python path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from django.db import connection
from apps.authentication.models import User, Cook

def show_table_structure():
    """Show the structure of tables used for chef profile data"""
    
    print("🏗️  CHEF PROFILE DATA TABLES")
    print("="*50)
    
    with connection.cursor() as cursor:
        
        # Show User table structure
        print("\n📋 1. USER TABLE (authentication_user)")
        print("-" * 40)
        cursor.execute("DESCRIBE authentication_user;")
        user_columns = cursor.fetchall()
        
        profile_fields = ['name', 'phone_no', 'username', 'address', 'email']
        for col in user_columns:
            col_name = col[0]  # MySQL DESCRIBE format: Field, Type, Null, Key, Default, Extra
            col_type = col[1]
            not_null = "NOT NULL" if col[2] == 'NO' else "NULL"
            if col_name in profile_fields:
                status = "✅ USED" if col_name != 'email' else "📖 READ-ONLY"
                print(f"  {col_name:<15} {col_type:<15} {not_null:<10} {status}")
        
        # Show Cook table structure  
        print("\n🍳 2. COOK TABLE (Cook)")
        print("-" * 40)
        cursor.execute("DESCRIBE Cook;")
        cook_columns = cursor.fetchall()
        
        cook_profile_fields = [
            'specialty', 'availability_hours', 'experience_years', 
            'kitchen_location', 'kitchen_latitude', 'kitchen_longitude',
            'current_latitude', 'current_longitude', 'location_accuracy',
            'last_location_update', 'is_location_tracking_enabled'
        ]
        
        for col in cook_columns:
            col_name = col[0]  # MySQL DESCRIBE format
            col_type = col[1]
            not_null = "NOT NULL" if col[2] == 'NO' else "NULL"
            if col_name in cook_profile_fields:
                if 'kitchen_' in col_name or 'current_' in col_name or 'location' in col_name:
                    status = "🗺️ LOCATION"
                elif col_name in ['specialty', 'availability_hours', 'experience_years']:
                    status = "👨‍🍳 PROFILE" 
                else:
                    status = "📊 TRACKING"
                print(f"  {col_name:<25} {col_type:<15} {not_null:<10} {status}")

        # Show sample data count
        print("\n📊 3. CURRENT DATA COUNT")
        print("-" * 40)
        
        cursor.execute("SELECT COUNT(*) FROM authentication_user WHERE role = 'cook';")
        user_count = cursor.fetchone()[0]
        print(f"  👤 Cook Users: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM Cook;")
        cook_count = cursor.fetchone()[0] 
        print(f"  🍳 Cook Profiles: {cook_count}")
        
        cursor.execute("SELECT COUNT(*) FROM Cook WHERE kitchen_latitude IS NOT NULL;")
        kitchen_location_count = cursor.fetchone()[0]
        print(f"  🗺️ With Kitchen Location: {kitchen_location_count}")
        
        cursor.execute("SELECT COUNT(*) FROM Cook WHERE current_latitude IS NOT NULL;")
        current_location_count = cursor.fetchone()[0]
        print(f"  📍 With Current Location: {current_location_count}")

def show_data_flow():
    """Show how data flows between frontend and database"""
    
    print("\n\n🔄 DATA FLOW MAPPING")
    print("="*50)
    
    mappings = [
        ("Frontend Field", "Database Table", "Column Name", "Data Type"),
        ("-"*15, "-"*15, "-"*15, "-"*10),
        ("name", "authentication_user", "name", "VARCHAR"),
        ("phone", "authentication_user", "phone_no", "VARCHAR"),
        ("username", "authentication_user", "username", "VARCHAR"), 
        ("address/bio", "authentication_user", "address", "TEXT"),
        ("specialty_cuisine", "Cook", "specialty", "VARCHAR"),
        ("available_hours", "Cook", "availability_hours", "VARCHAR"),
        ("experience_level", "Cook", "experience_years", "INTEGER"),
        ("kitchen_location.latitude", "Cook", "kitchen_latitude", "DECIMAL"),
        ("kitchen_location.longitude", "Cook", "kitchen_longitude", "DECIMAL"),
        ("kitchen_location.address", "Cook", "kitchen_location", "VARCHAR"),
        ("real_time.latitude", "Cook", "current_latitude", "DECIMAL"),
        ("real_time.longitude", "Cook", "current_longitude", "DECIMAL"),
        ("real_time.accuracy", "Cook", "location_accuracy", "FLOAT"),
    ]
    
    for mapping in mappings:
        print(f"  {mapping[0]:<25} → {mapping[1]:<20} → {mapping[2]:<25} ({mapping[3]})")

if __name__ == '__main__':
    try:
        show_table_structure()
        show_data_flow()
        print(f"\n🎉 Chef profile data is stored across 2 main tables:")
        print(f"   • authentication_user (basic profile info)")
        print(f"   • Cook (chef-specific data + all location info)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure Django is properly configured and database is accessible.")