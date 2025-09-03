import requests
import json
import os
from decouple import config
import webbrowser
from urllib.parse import urlencode

# Get the Google OAuth client ID from .env
GOOGLE_OAUTH_CLIENT_ID = config('GOOGLE_OAUTH_CLIENT_ID', default='your-google-client-id')
FRONTEND_URL = "http://localhost:8081"  # Current frontend URL

def test_google_oauth_login():
    backend_url = "http://localhost:8000/api/auth/google/login/"
    
    print("\n=== Google OAuth Test Utility ===")
    print("\nConfiguration:")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Backend URL: {backend_url}")
    print(f"Google OAuth Client ID: {GOOGLE_OAUTH_CLIENT_ID}")
    
    print("\nTesting backend endpoint with test token...")
    test_token = "test_token"
    data = {"id_token": test_token}
    
    try:
        response = requests.post(backend_url, json=data)
        print("\nBackend Test Results:")
        print(f"Status Code: {response.status_code}")
        try:
            print("Response:", json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            print("Raw Response:", response.text)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server")
    
    print("\nChecking frontend application...")
    try:
        response = requests.get(FRONTEND_URL)
        if response.status_code == 200:
            print("Frontend is accessible")
        else:
            print(f"Frontend returned status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the frontend server")
    
    print("\nTo test the complete OAuth flow:")
    print("1. Open your browser to: " + FRONTEND_URL)
    print("2. Navigate to the login page")
    print("3. Click the Google Sign-In button")
    print("4. Check the browser's console for any errors")
    print("5. Monitor the backend server's console for incoming requests")
    
    open_browser = input("\nWould you like to open the frontend in your browser? (y/n): ")
    if open_browser.lower() == 'y':
        webbrowser.open(FRONTEND_URL)
        print("Browser opened. Please proceed with testing.")

if __name__ == "__main__":
    test_google_oauth_login()
