#!/usr/bin/env python3
"""
API Endpoint Analysis Script
Analyzes mismatches between frontend API calls and backend URL patterns.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Backend Django project paths
BACKEND_ROOT = Path("backend")
FRONTEND_ROOT = Path("frontend/src")


def extract_backend_endpoints() -> Dict[str, List[str]]:
    """Extract all URL patterns from Django urls.py files"""
    endpoints = {}

    # Main URL configuration
    main_urls_file = BACKEND_ROOT / "config" / "urls.py"
    if main_urls_file.exists():
        with open(main_urls_file, "r", encoding="utf-8") as f:
            content = f.read()
            # Extract path includes
            includes = re.findall(
                r'path\(["\'](.*?)["\'].*include\(["\'](.*?)["\'].*\)', content
            )
            for prefix, app_url in includes:
                endpoints[prefix] = []

    # App-specific URL files
    apps_dir = BACKEND_ROOT / "apps"
    if apps_dir.exists():
        for app_dir in apps_dir.iterdir():
            if app_dir.is_dir():
                urls_file = app_dir / "urls.py"
                if urls_file.exists():
                    app_name = app_dir.name
                    with open(urls_file, "r", encoding="utf-8") as f:
                        content = f.read()

                    # Extract ViewSet registrations
                    router_patterns = re.findall(
                        r'router\.register\(r["\'](.*?)["\'].*?([\w]+ViewSet)', content
                    )

                    # Extract path patterns
                    path_patterns = re.findall(
                        r'path\(["\'](.*?)["\'].*?name=["\'](.*?)["\'].*?\)', content
                    )

                    if app_name not in endpoints:
                        endpoints[app_name] = []

                    for pattern, viewset in router_patterns:
                        endpoints[app_name].append(f"REST: {pattern} ({viewset})")

                    for pattern, name in path_patterns:
                        endpoints[app_name].append(f"PATH: {pattern} ({name})")

    return endpoints


def extract_frontend_api_calls() -> List[Tuple[str, str, str]]:
    """Extract all API calls from frontend service files"""
    api_calls = []

    # Service files
    services_dir = FRONTEND_ROOT / "services"
    if services_dir.exists():
        for service_file in services_dir.glob("*.ts"):
            with open(service_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Extract API calls
            patterns = [
                r'apiClient\.(get|post|put|patch|delete)\(["\'](.*?)["\'].*?\)',
                r'api\.(get|post|put|patch|delete)\(["\'](.*?)["\'].*?\)',
                r'axios\.(get|post|put|patch|delete)\(["\'](.*?)["\'].*?\)',
            ]

            for pattern in patterns:
                matches = re.findall(pattern, content)
                for method, endpoint in matches:
                    api_calls.append((service_file.name, method.upper(), endpoint))

    # Utils files
    utils_dir = FRONTEND_ROOT / "utils"
    if utils_dir.exists():
        for utils_file in utils_dir.glob("*.ts"):
            with open(utils_file, "r", encoding="utf-8") as f:
                content = f.read()

            patterns = [
                r'apiClient\.(get|post|put|patch|delete)\(["\'](.*?)["\'].*?\)',
                r'api\.(get|post|put|patch|delete)\(["\'](.*?)["\'].*?\)',
            ]

            for pattern in patterns:
                matches = re.findall(pattern, content)
                for method, endpoint in matches:
                    api_calls.append((utils_file.name, method.upper(), endpoint))

    return api_calls


def normalize_endpoint(endpoint: str) -> str:
    """Normalize endpoint for comparison"""
    # Remove leading/trailing slashes
    endpoint = endpoint.strip("/")
    # Remove /api prefix if present
    if endpoint.startswith("api/"):
        endpoint = endpoint[4:]
    # Remove query parameters
    endpoint = endpoint.split("?")[0]
    # Remove path parameters (various formats)
    endpoint = re.sub(r"\$\{[^}]*\}", "{id}", endpoint)
    endpoint = re.sub(r"/\d+/", "/{id}/", endpoint)
    endpoint = re.sub(r"/\d+$", "/{id}", endpoint)
    endpoint = re.sub(r"/<int:[^>]+>", "/{id}", endpoint)
    endpoint = re.sub(r"/<str:[^>]+>", "/{id}", endpoint)
    return endpoint


def analyze_mismatches():
    """Main analysis function"""
    print("🔍 Analyzing API Endpoint Mismatches...\n")

    # Extract endpoints
    backend_endpoints = extract_backend_endpoints()
    frontend_calls = extract_frontend_api_calls()

    print("📊 BACKEND ENDPOINTS:")
    print("=" * 50)
    for app, endpoints in backend_endpoints.items():
        print(f"\n{app}:")
        for endpoint in endpoints:
            print(f"  {endpoint}")

    print("\n\n📱 FRONTEND API CALLS:")
    print("=" * 50)
    for service, method, endpoint in frontend_calls:
        print(f"{service}: {method} {endpoint}")

    # Analyze mismatches
    print("\n\n⚠️  POTENTIAL MISMATCHES:")
    print("=" * 50)

    # Create a set of all backend endpoints for quick lookup
    all_backend_endpoints = set()
    for app, endpoints in backend_endpoints.items():
        for endpoint in endpoints:
            if endpoint.startswith("REST: "):
                pattern = endpoint.replace("REST: ", "").split(" (")[0]
                # Add with app prefix
                all_backend_endpoints.add(f"{app}/{pattern}")
                # Also add without app prefix for root level routes
                all_backend_endpoints.add(pattern)
            elif endpoint.startswith("PATH: "):
                pattern = endpoint.replace("PATH: ", "").split(" (")[0]
                # Add with app prefix
                all_backend_endpoints.add(f"{app}/{pattern}")
                # Also add without app prefix for root level routes
                all_backend_endpoints.add(pattern)

    # Normalize all backend endpoints
    normalized_backend = {normalize_endpoint(ep) for ep in all_backend_endpoints}

    mismatches = []
    matched = []

    for service, method, endpoint in frontend_calls:
        normalized = normalize_endpoint(endpoint)
        # Check if endpoint exists in backend
        found = normalized in normalized_backend

        if not found:
            mismatches.append((service, method, endpoint))
        else:
            matched.append((service, method, endpoint))

    if mismatches:
        print(f"\nFound {len(mismatches)} potential mismatches:")
        for service, method, endpoint in mismatches:
            print(f"❌ {service}: {method} {endpoint}")
    else:
        print("✅ No mismatches found!")

    print(f"\n✅ MATCHED ENDPOINTS: {len(matched)}")
    print(f"❌ MISMATCHED ENDPOINTS: {len(mismatches)}")
    print(f"📊 MATCH RATE: {len(matched)/(len(matched)+len(mismatches))*100:.1f}%")

    # Generate fix suggestions
    print("\n\n🔧 COMMON PATTERNS & FIX SUGGESTIONS:")
    print("=" * 50)

    print("\n✅ GOOD PATTERNS (These should work):")
    print("  Frontend calls without /api prefix are CORRECT")
    print("  The API base URL automatically adds /api")
    print("  Example: /auth/login/ → http://localhost:8000/api/auth/login/")

    print("\n⚠️ CHECK THESE ENDPOINTS:")
    if mismatches:
        # Group mismatches by service
        by_service = {}
        for service, method, endpoint in mismatches:
            if service not in by_service:
                by_service[service] = []
            by_service[service].append(f"{method} {endpoint}")

        for service, endpoints in by_service.items():
            print(f"\n  {service}:")
            for endpoint in endpoints[:5]:  # Show first 5
                print(f"    - {endpoint}")
            if len(endpoints) > 5:
                print(f"    ... and {len(endpoints)-5} more")

    print("\n💡 RECOMMENDATIONS:")
    print(
        "  1. Most 'mismatches' are actually ViewSet actions (e.g., cart_summary, place)"
    )
    print("  2. Check if custom @action decorators exist in backend ViewSets")
    print("  3. Verify URL routing for non-standard endpoints")
    print("  4. Test the actual API calls - many work despite appearing as mismatches")

    print("\n🔍 TO VERIFY AN ENDPOINT:")
    print("  Backend: Check apps/<app>/views.py for @action decorators")
    print("  Test: curl http://localhost:8000/api/<endpoint>")
    print("  Or: Run the test_api_endpoints.py script")


if __name__ == "__main__":
    try:
        analyze_mismatches()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback

        traceback.print_exc()
