"""
Utility functions for food delivery calculations
"""
import math
from typing import Dict, Any
from decimal import Decimal


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the distance between two points using Haversine formula
    Returns distance in kilometers
    """
    # Convert latitude and longitude from degrees to radians
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


def calculate_delivery_fee(user_lat: float, user_lng: float, kitchen_lat: float, kitchen_lng: float) -> Dict[str, Any]:
    """
    Calculate delivery fee based on distance between user and kitchen location
    
    Fee Structure:
    - First 5 km: LKR 300 (base fee)
    - After 5 km: LKR 100 per additional km
    
    Args:
        user_lat: User's latitude
        user_lng: User's longitude  
        kitchen_lat: Kitchen's latitude
        kitchen_lng: Kitchen's longitude
        
    Returns:
        Dict with distance, fees, and total
    """
    distance = calculate_distance(user_lat, user_lng, kitchen_lat, kitchen_lng)
    
    BASE_FEE = Decimal('300.00')
    ADDITIONAL_FEE_PER_KM = Decimal('100.00')
    FREE_DISTANCE_KM = 5
    
    if distance <= FREE_DISTANCE_KM:
        delivery_fee = BASE_FEE
        additional_fee = Decimal('0.00')
    else:
        additional_km = distance - FREE_DISTANCE_KM
        additional_fee = Decimal(str(additional_km)) * ADDITIONAL_FEE_PER_KM
        delivery_fee = BASE_FEE + additional_fee
    
    return {
        'distance_km': round(distance, 2),
        'base_fee': float(BASE_FEE),
        'additional_fee': float(additional_fee),
        'total_delivery_fee': float(delivery_fee),
        'free_distance_km': FREE_DISTANCE_KM
    }


def estimate_delivery_time(distance_km: float, preparation_time_minutes: int = 30) -> int:
    """
    Estimate total delivery time including preparation and travel
    
    Args:
        distance_km: Distance to delivery location
        preparation_time_minutes: Food preparation time
        
    Returns:
        Total estimated time in minutes
    """
    # Average delivery speed: 20 km/h in city traffic
    travel_time_minutes = (distance_km / 20) * 60
    
    return int(preparation_time_minutes + travel_time_minutes)


def validate_delivery_radius(kitchen_lat: float, kitchen_lng: float, user_lat: float, user_lng: float, max_radius_km: float = 25.0) -> Dict[str, Any]:
    """
    Validate if user location is within delivery radius
    
    Args:
        kitchen_lat: Kitchen latitude
        kitchen_lng: Kitchen longitude
        user_lat: User latitude
        user_lng: User longitude
        max_radius_km: Maximum delivery radius in km
        
    Returns:
        Dict with validation result and details
    """
    distance = calculate_distance(kitchen_lat, kitchen_lng, user_lat, user_lng)
    
    is_deliverable = distance <= max_radius_km
    
    return {
        'is_deliverable': is_deliverable,
        'distance_km': round(distance, 2),
        'max_radius_km': max_radius_km,
        'message': 'Delivery available' if is_deliverable else f'Location is outside delivery radius ({max_radius_km}km)'
    }