"""
Test what data the dashboard API endpoints are actually returning
"""

import json
from pprint import pprint

import requests

BASE_URL = "http://localhost:8000"

# Test credentials (use admin credentials)
# Using one of the admin users from database
LOGIN_DATA = {
    "email": "royceabiel26.uni@gmail.com",  # Admin user from database
    "password": "password123",  # Common test password - change if needed
}

# If this doesn't work, try:
# "email": "superadmin@gmail.com", "password": "password123"


def get_token():
    """Get authentication token"""
    print("🔐 Logging in...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=LOGIN_DATA)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access") or data.get("access_token")
            print(f"✅ Login successful! Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None


def test_endpoint(endpoint, token, description):
    """Test a specific endpoint"""
    print(f"\n{'='*60}")
    print(f"📊 Testing: {description}")
    print(f"🔗 URL: {BASE_URL}{endpoint}")
    print(f"{'='*60}")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS!")
            print(f"\nResponse Type: {type(data)}")

            if isinstance(data, dict):
                print(f"Keys: {list(data.keys())}")
                print(f"\nFull Response:")
                pprint(data, indent=2)
            elif isinstance(data, list):
                print(f"Array Length: {len(data)}")
                if len(data) > 0:
                    print(f"\nFirst Item:")
                    pprint(data[0], indent=2)
                    if len(data) > 1:
                        print(f"\nTotal {len(data)} items")
                else:
                    print("⚠️  EMPTY ARRAY!")
            else:
                print(f"Response: {data}")

            return data
        else:
            print(f"❌ FAILED!")
            print(f"Response: {response.text}")
            return None

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None


def main():
    print("🚀 Dashboard API Data Test")
    print("=" * 60)

    # Get authentication token
    token = get_token()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        return

    # Test dashboard stats
    stats = test_endpoint(
        "/api/admin-management/dashboard/stats/", token, "Dashboard Stats"
    )

    # Test recent orders
    orders = test_endpoint(
        "/api/admin-management/dashboard/recent-orders/", token, "Recent Orders"
    )

    # Also test with limit parameter
    orders_with_limit = test_endpoint(
        "/api/admin-management/dashboard/recent-orders/?limit=5",
        token,
        "Recent Orders (with limit=5)",
    )

    # Test recent deliveries
    deliveries = test_endpoint(
        "/api/admin-management/dashboard/recent-deliveries/", token, "Recent Deliveries"
    )

    # Test with limit
    deliveries_with_limit = test_endpoint(
        "/api/admin-management/dashboard/recent-deliveries/?limit=5",
        token,
        "Recent Deliveries (with limit=5)",
    )

    # Test recent activities
    activities = test_endpoint(
        "/api/admin-management/dashboard/recent-activities/", token, "Recent Activities"
    )

    # Summary
    print(f"\n{'='*60}")
    print("📋 SUMMARY")
    print(f"{'='*60}")

    if stats:
        print(f"✅ Dashboard Stats: Working")
        print(f"   - Total Orders: {stats.get('total_orders', 'N/A')}")
        print(f"   - Total Revenue: {stats.get('total_revenue', 'N/A')}")
        print(f"   - Active Users: {stats.get('active_users', 'N/A')}")
    else:
        print("❌ Dashboard Stats: Failed")

    if orders is not None:
        print(f"✅ Recent Orders: Working")
        print(
            f"   - Count: {len(orders) if isinstance(orders, list) else 'Not an array'}"
        )
        if isinstance(orders, list) and len(orders) == 0:
            print("   ⚠️  WARNING: Empty array!")
    else:
        print("❌ Recent Orders: Failed")

    if deliveries is not None:
        print(f"✅ Recent Deliveries: Working")
        print(
            f"   - Count: {len(deliveries) if isinstance(deliveries, list) else 'Not an array'}"
        )
        if isinstance(deliveries, list) and len(deliveries) == 0:
            print("   ⚠️  WARNING: Empty array!")
    else:
        print("❌ Recent Deliveries: Failed")

    if activities is not None:
        print(f"✅ Recent Activities: Working")
        print(
            f"   - Count: {len(activities) if isinstance(activities, list) else 'Not an array'}"
        )
        if isinstance(activities, list) and len(activities) == 0:
            print("   ⚠️  WARNING: Empty array!")
    else:
        print("❌ Recent Activities: Failed")

    print(f"\n{'='*60}")
    print("🔍 DIAGNOSIS:")
    print(f"{'='*60}")

    # Diagnose the issue
    if orders is not None and isinstance(orders, list) and len(orders) == 0:
        print("⚠️  Recent Orders endpoint returns empty array")
        print("   Possible reasons:")
        print("   1. No orders in database")
        print("   2. Orders exist but don't match the query filters")
        print("   3. Date filtering is too strict")
        print("   4. Wrong status filtering")
        print("\n   💡 Solution: Check backend filters in recent-orders endpoint")

    if deliveries is not None and isinstance(deliveries, list) and len(deliveries) == 0:
        print("⚠️  Recent Deliveries endpoint returns empty array")
        print("   Possible reasons:")
        print("   1. No deliveries in database")
        print("   2. Deliveries table/model doesn't exist")
        print("   3. Query filters are too strict")
        print("\n   💡 Solution: Check if Delivery model exists and has data")

    print("\n✅ Test complete!")


if __name__ == "__main__":
    main()
