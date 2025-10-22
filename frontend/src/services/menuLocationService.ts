// Google Maps Location Service for Menu System
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationDetails extends LocationCoordinates {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface MapConfig {
  center: LocationCoordinates;
  zoom: number;
  apiKey: string;
}

class MenuLocationService {
  private googleMapsLoaded = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Load Google Maps JavaScript API
   */
  async loadGoogleMaps(): Promise<void> {
    if (this.googleMapsLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        this.googleMapsLoaded = true;
        resolve();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        reject(new Error('Google Maps API key not found in environment variables'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.googleMapsLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Get user's current location using browser geolocation
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Get address details from coordinates using reverse geocoding
   */
  async getAddressFromCoordinates(coordinates: LocationCoordinates): Promise<LocationDetails> {
    await this.loadGoogleMaps();

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      const latLng = new google.maps.LatLng(coordinates.latitude, coordinates.longitude);

      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];
          const components = result.address_components;

          const locationDetails: LocationDetails = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            address: result.formatted_address,
          };

          // Extract address components
          components?.forEach((component) => {
            const types = component.types;
            if (types.includes('locality')) {
              locationDetails.city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              locationDetails.state = component.long_name;
            } else if (types.includes('country')) {
              locationDetails.country = component.long_name;
            } else if (types.includes('postal_code')) {
              locationDetails.postal_code = component.long_name;
            }
          });

          resolve(locationDetails);
        } else {
          reject(new Error('Failed to get address from coordinates'));
        }
      });
    });
  }

  /**
   * Get coordinates from an address using geocoding
   */
  async getCoordinatesFromAddress(address: string): Promise<LocationDetails> {
    await this.loadGoogleMaps();

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];
          const location = result.geometry.location;
          const components = result.address_components;

          const locationDetails: LocationDetails = {
            latitude: location.lat(),
            longitude: location.lng(),
            address: result.formatted_address,
          };

          // Extract address components
          components?.forEach((component) => {
            const types = component.types;
            if (types.includes('locality')) {
              locationDetails.city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              locationDetails.state = component.long_name;
            } else if (types.includes('country')) {
              locationDetails.country = component.long_name;
            } else if (types.includes('postal_code')) {
              locationDetails.postal_code = component.long_name;
            }
          });

          resolve(locationDetails);
        } else {
          reject(new Error('Failed to get coordinates from address'));
        }
      });
    });
  }

  /**
   * Calculate distance between two points (in kilometers)
   */
  calculateDistance(point1: LocationCoordinates, point2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    const lat1 = this.toRadians(point1.latitude);
    const lat2 = this.toRadians(point2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return parseFloat(distance.toFixed(2));
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create a Google Maps instance
   */
  async createMap(container: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map> {
    await this.loadGoogleMaps();
    return new google.maps.Map(container, options);
  }

  /**
   * Create a marker on the map
   */
  createMarker(map: google.maps.Map, position: LocationCoordinates, options?: google.maps.MarkerOptions): google.maps.Marker {
    return new google.maps.Marker({
      position: { lat: position.latitude, lng: position.longitude },
      map,
      ...options,
    });
  }

  /**
   * Create an autocomplete input field
   */
  async createAutocomplete(input: HTMLInputElement, options?: google.maps.places.AutocompleteOptions): Promise<google.maps.places.Autocomplete> {
    await this.loadGoogleMaps();
    return new google.maps.places.Autocomplete(input, options);
  }

  /**
   * Save location to localStorage
   */
  saveLocation(location: LocationDetails, key: string = 'userLocation'): void {
    localStorage.setItem(key, JSON.stringify(location));
  }

  /**
   * Get saved location from localStorage
   */
  getSavedLocation(key: string = 'userLocation'): LocationDetails | null {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear saved location
   */
  clearSavedLocation(key: string = 'userLocation'): void {
    localStorage.removeItem(key);
  }

  /**
   * Get default location (fallback)
   */
  getDefaultLocation(): LocationCoordinates {
    // Default to Sri Lanka center
    return {
      latitude: 7.8731,
      longitude: 80.7718,
    };
  }
}

export const menuLocationService = new MenuLocationService();
export default menuLocationService;