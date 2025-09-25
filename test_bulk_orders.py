import requests
import json

# Test the bulk orders API
api_url = 'http://127.0.0.1:8000/api/orders/bulk/'

try:
    print(f"Testing API endpoint: {api_url}")
    response = requests.get(api_url)
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data)} bulk orders")
        if data:
            print("First bulk order:")
            print(json.dumps(data[0], indent=2))
    else:
        print(f"Error response: {response.text}")
        
    # Test stats endpoint
    stats_url = 'http://127.0.0.1:8000/api/orders/bulk/stats/'
    print(f"\nTesting stats endpoint: {stats_url}")
    stats_response = requests.get(stats_url)
    print(f"Stats Status Code: {stats_response.status_code}")
    if stats_response.status_code == 200:
        stats_data = stats_response.json()
        print("Bulk order stats:")
        print(json.dumps(stats_data, indent=2))
    else:
        print(f"Stats error: {stats_response.text}")
        
except Exception as e:
    print(f"Error testing API: {e}")