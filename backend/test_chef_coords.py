"""
Simulate a typical API request to place an order with mock chef coordinates.
This simulates the frontend providing chef_latitude and chef_longitude
from a source like Google Maps or GPS when the chef's kitchen_location is missing.
"""
import requests
import json

# Demo coordinates for Mumbai
chef_coords = {
    "chef_latitude": 19.076,
    "chef_longitude": 72.8777
}

# Mock order data that might come from frontend
order_data = {
    "chef_id": 1,
    "delivery_latitude": 19.0760,
    "delivery_longitude": 72.8777,
    "customer_notes": "Test order with chef coordinates",
    # Include chef coords to test fallback
    **chef_coords
}

print("Order data to test:")
print(json.dumps(order_data, indent=2))

print("\nThis simulates frontend providing chef coordinates when kitchen_location is missing")
print("Backend should now accept these coordinates and persist them to avoid future 400 errors")