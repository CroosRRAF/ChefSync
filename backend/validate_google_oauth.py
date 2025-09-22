#!/usr/bin/env python
"""
Test script to validate Google OAuth client ID
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


def validate_google_oauth_client_id():
    """Validate Google OAuth client ID"""
    client_id = settings.GOOGLE_OAUTH_CLIENT_ID
    client_secret = settings.GOOGLE_OAUTH_CLIENT_SECRET

    print(f"Client ID: {client_id}")
    print(f"Client Secret configured: {bool(client_secret)}")

    # Test if the client ID looks valid
    if not client_id:
        print("❌ Client ID is not configured")
        return False

    if not client_id.endswith(".apps.googleusercontent.com"):
        print("❌ Client ID does not have the correct format")
        return False

    # Try to get the client ID info from Google
    try:
        # This endpoint can give us info about the OAuth client
        discovery_url = "https://accounts.google.com/.well-known/openid_configuration"
        response = requests.get(discovery_url, timeout=10)

        if response.status_code == 200:
            print("✅ Google OAuth discovery endpoint is accessible")
        else:
            print(
                f"❌ Google OAuth discovery endpoint returned status {response.status_code}"
            )
            return False

        # Test token validation endpoint (this will fail with dummy token but should be accessible)
        token_info_url = "https://oauth2.googleapis.com/tokeninfo"
        test_response = requests.get(f"{token_info_url}?id_token=dummy", timeout=10)

        if test_response.status_code in [400, 401]:  # Expected for invalid token
            print("✅ Google OAuth token validation endpoint is accessible")
            return True
        else:
            print(
                f"❌ Unexpected response from token validation: {test_response.status_code}"
            )
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error validating Google OAuth: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error validating Google OAuth: {str(e)}")
        return False


if __name__ == "__main__":
    validate_google_oauth_client_id()
