#!/usr/bin/env python
"""
Test script to check Google OAuth endpoint
"""
import os
import sys

import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import requests
from django.conf import settings


def test_google_oauth_endpoint():
    """Test the Google OAuth endpoint"""
    try:
        # Test with a dummy ID token (this should fail but show us the endpoint is accessible)
        test_data = {"id_token": "dummy_token_for_testing"}

        # Make request to the Google OAuth endpoint
        url = "http://localhost:8000/api/auth/google/login/"
        print(f"Making request to: {url}")

        response = requests.post(url, json=test_data, timeout=10)

        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")

        try:
            response_data = response.json()
            print(f"Response data: {response_data}")
        except:
            print(f"Response text: {response.text}")

        return response.status_code, (
            response_data if "response_data" in locals() else None
        )

    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
        return None, None
    except Exception as e:
        print(f"❌ Error testing endpoint: {str(e)}")
        return None, None


if __name__ == "__main__":
    test_google_oauth_endpoint()
