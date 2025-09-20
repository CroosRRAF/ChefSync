#!/usr/bin/env python3
"""
Test script to check API endpoints directly
"""
import requests
import json
import os

def test_api_endpoints():
    base_url = 'http://localhost:8000/api'

    print('🧪 Testing API endpoints...\n')

    # Test without authentication first
    print('1. Testing cooks endpoint (no auth):')
    try:
        response = requests.get(f'{base_url}/auth/admin/pending-approvals/?role=cook')
        print(f'Status: {response.status_code}')
        print(f'Response: {json.dumps(response.json(), indent=2)}')
    except Exception as e:
        print(f'Error: {e}')

    print('\n2. Testing delivery agents endpoint (no auth):')
    try:
        response = requests.get(f'{base_url}/auth/admin/pending-approvals/?role=delivery_agent')
        print(f'Status: {response.status_code}')
        print(f'Response: {json.dumps(response.json(), indent=2)}')
    except Exception as e:
        print(f'Error: {e}')

    # Check for token in environment or create a test admin user
    print('\n🔐 Testing with authentication...\n')

    # First, let's try to get an admin token by creating a test admin user
    print('3. Creating test admin user...')
    try:
        # Register an admin user
        register_data = {
            'name': 'Test Admin',
            'email': 'admin@test.com',
            'phone_no': '+1234567890',
            'password': 'testpass123',
            'confirm_password': 'testpass123',
            'role': 'admin'
        }

        response = requests.post(f'{base_url}/auth/register/', json=register_data)
        print(f'Register response: {response.status_code}')
        if response.status_code == 201:
            print('✅ Admin user registered successfully')
        else:
            print(f'Response: {response.json()}')

        # Try to login
        login_data = {
            'email': 'admin@test.com',
            'password': 'testpass123'
        }

        response = requests.post(f'{base_url}/auth/login/', json=login_data)
        print(f'Login response: {response.status_code}')

        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            print('✅ Login successful, got token')

            # Test endpoints with authentication
            headers = {'Authorization': f'Bearer {token}'}

            print('\n4. Testing cooks endpoint (authenticated):')
            response = requests.get(f'{base_url}/auth/admin/pending-approvals/?role=cook', headers=headers)
            print(f'Status: {response.status_code}')
            if response.status_code == 200:
                print(f'Response: {json.dumps(response.json(), indent=2)}')
            else:
                print(f'Error response: {response.text}')

            print('\n5. Testing delivery agents endpoint (authenticated):')
            response = requests.get(f'{base_url}/auth/admin/pending-approvals/?role=delivery_agent', headers=headers)
            print(f'Status: {response.status_code}')
            if response.status_code == 200:
                print(f'Response: {json.dumps(response.json(), indent=2)}')
            else:
                print(f'Error response: {response.text}')

        else:
            print(f'Login failed: {response.json()}')

    except Exception as e:
        print(f'Authentication test error: {e}')

if __name__ == '__main__':
    test_api_endpoints()