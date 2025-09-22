#!/usr/bin/env python
"""
Script to create a superuser with proper role
"""
import os
import sys
import django

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

def create_superuser():
    email = input("Email: ") or "admin@chefsync.com"
    name = input("Name: ") or "Admin User"
    password = input("Password: ") or "admin123"
    
    try:
        user = User.objects.create_superuser(
            email=email,
            password=password,
            name=name,
            role='Admin'  # Use the correct capitalized role
        )
        user.first_name = name.split()[0] if ' ' in name else name
        user.last_name = name.split()[-1] if ' ' in name and len(name.split()) > 1 else ''
        user.username = email  # Set username to email
        user.save()
        
        print(f"Superuser created successfully!")
        print(f"Email: {user.email}")
        print(f"Name: {user.name}")  
        print(f"Role: {user.role}")
        print(f"Is Staff: {user.is_staff}")
        print(f"Is Superuser: {user.is_superuser}")
        
    except Exception as e:
        print(f"Error creating superuser: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_superuser()