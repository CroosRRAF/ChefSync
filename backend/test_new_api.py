import test_data = {
    "name": "Test Food Item",
    "description": "A test food item description",
    "category": "Main Course",
    "ingredients": "tomato, cheese, bread",  # This should trigger the validation fix
    "is_vegetarian": True,
    "is_vegan": False,
    "spice_level": "mild",  # Use lowercase as per model choices
    "is_available": True,
    "price": "12.50",
    "size": "Medium",
    "preparation_time": 15
}ort json

# Test the API with the fixed serializer on the server
url = "http://127.0.0.1:8000/api/food/chef/foods/"

# Test data similar to what the frontend sends
test_data = {
    "name": "Test Food Item",
    "description": "A test food item description",
    "category": "Main Course",
    "ingredients": "tomato, cheese, bread",  # This should trigger the validation fix
    "is_vegetarian": True,
    "is_vegan": False,
    "spice_level": "Mild",
    "is_available": True,
    "price": "12.50",
    "size": "Medium",
    "preparation_time": 15
}

# Get auth token first
auth_url = "http://127.0.0.1:8000/api/auth/login/"
auth_data = {
    "email": "test_cook@example.com",  # Using an existing cook user
    "password": "testpass123"
}

print("Getting auth token...")
try:
    auth_response = requests.post(auth_url, json=auth_data)
    print(f"Auth response status: {auth_response.status_code}")
    print(f"Auth response content: {auth_response.text}")
    if auth_response.status_code == 200:
        response_data = auth_response.json()
        print(f"Full response data: {response_data}")
        # Try different token field names
        token = response_data.get('access_token') or response_data.get('access') or response_data.get('token')
        print(f"Token received: {token[:20]}..." if token else "No token")
        
        if token:
            # Test food creation with token
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            print(f"\nTesting food creation with data: {test_data}")
            response = requests.post(url, json=test_data, headers=headers)
            print(f"Food creation response status: {response.status_code}")
            print(f"Response content: {response.text}")
            
            if response.status_code != 201:
                try:
                    error_data = response.json()
                    print(f"ERROR DETAILS: {error_data}")
                except:
                    print("Could not parse error response as JSON")
        else:
            print("No valid token found in response")
    else:
        print(f"Auth failed: {auth_response.text}")
        
except Exception as e:
    print(f"Error: {e}")