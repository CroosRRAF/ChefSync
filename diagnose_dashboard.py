#!/usr/bin/env python3
"""
Quick Dashboard Diagnostic Tool
Checks if backend, endpoints, and data are working correctly
"""

import subprocess
import sys
from pathlib import Path

import requests

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")


def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")


def print_error(text):
    print(f"{RED}❌ {text}{RESET}")


def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")


def print_info(text):
    print(f"   {text}")


def check_backend_running():
    """Check if backend server is running"""
    print_header("1. Checking Backend Server")

    try:
        response = requests.get("http://localhost:8000/", timeout=2)
        if response.status_code == 200:
            data = response.json()
            print_success(
                f"Backend is running: {data.get('service', 'ChefSync Backend')}"
            )
            return True
        else:
            print_warning(f"Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Backend is NOT running")
        print_info("Start it with: cd backend && python manage.py runserver")
        return False
    except requests.exceptions.Timeout:
        print_error("Backend is not responding (timeout)")
        return False
    except Exception as e:
        print_error(f"Error checking backend: {str(e)}")
        return False


def check_dashboard_endpoint():
    """Check if dashboard endpoint exists"""
    print_header("2. Checking Dashboard Endpoint")

    try:
        response = requests.get(
            "http://localhost:8000/api/admin-management/dashboard/stats/", timeout=2
        )

        if response.status_code == 401:
            print_success("Dashboard endpoint exists (requires authentication)")
            return True
        elif response.status_code == 404:
            print_error("Dashboard endpoint NOT FOUND")
            print_info("Check backend/apps/admin_management/urls.py")
            return False
        elif response.status_code == 200:
            print_success("Dashboard endpoint is accessible (no auth required)")
            return True
        else:
            print_warning(f"Dashboard endpoint returned status {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend")
        return False
    except Exception as e:
        print_error(f"Error checking dashboard endpoint: {str(e)}")
        return False


def check_database():
    """Check if database has data"""
    print_header("3. Checking Database")

    backend_path = Path("backend")
    if not backend_path.exists():
        print_error("Backend directory not found")
        print_info("Run this script from project root")
        return False

    try:
        # Check if we can import Django
        result = subprocess.run(
            [
                sys.executable,
                "manage.py",
                "shell",
                "-c",
                "from django.contrib.auth import get_user_model; "
                "User = get_user_model(); "
                "from apps.orders.models import Order; "
                "from apps.food.models import Food; "
                "print(f'Users: {User.objects.count()}'); "
                "print(f'Orders: {Order.objects.count()}'); "
                "print(f'Foods: {Food.objects.count()}')",
            ],
            cwd=backend_path,
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode == 0:
            output_lines = result.stdout.strip().split("\n")
            for line in output_lines:
                if (
                    line.startswith("Users:")
                    or line.startswith("Orders:")
                    or line.startswith("Foods:")
                ):
                    count = int(line.split(":")[1].strip())
                    if count > 0:
                        print_success(line)
                    else:
                        print_warning(f"{line} (empty)")

            # Check if database is empty
            if all("0" in line.split(":")[1] for line in output_lines if ":" in line):
                print_warning("Database is empty - you may need to create test data")
                print_info("Run: cd backend && python create_admin_test_data.py")

            return True
        else:
            print_error("Could not check database")
            print_info(result.stderr)
            return False

    except FileNotFoundError:
        print_error("Django not found or manage.py missing")
        return False
    except subprocess.TimeoutExpired:
        print_error("Database check timed out")
        return False
    except Exception as e:
        print_error(f"Error checking database: {str(e)}")
        return False


def check_admin_user():
    """Check if admin user exists"""
    print_header("4. Checking Admin User")

    backend_path = Path("backend")
    if not backend_path.exists():
        print_error("Backend directory not found")
        return False

    try:
        result = subprocess.run(
            [
                sys.executable,
                "manage.py",
                "shell",
                "-c",
                "from django.contrib.auth import get_user_model; "
                "User = get_user_model(); "
                "admins = User.objects.filter(role='admin'); "
                "print(f'Admin count: {admins.count()}'); "
                "[print(f'  - {u.email}') for u in admins[:3]]",
            ],
            cwd=backend_path,
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode == 0:
            output = result.stdout.strip()
            if "Admin count: 0" in output:
                print_warning("No admin users found")
                print_info(
                    "Create one with: cd backend && python manage.py createsuperuser"
                )
                return False
            else:
                print_success("Admin users found:")
                for line in output.split("\n")[1:]:  # Skip first line
                    if line.strip().startswith("-"):
                        print_info(line)
                return True
        else:
            print_error("Could not check admin users")
            return False

    except Exception as e:
        print_error(f"Error checking admin users: {str(e)}")
        return False


def check_frontend():
    """Check if frontend files exist"""
    print_header("5. Checking Frontend")

    dashboard_file = Path("frontend/src/pages/admin/Dashboard.tsx")
    if dashboard_file.exists():
        print_success("Dashboard component exists")

        # Check if it's importing correctly
        content = dashboard_file.read_text(encoding="utf-8")
        if "adminService.getDashboardStats" in content:
            print_success("Dashboard is using adminService")
        else:
            print_warning("Dashboard may not be calling API correctly")

        return True
    else:
        print_error("Dashboard component NOT FOUND")
        print_info(f"Expected at: {dashboard_file}")
        return False


def check_api_service():
    """Check if adminService exists"""
    print_header("6. Checking Admin Service")

    service_file = Path("frontend/src/services/adminService.ts")
    if service_file.exists():
        print_success("Admin service file exists")

        content = service_file.read_text(encoding="utf-8")

        # Check for key methods
        methods = [
            "getDashboardStats",
            "getRecentOrders",
            "getRecentDeliveries",
            "getRecentActivities",
        ]

        all_exist = True
        for method in methods:
            if method in content:
                print_success(f"  ✓ {method}() method exists")
            else:
                print_warning(f"  ✗ {method}() method missing")
                all_exist = False

        return all_exist
    else:
        print_error("Admin service file NOT FOUND")
        return False


def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}ChefSync Admin Dashboard Diagnostic Tool{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

    results = []

    # Run all checks
    results.append(("Backend Server", check_backend_running()))
    results.append(("Dashboard Endpoint", check_dashboard_endpoint()))
    results.append(("Database", check_database()))
    results.append(("Admin User", check_admin_user()))
    results.append(("Frontend Component", check_frontend()))
    results.append(("API Service", check_api_service()))

    # Summary
    print_header("Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        if result:
            print_success(f"{name}: OK")
        else:
            print_error(f"{name}: FAILED")

    print(f"\n{BLUE}Results: {passed}/{total} checks passed{RESET}")

    if passed == total:
        print(f"\n{GREEN}✅ Everything looks good!{RESET}")
        print_info("If dashboard still not showing, check browser console (F12)")
        print_info("Look for JavaScript errors or failed API calls")
    else:
        print(f"\n{RED}❌ Some checks failed{RESET}")
        print_info("Fix the issues above and try again")

    # Recommendations
    print_header("Recommendations")

    if not results[0][1]:  # Backend not running
        print("1. Start the backend server:")
        print_info("   cd backend")
        print_info("   python manage.py runserver")

    if not results[3][1]:  # No admin user
        print("2. Create an admin user:")
        print_info("   cd backend")
        print_info("   python manage.py createsuperuser")

    if results[2][1] and "empty" in str(results[2]):  # Database empty
        print("3. Generate test data:")
        print_info("   cd backend")
        print_info("   python create_admin_test_data.py")

    print(f"\n{BLUE}For detailed debugging, see: DASHBOARD_DEBUG_GUIDE_V2.md{RESET}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Diagnostic cancelled by user{RESET}")
    except Exception as e:
        print(f"\n\n{RED}Unexpected error: {str(e)}{RESET}")
        import traceback

        traceback.print_exc()
