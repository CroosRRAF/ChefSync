"""
Delivery Fee Calculation Service

This service calculates dynamic delivery fees based on:
- Order type (Regular vs Bulk)
- Distance (using Google Maps API)
- Time of day (night surcharge)
- Weather conditions (rain surcharge)
"""

import logging
import math
from datetime import datetime, time
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

import googlemaps
import pytz
import requests
from decouple import config
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class DeliveryFeeCalculator:
    """Calculate delivery fees with multiple factors"""
    
    # Configuration from environment variables
    BASE_PRICE = Decimal(config('BASE_DELIVERY_PRICE', default='50'))
    CURRENCY = config('CURRENCY', default='LKR')
    
    # Map API Configuration
    MAP_API_KEY = config('MAP_API_KEY', default='')
    MAP_API_PROVIDER = config('MAP_API_PROVIDER', default='google')
    
    # Weather API Configuration
    WEATHER_API_KEY = config('WEATHER_API_KEY', default='')
    WEATHER_API_PROVIDER = config('WEATHER_API_PROVIDER', default='openweathermap')
    
    # Timezone Configuration
    LOCAL_TIMEZONE = pytz.timezone('Asia/Colombo')  # Sri Lanka timezone (UTC+5:30)
    
    # Surcharge rates
    TIME_SURCHARGE_RATE = Decimal('0.10')  # 10% night surcharge
    WEATHER_SURCHARGE_RATE = Decimal('0.10')  # 10% rain surcharge
    
    # Time boundaries (24-hour format) - in LOCAL time
    NIGHT_START_HOUR = 18  # 6:00 PM Sri Lanka time
    NIGHT_END_HOUR = 5     # 5:00 AM Sri Lanka time
    
    # Distance thresholds
    BASE_DISTANCE_KM = 5
    
    # Rainy weather conditions
    RAINY_CONDITIONS = {'Rain', 'Drizzle', 'Thunderstorm', 'Heavy rain', 'Light rain'}
    
    def __init__(self):
        """Initialize the calculator with API clients"""
        self.gmaps_client = None
        if self.MAP_API_KEY:
            try:
                self.gmaps_client = googlemaps.Client(key=self.MAP_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Google Maps client: {str(e)}")
    
    def calculate_delivery_fee(
        self,
        order_type: str,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        delivery_time: Optional[datetime] = None
    ) -> Dict:
        """
        Calculate delivery fee with all factors
        
        Args:
            order_type: 'regular' or 'bulk'
            origin_lat: Kitchen latitude
            origin_lng: Kitchen longitude
            dest_lat: Delivery destination latitude
            dest_lng: Delivery destination longitude
            delivery_time: Expected delivery time (defaults to now)
        
        Returns:
            Dictionary with fee breakdown
        """
        if delivery_time is None:
            delivery_time = datetime.now(pytz.UTC)
        
        # Step 1: Calculate distance
        distance_result = self.calculate_distance(origin_lat, origin_lng, dest_lat, dest_lng)
        distance_km = distance_result['distance_km']
        route_waypoints = distance_result.get('waypoints', [])
        
        # Step 2: Calculate base distance fee
        distance_fee = self._calculate_distance_fee(order_type, distance_km)
        
        # Step 3: Check time-based surcharge
        time_surcharge = Decimal('0')
        is_night_delivery = self._is_night_time(delivery_time)
        if is_night_delivery:
            time_surcharge = distance_fee * self.TIME_SURCHARGE_RATE
            logger.info(f"💰 Night Surcharge Applied: {distance_fee} × {self.TIME_SURCHARGE_RATE} = {time_surcharge}")
        else:
            logger.info(f"☀️ No Night Surcharge: It's daytime")
        
        # Step 4: Check weather-based surcharge
        weather_surcharge = Decimal('0')
        is_rainy = False
        weather_info = self._check_weather_conditions(
            origin_lat, origin_lng, dest_lat, dest_lng, route_waypoints
        )
        
        if weather_info['is_rainy']:
            is_rainy = True
            weather_surcharge = distance_fee * self.WEATHER_SURCHARGE_RATE
        
        # Step 5: Calculate total
        total_fee = distance_fee + time_surcharge + weather_surcharge
        
        logger.info(f"📊 Final Calculation: Distance={distance_fee} + Night={time_surcharge} + Weather={weather_surcharge} = Total={total_fee}")
        
        return {
            'total_fee': float(total_fee),
            'currency': self.CURRENCY,
            'breakdown': {
                'distance_fee': float(distance_fee),
                'time_surcharge': float(time_surcharge),
                'weather_surcharge': float(weather_surcharge),
            },
            'factors': {
                'distance_km': distance_km,
                'order_type': order_type,
                'is_night_delivery': is_night_delivery,
                'is_rainy': is_rainy,
                'delivery_time': delivery_time.isoformat(),
            },
            'weather_details': weather_info,
            'route_info': distance_result,
        }
    
    def _calculate_distance_fee(self, order_type: str, distance_km: float) -> Decimal:
        """
        Calculate distance-based fee
        
        Regular Order:
        - First 5 km: Base Price (50 LKR)
        - After 5 km: Each additional km = Base Price × 30% (15 LKR/km)
        
        Bulk Order:
        - First 5 km: Base Price × 5 (250 LKR)
        - After 5 km: Each additional km = Base Price × 30% (15 LKR/km)
        """
        if order_type.lower() == 'bulk':
            # Bulk order calculation
            if distance_km <= self.BASE_DISTANCE_KM:
                return self.BASE_PRICE * 5
            else:
                extra_km = distance_km - self.BASE_DISTANCE_KM
                # Per km rate = 30% of base price
                per_km_rate = self.BASE_PRICE * Decimal('0.30')
                extra_fee = Decimal(str(extra_km)) * per_km_rate
                return (self.BASE_PRICE * 5) + extra_fee
        else:
            # Regular order calculation
            if distance_km <= self.BASE_DISTANCE_KM:
                return self.BASE_PRICE
            else:
                extra_km = distance_km - self.BASE_DISTANCE_KM
                # Per km rate = 30% of base price (50 × 0.30 = 15 LKR/km)
                per_km_rate = self.BASE_PRICE * Decimal('0.30')
                extra_fee = Decimal(str(extra_km)) * per_km_rate
                return self.BASE_PRICE + extra_fee
    
    def _is_night_time(self, check_time: datetime) -> bool:
        """
        Check if the given time is during night hours
        Night: 6:00 PM - 5:00 AM (Sri Lanka local time)
        """
        # Convert to local timezone (Sri Lanka)
        if check_time.tzinfo is None:
            check_time = pytz.UTC.localize(check_time)
        local_time = check_time.astimezone(self.LOCAL_TIMEZONE)
        hour = local_time.hour
        
        # DEBUG: Log the time check
        is_night = hour >= self.NIGHT_START_HOUR or hour < self.NIGHT_END_HOUR
        logger.info(f"🌙 Night Check: Sri Lanka time = {local_time.strftime('%Y-%m-%d %H:%M:%S %Z')}, Hour = {hour}, Is Night? = {is_night}")
        
        # Night hours: 18:00 (6 PM) to 05:00 (5 AM)
        return is_night
    
    def calculate_distance(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float
    ) -> Dict:
        """
        Calculate distance using Google Maps Distance Matrix API
        
        Returns:
            Dictionary with distance_km and route waypoints
        """
        # Try Google Maps API first
        if self.gmaps_client:
            try:
                result = self.gmaps_client.distance_matrix(
                    origins=[(origin_lat, origin_lng)],
                    destinations=[(dest_lat, dest_lng)],
                    mode='driving',
                    units='metric'
                )
                
                if result['rows'][0]['elements'][0]['status'] == 'OK':
                    distance_meters = result['rows'][0]['elements'][0]['distance']['value']
                    distance_km = distance_meters / 1000.0
                    
                    # Get route waypoints for weather checking
                    waypoints = self._get_route_waypoints(origin_lat, origin_lng, dest_lat, dest_lng)
                    
                    return {
                        'distance_km': round(distance_km, 2),
                        'distance_meters': distance_meters,
                        'method': 'google_maps_api',
                        'waypoints': waypoints,
                        'success': True
                    }
            except Exception as e:
                logger.warning(f"Google Maps API failed: {str(e)}, falling back to Haversine")
        
        # Fallback to Haversine formula
        distance_km = self._haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
        
        # Generate approximate waypoints
        waypoints = self._generate_approximate_waypoints(
            origin_lat, origin_lng, dest_lat, dest_lng
        )
        
        return {
            'distance_km': round(distance_km, 2),
            'method': 'haversine_fallback',
            'waypoints': waypoints,
            'success': True
        }
    
    def _haversine_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        # Earth radius in kilometers
        R = 6371.0
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        distance = R * c
        return distance
    
    def _get_route_waypoints(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        num_points: int = 3
    ) -> List[Tuple[float, float]]:
        """
        Get waypoints along the route using Google Directions API
        """
        if not self.gmaps_client:
            return self._generate_approximate_waypoints(
                origin_lat, origin_lng, dest_lat, dest_lng, num_points
            )
        
        try:
            directions = self.gmaps_client.directions(
                origin=(origin_lat, origin_lng),
                destination=(dest_lat, dest_lng),
                mode='driving'
            )
            
            if directions:
                # Extract points along the route
                route = directions[0]
                legs = route['legs'][0]
                steps = legs['steps']
                
                # Sample points evenly along the route
                total_steps = len(steps)
                step_interval = max(1, total_steps // num_points)
                
                waypoints = []
                for i in range(0, total_steps, step_interval):
                    if i < total_steps:
                        location = steps[i]['end_location']
                        waypoints.append((location['lat'], location['lng']))
                
                return waypoints[:num_points]
        except Exception as e:
            logger.warning(f"Failed to get route waypoints: {str(e)}")
        
        # Fallback
        return self._generate_approximate_waypoints(
            origin_lat, origin_lng, dest_lat, dest_lng, num_points
        )
    
    def _generate_approximate_waypoints(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        num_points: int = 3
    ) -> List[Tuple[float, float]]:
        """
        Generate approximate waypoints by linear interpolation
        """
        waypoints = []
        for i in range(1, num_points + 1):
            fraction = i / (num_points + 1)
            lat = origin_lat + (dest_lat - origin_lat) * fraction
            lng = origin_lng + (dest_lng - origin_lng) * fraction
            waypoints.append((lat, lng))
        return waypoints
    
    def _check_weather_conditions(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        waypoints: List[Tuple[float, float]]
    ) -> Dict:
        """
        Check weather conditions at origin, destination, and waypoints
        """
        if not self.WEATHER_API_KEY:
            logger.warning("Weather API key not configured, skipping weather check")
            return {
                'is_rainy': False,
                'checked_locations': [],
                'message': 'Weather API not configured'
            }
        
        # Locations to check
        locations = [
            ('origin', origin_lat, origin_lng),
            ('destination', dest_lat, dest_lng),
        ]
        
        # Add waypoints
        for i, (lat, lng) in enumerate(waypoints[:3]):  # Max 3 waypoints
            locations.append((f'waypoint_{i+1}', lat, lng))
        
        checked_locations = []
        is_rainy = False
        
        for location_name, lat, lng in locations:
            weather_data = self._get_weather_for_location(lat, lng)
            
            if weather_data:
                condition = weather_data.get('condition', 'Unknown')
                is_location_rainy = any(
                    rainy in condition for rainy in self.RAINY_CONDITIONS
                )
                
                checked_locations.append({
                    'location': location_name,
                    'lat': lat,
                    'lng': lng,
                    'condition': condition,
                    'is_rainy': is_location_rainy
                })
                
                if is_location_rainy:
                    is_rainy = True
        
        return {
            'is_rainy': is_rainy,
            'checked_locations': checked_locations,
            'message': f'Checked {len(checked_locations)} locations'
        }
    
    def _get_weather_for_location(self, lat: float, lng: float) -> Optional[Dict]:
        """
        Get weather data for a specific location using OpenWeatherMap API
        """
        # Check cache first (cache for 15 minutes)
        cache_key = f'weather_{lat}_{lng}'
        cached_weather = cache.get(cache_key)
        if cached_weather:
            return cached_weather
        
        try:
            if self.WEATHER_API_PROVIDER == 'openweathermap':
                url = 'https://api.openweathermap.org/data/2.5/weather'
                params = {
                    'lat': lat,
                    'lon': lng,
                    'appid': self.WEATHER_API_KEY,
                    'units': 'metric'
                }
                
                response = requests.get(url, params=params, timeout=5)
                response.raise_for_status()
                
                data = response.json()
                weather_data = {
                    'condition': data['weather'][0]['main'],
                    'description': data['weather'][0]['description'],
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity']
                }
                
                # Cache for 15 minutes
                cache.set(cache_key, weather_data, 60 * 15)
                return weather_data
        except Exception as e:
            logger.warning(f"Failed to get weather for location ({lat}, {lng}): {str(e)}")
        
        return None


# Singleton instance
delivery_fee_calculator = DeliveryFeeCalculator()

