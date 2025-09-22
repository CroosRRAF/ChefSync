#!/usr/bin/env python
"""
Test admin user authentication and permissions
"""
import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.admin_management.permissions import IsAdminOrSuperUser
from unittest.mock import Mock

User = get_user_model()

def test_admin_permissions():
    """Test admin user permissions"""
    
    try:
        # Get the admin user
        admin_user = User.objects.get(email='admin@chefsync.com')
        
        print(f"🔍 Admin User Details:")
        print(f"   Name: {admin_user.name}")
        print(f"   Email: {admin_user.email}")
        print(f"   Role: {admin_user.role}")
        print(f"   is_staff: {admin_user.is_staff}")
        print(f"   is_superuser: {admin_user.is_superuser}")
        print(f"   is_active: {admin_user.is_active}")
        print(f"   is_authenticated: {admin_user.is_authenticated}")
        
        # Test the custom permission
        permission = IsAdminOrSuperUser()
        
        # Create a mock request
        mock_request = Mock()
        mock_request.user = admin_user
        
        # Test permission
        has_permission = permission.has_permission(mock_request, None)
        
        print(f"\n🛡️  Permission Test:")
        print(f"   IsAdminOrSuperUser permission: {'✅ PASS' if has_permission else '❌ FAIL'}")
        
        # Check individual conditions
        conditions = [
            ("is_superuser", admin_user.is_superuser),
            ("is_staff", admin_user.is_staff),
            ("role == 'admin'", admin_user.role == 'admin'),
            ("is_authenticated", admin_user.is_authenticated),
        ]
        
        print(f"\n🔧 Permission Conditions:")
        for condition, result in conditions:
            print(f"   {condition}: {'✅' if result else '❌'} {result}")
        
        return has_permission
        
    except User.DoesNotExist:
        print("❌ Admin user not found!")
        return False
    except Exception as e:
        print(f"❌ Error testing permissions: {str(e)}")
        return False

def test_token_auth():
    """Test if JWT token authentication is working"""
    
    print(f"\n🔐 Authentication Test:")
    print(f"   Frontend should send Authorization: Bearer <token> header")
    print(f"   Token should be stored in localStorage as 'access_token'")
    print(f"   Check browser dev tools -> Application -> Local Storage")
    
    # Check if there are any recent logins
    try:
        admin_user = User.objects.get(email='admin@chefsync.com')
        if admin_user.last_login:
            print(f"   Last login: {admin_user.last_login}")
        else:
            print(f"   ⚠️  User has never logged in!")
            print(f"   👉 Please log in through the frontend first")
    except:
        pass

if __name__ == '__main__':
    print("🧪 Testing ChefSync Admin Permissions...\n")
    
    permissions_ok = test_admin_permissions()
    test_token_auth()
    
    if permissions_ok:
        print(f"\n✅ Admin permissions are configured correctly!")
        print(f"\n💡 If you're still getting 403 errors:")
        print(f"   1. Make sure you're logged in through the frontend")
        print(f"   2. Check the Authorization header in browser dev tools")
        print(f"   3. Try logging out and logging in again")
        print(f"   4. Verify the JWT token is being sent with requests")
    else:
        print(f"\n❌ Admin permissions need to be fixed!")