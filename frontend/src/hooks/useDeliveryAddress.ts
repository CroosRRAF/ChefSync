import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface DeliveryAddress {
  id: number;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

// Mock data for development
const mockAddresses: DeliveryAddress[] = [
  {
    id: 1,
    label: "Home",
    address_line1: "123 Main Street, Apartment 4B",
    address_line2: "Near Central Park",
    city: "Colombo",
    pincode: "00100",
    latitude: 6.9271,
    longitude: 79.8612,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    label: "Work",
    address_line1: "456 Business Avenue, Floor 12",
    city: "Colombo",
    pincode: "00200",
    latitude: 6.9344,
    longitude: 79.8428,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useDeliveryAddress = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(false);

  // Load addresses (replace with actual API call)
  const loadAddresses = async (): Promise<DeliveryAddress[]> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const loadedAddresses = [...mockAddresses];
      setAddresses(loadedAddresses);
      return loadedAddresses;
    } catch (error) {
      console.error('Error loading addresses:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add new address
  const addAddress = async (addressData: Omit<DeliveryAddress, 'id' | 'created_at' | 'updated_at'>): Promise<DeliveryAddress> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAddress: DeliveryAddress = {
        id: Date.now(),
        ...addressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAddresses(prev => [...prev, newAddress]);
      return newAddress;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  };

  // Update address
  const updateAddress = async (addressId: number, addressData: Partial<DeliveryAddress>): Promise<DeliveryAddress> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedAddress = { 
        ...addresses.find(addr => addr.id === addressId)!, 
        ...addressData,
        updated_at: new Date().toISOString()
      };

      setAddresses(prev => prev.map(addr => 
        addr.id === addressId ? updatedAddress : addr
      ));
      
      return updatedAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  // Delete address
  const deleteAddress = async (addressId: number): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId: number): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAddresses(prev => prev.map(addr => ({ 
        ...addr, 
        is_default: addr.id === addressId 
      })));
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  };

  // Get current location
  const getCurrentLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Failed to get current location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      );
    });
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (latitude: number, longitude: number): Promise<GeocodeResult> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps API not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            
            // Parse address components
            let city = '';
            let pincode = '';

            result.address_components?.forEach(component => {
              const types = component.types;
              
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
              
              if (types.includes('postal_code')) {
                pincode = component.long_name;
              }
            });

            resolve({
              address: result.formatted_address,
              city: city || 'Unknown',
              pincode: pincode || '',
              latitude,
              longitude
            });
          } else {
            reject(new Error('Failed to reverse geocode location'));
          }
        }
      );
    });
  };

  // Load Google Maps API
  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        reject(new Error('Google Maps API key not found in environment variables'));
        return;
      }

      // Check if already loaded
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      
      document.head.appendChild(script);
    });
  };

  // Get default address
  const getDefaultAddress = (): DeliveryAddress | null => {
    return addresses.find(addr => addr.is_default) || null;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return Math.round(d * 100) / 100; // Round to 2 decimal places
  };

  // Calculate delivery fee based on distance (example calculation)
  const calculateDeliveryFee = (distanceKm: number): number => {
    const baseDeliveryFee = 200; // Base fee in LKR
    const additionalFeePerKm = 50; // Additional fee per km
    const freeDeliveryDistance = 5; // Free delivery within 5km
    
    if (distanceKm <= freeDeliveryDistance) {
      return baseDeliveryFee;
    }
    
    const additionalDistance = distanceKm - freeDeliveryDistance;
    return baseDeliveryFee + (additionalDistance * additionalFeePerKm);
  };

  return {
    addresses,
    loading,
    loadAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getCurrentLocation,
    reverseGeocode,
    loadGoogleMapsAPI,
    getDefaultAddress,
    calculateDistance,
    calculateDeliveryFee
  };
};