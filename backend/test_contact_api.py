#!/usr/bin/env python3
"""
Simple script to test the contact API endpoint
"""
import json

import requests


def test_contact_endpoint():
    url = "http://127.0.0.1:8000/api/communications/contacts/"

    # Test data
    contact_data = {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "subject": "Test Contact Form",
        "message": "This is a test message to verify the contact form integration is working properly."
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        print("Testing Contact API endpoint...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(contact_data, indent=2)}")

        response = requests.post(url, json=contact_data, headers=headers)

        print(f"\nResponse Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 201:
            response_data = response.json()
            print(f"✅ SUCCESS: Contact form submitted successfully!")
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
            return True
        else:
            print(f"❌ ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error Text: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_contact_endpoint()
    print(f"\n{'='*50}")
    if success:
        print("✅ Contact API Test PASSED")
    else:
        print("❌ Contact API Test FAILED")
    print(f"{'='*50}")        print("❌ Contact API Test FAILED")
    print(f"{'='*50}")
