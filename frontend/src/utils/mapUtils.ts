// Utility functions for Google Maps integration

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

/**
 * Geocode an address to get latitude and longitude
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const geocoder = new google.maps.Geocoder();
  
  try {
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });

    if (result && result.length > 0) {
      const location = result[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng(),
        formatted_address: result[0].formatted_address,
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const geocoder = new google.maps.Geocoder();
  const latlng = { lat, lng };
  
  try {
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });

    if (result && result.length > 0) {
      return result[0].formatted_address;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }

  return null;
};

/**
 * Calculate distance between two points using Google Maps Distance Matrix
 */
export const calculateDistance = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance: string; duration: string } | null> => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const service = new google.maps.DistanceMatrixService();
  
  try {
    const result = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Distance calculation failed: ${status}`));
        }
      });
    });

    const element = result.rows[0]?.elements[0];
    if (element && element.status === 'OK') {
      return {
        distance: element.distance.text,
        duration: element.duration.text,
      };
    }
  } catch (error) {
    console.error('Distance calculation error:', error);
  }

  return null;
};

/**
 * Get optimized route for multiple waypoints
 */
export const getOptimizedRoute = async (
  origin: { lat: number; lng: number },
  destinations: Array<{ lat: number; lng: number }>,
  returnToOrigin = false
): Promise<google.maps.DirectionsResult | null> => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const directionsService = new google.maps.DirectionsService();
  
  try {
    const waypoints = destinations.slice(0, -1).map(dest => ({
      location: dest,
      stopover: true,
    }));

    const destination = returnToOrigin ? origin : destinations[destinations.length - 1];

    const result = await directionsService.route({
      origin,
      destination,
      waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    });

    return result;
  } catch (error) {
    console.error('Route optimization error:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistanceHaversine = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Estimate travel time based on distance
 */
export const estimateTravelTime = (distanceKm: number, mode: 'driving' | 'walking' | 'cycling' = 'driving'): number => {
  const speeds = {
    driving: 40, // km/h average city driving
    cycling: 15, // km/h average cycling
    walking: 5   // km/h average walking
  };
  
  return Math.round((distanceKm / speeds[mode]) * 60); // Return time in minutes
};

/**
 * Generate Google Maps navigation URL
 */
export const generateNavigationUrl = (
  destination: { lat: number; lng: number } | string,
  origin?: { lat: number; lng: number },
  travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): string => {
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  let url = baseUrl;
  
  if (origin) {
    url += `${origin.lat},${origin.lng}/`;
  }
  
  if (typeof destination === 'string') {
    url += encodeURIComponent(destination);
  } else {
    url += `${destination.lat},${destination.lng}`;
  }
  
  return url;
};

/**
 * Check if user is within delivery radius of a location
 */
export const isWithinDeliveryRadius = (
  userLocation: { lat: number; lng: number },
  destinationLocation: { lat: number; lng: number },
  radiusKm: number = 0.1 // 100 meters default
): boolean => {
  const distance = calculateDistanceHaversine(userLocation, destinationLocation);
  return distance <= radiusKm;
};

/**
 * Format location coordinates for display
 */
export const formatLocation = (location: { lat: number; lng: number }, precision: number = 6): string => {
  return `${location.lat.toFixed(precision)}, ${location.lng.toFixed(precision)}`;
};
