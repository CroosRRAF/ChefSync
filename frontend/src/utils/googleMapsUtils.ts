import { LatLng } from '@/types/customer';

// Distance calculation using Haversine formula
export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate delivery fee based on distance
export const calculateDeliveryFee = (distanceKm: number): number => {
  if (distanceKm <= 5) {
    return 50; // LKR 50 for first 5 km
  }
  const extraKm = distanceKm - 5;
  return 50 + (Math.ceil(extraKm) * 15); // LKR 15 per km after 5 km
};

// Get current location using browser geolocation
export const getCurrentLocation = (): Promise<LatLng> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const geocoder = new google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error('Geocoding failed'));
        }
      }
    );
  });
};

// Calculate distance using Google Maps Distance Matrix API
export const calculateDistanceWithGoogleMaps = async (
  origin: LatLng,
  destination: LatLng
): Promise<{ distance: number; duration: number }> => {
  const service = new google.maps.DistanceMatrixService();
  
  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            const distanceInMeters = element.distance.value;
            const durationInSeconds = element.duration.value;
            resolve({
              distance: distanceInMeters / 1000, // Convert to kilometers
              duration: durationInSeconds / 60,   // Convert to minutes
            });
          } else {
            reject(new Error('Route not found'));
          }
        } else {
          reject(new Error('Distance calculation failed'));
        }
      }
    );
  });
};

// Default Sri Lanka center (Colombo)
export const DEFAULT_CENTER: LatLng = {
  lat: 6.9271,
  lng: 79.8612,
};

// Check if coordinates are within Sri Lanka bounds (approximate)
export const isWithinSriLanka = (location: LatLng): boolean => {
  return (
    location.lat >= 5.9 && location.lat <= 9.9 &&
    location.lng >= 79.5 && location.lng <= 81.9
  );
};