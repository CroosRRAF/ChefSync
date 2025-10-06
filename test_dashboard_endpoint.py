#!/usr/bin/env python3
"""
Quick test script to check if the admin dashboard endpoint is working
"""

import json

import requests

BASE_URL = "http://localhost:8000"


def test_dashboard_endpoint():
    """Test the dashboard stats endpoint"""
    print("=" * 60)
    print("Testing Admin Dashboard Endpoint")
    print("=" * 60)

    # Test without authentication first
    print("\n1. Testing endpoint accessibility (no auth)...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin-management/dashboard/stats/")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Endpoint exists - requires authentication (expected)")
        elif response.status_code == 404:
            print("   ❌ Endpoint not found - check URL configuration")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to backend")
        print("   Please start the backend server:")
        print("      cd backend")
        print("      python manage.py runserver")
        return
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return

    # Test health check
    print("\n2. Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend is running: {data.get('service', 'Unknown')}")
        else:
            print(f"   ⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

    # Test with admin credentials (if provided)
    print("\n3. Would you like to test with admin credentials? (y/n): ", end="")
    test_with_auth = input().strip().lower()

    if test_with_auth == "y":
        email = input("   Enter admin email: ").strip()
        import getpass

        password = getpass.getpass("   Enter password: ")

        print("\n   Logging in...")
        try:
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login/",
                json={"email": email, "password": password},
            )

            if login_response.status_code == 200:
                data = login_response.json()
                token = data.get("access") or data.get("access_token")

                if not token:
                    print("   ❌ No token in login response")
                    return

                print("   ✅ Login successful!")

                # Test dashboard endpoint with token
                print("\n4. Testing dashboard endpoint with authentication...")
                headers = {"Authorization": f"Bearer {token}"}

                dashboard_response = requests.get(
                    f"{BASE_URL}/api/admin-management/dashboard/stats/", headers=headers
                )

                print(f"   Status Code: {dashboard_response.status_code}")

                if dashboard_response.status_code == 200:
                    dashboard_data = dashboard_response.json()
                    print("   ✅ Dashboard endpoint working!")
                    print("\n   Sample Data:")
                    print(
                        f"      Total Users: {dashboard_data.get('total_users', 'N/A')}"
                    )
                    print(
                        f"      Total Orders: {dashboard_data.get('total_orders', 'N/A')}"
                    )
                    print(
                        f"      Total Revenue: {dashboard_data.get('total_revenue', 'N/A')}"
                    )
                    print(
                        f"      Active Users: {dashboard_data.get('active_users', 'N/A')}"
                    )

                    # Save response for debugging
                    with open("dashboard_response.json", "w") as f:
                        json.dump(dashboard_data, f, indent=2)
                    print("\n   📄 Full response saved to: dashboard_response.json")

                else:
                    print(
                        f"   ❌ Dashboard endpoint failed: {dashboard_response.status_code}"
                    )
                    print(f"   Response: {dashboard_response.text[:200]}")

            else:
                print(f"   ❌ Login failed: {login_response.status_code}")
                print(f"   Response: {login_response.text[:200]}")

        except Exception as e:
            print(f"   ❌ Error during authentication test: {str(e)}")

    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_dashboard_endpoint()
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback

        traceback.print_exc()
