import math
from typing import Dict, Any


def calculate_delivery_fee(user_lat: float, user_lng: float, kitchen_lat: float, kitchen_lng: float) -> Dict[str, Any]:
    """
    Calculate delivery fee based on distance between user and kitchen location.
    
    Args:
        user_lat: User's latitude
        user_lng: User's longitude  
        kitchen_lat: Kitchen's latitude
        kitchen_lng: Kitchen's longitude
        
    Returns:
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
