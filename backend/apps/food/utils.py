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
    - First 5 km: ₹50 (base fee)
    - After 5 km: ₹15 per additional km
    
    Args:
        user_lat: User's latitude
        user_lng: User's longitude  
        kitchen_lat: Kitchen's latitude
        kitchen_lng: Kitchen's longitude
        
    Returns:
        Dict with distance, fees, and total
    """
    distance = calculate_distance(user_lat, user_lng, kitchen_lat, kitchen_lng)
    
    BASE_FEE = Decimal('50.00')
    ADDITIONAL_FEE_PER_KM = Decimal('15.00')
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
        Estimated total time in minutes
    """
    # Assume average delivery speed of 20 km/h
    DELIVERY_SPEED_KMH = 20
    travel_time_minutes = (distance_km / DELIVERY_SPEED_KMH) * 60
    
    # Add 5 minutes buffer time
    buffer_time = 5
    
    total_time = preparation_time_minutes + travel_time_minutes + buffer_time
    return int(round(total_time))


def validate_delivery_radius(kitchen_lat: float, kitchen_lng: float, user_lat: float, user_lng: float, max_radius_km: int = 25) -> Dict[str, Any]:
    """
    Check if delivery location is within kitchen's service radius
    
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
=======
        Dictionary containing delivery fee information
    """
    try:
        # Calculate distance using Haversine formula
        distance_km = calculate_distance(user_lat, user_lng, kitchen_lat, kitchen_lng)
        
        # Base delivery fee
        base_fee = 2.0
        
        # Distance-based fee (additional fee per km after first 5km)
        if distance_km <= 5:
            distance_fee = 0
        else:
            distance_fee = (distance_km - 5) * 0.5
        
        # Time-based fee (rush hour multiplier)
        from datetime import datetime
        current_hour = datetime.now().hour
        time_multiplier = 1.0
        
        # Rush hour (11:30-14:00 and 18:00-21:00)
        if (11.5 <= current_hour <= 14) or (18 <= current_hour <= 21):
            time_multiplier = 1.2
        
        # Calculate total delivery fee
        total_delivery_fee = (base_fee + distance_fee) * time_multiplier
        
        # Estimated delivery time (base 30 minutes + 2 minutes per km)
        estimated_time_minutes = 30 + (distance_km * 2)
        
        return {
            'distance_km': round(distance_km, 2),
            'base_fee': base_fee,
            'distance_fee': round(distance_fee, 2),
            'time_multiplier': time_multiplier,
            'total_delivery_fee': round(total_delivery_fee, 2),
            'estimated_delivery_time_minutes': int(estimated_time_minutes),
            'estimated_delivery_time_formatted': f"{int(estimated_time_minutes // 60)}h {int(estimated_time_minutes % 60)}m" if estimated_time_minutes >= 60 else f"{int(estimated_time_minutes)}m"
        }
        
    except Exception as e:
        # Return default values if calculation fails
        return {
            'distance_km': 0,
            'base_fee': 2.0,
            'distance_fee': 0,
            'time_multiplier': 1.0,
            'total_delivery_fee': 2.0,
            'estimated_delivery_time_minutes': 30,
            'estimated_delivery_time_formatted': '30m',
            'error': str(e)
        }


def validate_delivery_radius(kitchen_lat: float, kitchen_lng: float, user_lat: float, user_lng: float, max_radius_km: float = 25) -> Dict[str, Any]:
    """
    Validate if user is within delivery radius of the kitchen.
    
    Args:
        kitchen_lat: Kitchen's latitude
        kitchen_lng: Kitchen's longitude
        user_lat: User's latitude
        user_lng: User's longitude
        max_radius_km: Maximum delivery radius in kilometers
        
    Returns:
        Dictionary containing validation results
    """
    try:
        distance_km = calculate_distance(kitchen_lat, kitchen_lng, user_lat, user_lng)
        
        is_within_radius = distance_km <= max_radius_km
        
        return {
            'is_within_radius': is_within_radius,
            'distance_km': round(distance_km, 2),
            'max_radius_km': max_radius_km,
            'message': f"Delivery available within {max_radius_km}km" if is_within_radius else f"Delivery not available - {round(distance_km, 2)}km exceeds {max_radius_km}km limit"
        }
        
    except Exception as e:
        return {
            'is_within_radius': False,
            'distance_km': 0,
            'max_radius_km': max_radius_km,
            'message': f'Error calculating distance: {str(e)}',
            'error': str(e)
        }


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth using Haversine formula.
    
    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point
        
    Returns:
        Distance in kilometers
    """
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r
>>>>>>> admin-dev-main
