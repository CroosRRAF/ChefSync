#!/usr/bin/env python3
"""
API Endpoint Tester for ChefSync Admin System
Tests all critical admin API endpoints and reports status
"""

import json
import sys
from datetime import datetime
from typing import Dict, List, Tuple

import requests

# Configuration
BASE_URL = "http://localhost:8000"
TOKEN = None  # Will be set after login

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


class APITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token = None
        self.results = []

    def set_token(self, token: str):
        """Set authentication token"""
        self.token = token

    def get_headers(self) -> Dict:
        """Get request headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def test_endpoint(
        self,
        method: str,
        endpoint: str,
        description: str,
        data: Dict = None,
        expected_status: int = 200,
        auth_required: bool = True,
    ) -> Tuple[bool, str]:
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"

        try:
            if method == "GET":
                response = requests.get(
                    url, headers=self.get_headers() if auth_required else {}
                )
            elif method == "POST":
                response = requests.post(
                    url, headers=self.get_headers() if auth_required else {}, json=data
                )
            elif method == "PATCH":
                response = requests.patch(
                    url, headers=self.get_headers() if auth_required else {}, json=data
                )
            elif method == "DELETE":
                response = requests.delete(
                    url, headers=self.get_headers() if auth_required else {}
                )
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            status_text = f"Status: {response.status_code}"

            if not success:
                try:
                    error_data = response.json()
                    status_text += f" | Error: {error_data}"
                except:
                    status_text += f" | Error: {response.text[:100]}"

            return success, status_text

        except requests.exceptions.ConnectionError:
            return False, "Connection Error - Is backend running?"
        except Exception as e:
            return False, f"Exception: {str(e)}"

    def print_result(
        self, success: bool, method: str, endpoint: str, description: str, details: str
    ):
        """Print test result"""
        symbol = f"{GREEN}✅{RESET}" if success else f"{RED}❌{RESET}"
        method_color = f"{BLUE}{method:<7}{RESET}"
        print(f"{symbol} {method_color} {endpoint:<50} {details}")
        self.results.append(
            {
                "success": success,
                "method": method,
                "endpoint": endpoint,
                "description": description,
                "details": details,
            }
        )

    def test_all_endpoints(self):
        """Test all admin API endpoints"""
        print(f"\n{BLUE}{'='*100}{RESET}")
        print(f"{BLUE}ChefSync Admin API Endpoint Testing{RESET}")
        print(f"{BLUE}Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
        print(f"{BLUE}{'='*100}{RESET}\n")

        # Dashboard Endpoints
        print(f"\n{YELLOW}📊 Dashboard Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            ("GET", "/api/admin-management/dashboard/stats/", "Dashboard Statistics"),
            ("GET", "/api/admin-management/dashboard/system_health/", "System Health"),
            (
                "GET",
                "/api/admin-management/dashboard/recent_activities/?limit=10",
                "Recent Activities",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/recent_orders/?limit=10",
                "Recent Orders",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/revenue_trend/?days=30",
                "Revenue Trend",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/orders_trend/?days=30",
                "Orders Trend",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/weekly_performance/?days=7",
                "Weekly Performance",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/growth_analytics/?days=30",
                "Growth Analytics",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/orders_distribution/?days=7",
                "Orders Distribution",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/new_users/?days=30",
                "New Users Data",
            ),
            (
                "GET",
                "/api/admin-management/dashboard/recent_deliveries/?limit=5",
                "Recent Deliveries",
            ),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # User Management Endpoints
        print(f"\n{YELLOW}👥 User Management Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            (
                "GET",
                "/api/admin-management/users/list_users/?page=1&limit=10",
                "List Users",
            ),
            ("GET", "/api/auth/admin/pending-approvals/", "Pending Approvals"),
            (
                "GET",
                "/api/admin-management/users/pending_approvals/?page=1&limit=10",
                "Enhanced Pending Approvals",
            ),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # Food Management Endpoints
        print(f"\n{YELLOW}🍔 Food Management Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            ("GET", "/api/food/admin/foods/?page=1&limit=10", "Admin Food List"),
            ("GET", "/api/food/customer/foods/?page=1&limit=10", "Customer Food List"),
            ("GET", "/api/food/cuisines/", "Cuisines List"),
            ("GET", "/api/food/categories/", "Categories List"),
            ("GET", "/api/food/offers/", "Offers List"),
            ("GET", "/api/food/stats/", "Food Statistics"),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # Order Management Endpoints
        print(f"\n{YELLOW}📦 Order Management Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            (
                "GET",
                "/api/admin-management/orders/list_orders/?page=1&limit=10",
                "List Orders",
            ),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # Communication Endpoints
        print(f"\n{YELLOW}💬 Communication Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            (
                "GET",
                "/api/communications/communications/?page=1&limit=10",
                "Communications List",
            ),
            ("GET", "/api/communications/communications/stats/", "Communication Stats"),
            (
                "GET",
                "/api/communications/communications/sentiment_analysis/",
                "Sentiment Analysis",
            ),
            (
                "GET",
                "/api/communications/communications/notifications/",
                "Notifications",
            ),
            (
                "GET",
                "/api/communications/communications/campaign_stats/",
                "Campaign Stats",
            ),
            (
                "GET",
                "/api/communications/communications/delivery_stats/?period=30d",
                "Delivery Stats",
            ),
            ("GET", "/api/communications/templates/", "Email Templates"),
            ("GET", "/api/communications/categories/", "Categories"),
            ("GET", "/api/communications/tags/", "Tags"),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # Notification Endpoints
        print(f"\n{YELLOW}🔔 Notification Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            ("GET", "/api/admin-management/notifications/", "Notifications List"),
            (
                "GET",
                "/api/admin-management/notifications/unread_count/",
                "Unread Count",
            ),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # System Settings
        print(f"\n{YELLOW}⚙️  System Settings Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            ("GET", "/api/admin-management/settings/", "System Settings"),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # Activity Logs
        print(f"\n{YELLOW}📝 Activity Log Endpoints:{RESET}")
        print("-" * 100)

        endpoints = [
            ("GET", "/api/admin-management/activity-logs/", "Activity Logs"),
        ]

        for method, endpoint, description in endpoints:
            success, details = self.test_endpoint(method, endpoint, description)
            self.print_result(success, method, endpoint, description, details)

        # Print Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print(f"\n{BLUE}{'='*100}{RESET}")
        print(f"{BLUE}Test Summary{RESET}")
        print(f"{BLUE}{'='*100}{RESET}\n")

        total = len(self.results)
        passed = sum(1 for r in self.results if r["success"])
        failed = total - passed

        pass_rate = (passed / total * 100) if total > 0 else 0

        print(f"Total Tests: {total}")
        print(f"{GREEN}Passed: {passed}{RESET}")
        print(f"{RED}Failed: {failed}{RESET}")
        print(f"Pass Rate: {pass_rate:.1f}%\n")

        if failed > 0:
            print(f"{RED}Failed Endpoints:{RESET}")
            print("-" * 100)
            for result in self.results:
                if not result["success"]:
                    print(f"  ❌ {result['method']} {result['endpoint']}")
                    print(f"     {result['details']}\n")

        print(f"\n{BLUE}{'='*100}{RESET}")
        print(
            f"{BLUE}Testing Complete: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}"
        )
        print(f"{BLUE}{'='*100}{RESET}\n")


def login_and_get_token():
    """Login and get authentication token"""
    print(f"\n{YELLOW}🔐 Authentication Required{RESET}")
    print("-" * 100)

    email = input("Enter admin email (or press Enter to skip auth): ").strip()

    if not email:
        print(f"{YELLOW}⚠️  Skipping authentication - testing without token{RESET}")
        return None

    import getpass

    password = getpass.getpass("Enter password: ")

    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/", json={"email": email, "password": password}
        )

        if response.status_code == 200:
            data = response.json()
            token = data.get("access") or data.get("access_token")
            if token:
                print(f"{GREEN}✅ Authentication successful!{RESET}\n")
                return token
            else:
                print(f"{RED}❌ Token not found in response{RESET}")
                return None
        else:
            print(f"{RED}❌ Authentication failed: {response.status_code}{RESET}")
            print(f"Response: {response.text}\n")
            return None

    except Exception as e:
        print(f"{RED}❌ Authentication error: {str(e)}{RESET}\n")
        return None


def main():
    """Main function"""
    print(f"\n{BLUE}{'='*100}{RESET}")
    print(f"{BLUE}ChefSync Admin API Endpoint Tester{RESET}")
    print(f"{BLUE}{'='*100}{RESET}")

    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"{GREEN}✅ Backend server is running{RESET}")
    except:
        print(f"{RED}❌ Cannot connect to backend at {BASE_URL}{RESET}")
        print(f"{YELLOW}Please start the backend server first:{RESET}")
        print(f"  cd backend")
        print(f"  python manage.py runserver\n")
        sys.exit(1)

    # Login
    token = login_and_get_token()

    # Create tester
    tester = APITester(BASE_URL)
    if token:
        tester.set_token(token)

    # Run tests
    tester.test_all_endpoints()


if __name__ == "__main__":
    main()
