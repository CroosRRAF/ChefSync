"""
Test the admin dashboard API endpoints directly
"""

import os
import sys

import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

print("=" * 60)
print("🧪 TESTING DASHBOARD API ENDPOINTS")
print("=" * 60)

# Get an admin user
admin = User.objects.filter(role="admin", is_active=True).first()
if not admin:
    print("❌ No admin user found!")
    sys.exit(1)

print(f"\n✅ Using admin user: {admin.email}")

# Create authentication token
refresh = RefreshToken.for_user(admin)
access_token = str(refresh.access_token)
print(f"✅ Generated token: {access_token[:30]}...")

# Create API client
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

print("\n" + "=" * 60)
print("📊 TEST 1: Dashboard Stats")
print("=" * 60)

response = client.get("/api/admin-management/dashboard/stats/")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS!")
    print(f"   Total Orders: {data.get('total_orders')}")
    print(f"   Total Revenue: ${data.get('total_revenue')}")
    print(f"   Active Users: {data.get('active_users')}")
else:
    print(f"❌ FAILED!")
    print(f"   Response: {response.content}")

print("\n" + "=" * 60)
print("📦 TEST 2: Recent Orders")
print("=" * 60)

response = client.get("/api/admin-management/dashboard/recent_orders/?limit=5")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS!")
    print(f"   Response Type: {type(data).__name__}")
    print(
        f"   Number of Orders: {len(data) if isinstance(data, list) else 'Not a list'}"
    )

    if isinstance(data, list):
        if len(data) == 0:
            print(f"   ❌ WARNING: Empty array returned!")
            print(f"      But we know 7 orders exist in database.")
            print(f"      This is the problem!")
        else:
            print(f"   ✅ Orders found!")
            for i, order in enumerate(data[:3], 1):
                print(
                    f"      {i}. {order.get('order_number')} - {order.get('customer_name')} - ${order.get('total_amount')}"
                )
            if len(data) > 3:
                print(f"      ... and {len(data) - 3} more")
    else:
        print(f"   ❌ Response is not an array!")
        print(f"      Data: {data}")
else:
    print(f"❌ FAILED!")
    print(f"   Response: {response.content}")

print("\n" + "=" * 60)
print("🚚 TEST 3: Recent Deliveries")
print("=" * 60)

response = client.get("/api/admin-management/dashboard/recent_deliveries/?limit=5")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS!")
    print(f"   Response Type: {type(data).__name__}")
    print(
        f"   Number of Deliveries: {len(data) if isinstance(data, list) else 'Not a list'}"
    )

    if isinstance(data, list) and len(data) == 0:
        print(f"   ⚠️  Empty array (Deliveries might not exist in DB)")
elif response.status_code == 404:
    print(f"❌ ENDPOINT NOT FOUND!")
    print(f"   The recent-deliveries endpoint doesn't exist")
else:
    print(f"❌ FAILED!")
    print(f"   Response: {response.content}")

print("\n" + "=" * 60)
print("📝 TEST 4: Recent Activities")
print("=" * 60)

response = client.get("/api/admin-management/dashboard/recent_activities/?limit=5")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS!")
    print(
        f"   Number of Activities: {len(data) if isinstance(data, list) else 'Not a list'}"
    )
elif response.status_code == 404:
    print(f"❌ ENDPOINT NOT FOUND!")
else:
    print(f"❌ FAILED!")

print("\n" + "=" * 60)
print("📋 SUMMARY")
print("=" * 60)

print(
    """
If recent-orders returns an empty array [], the problem is:
  1. Backend view filtering logic
  2. Serializer silently failing
  3. Permission issue

If it returns data here but not in browser:
  1. CORS issue
  2. Frontend clearing data
  3. Token issue in browser

✅ Test complete!
"""
)
