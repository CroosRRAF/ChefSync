import { useState, useEffect } from 'react';

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

// Mock data for development with Sri Lankan locations
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

// Sri Lankan cities with coordinates
const sriLankanCities: { [key: string]: { lat: number; lng: number; pincode: string } } = {
  'Colombo': { lat: 6.9271, lng: 79.8612, pincode: '00100' },
  'Kandy': { lat: 7.2906, lng: 80.6337, pincode: '20000' },
  'Galle': { lat: 6.0535, lng: 80.2210, pincode: '80000' },
  'Jaffna': { lat: 9.6615, lng: 80.0255, pincode: '40000' },
  'Negombo': { lat: 7.2084, lng: 79.8358, pincode: '11500' },
  'Anuradhapura': { lat: 8.3114, lng: 80.4037, pincode: '50000' },
  'Trincomalee': { lat: 8.5874, lng: 81.2152, pincode: '31000' },
  'Batticaloa': { lat: 7.7210, lng: 81.6853, pincode: '30000' },
  'Kurunegala': { lat: 7.4818, lng: 80.3609, pincode: '60000' },
  'Ratnapura': { lat: 6.6828, lng: 80.4034, pincode: '70000' },
  'Matara': { lat: 5.9549, lng: 80.5550, pincode: '81000' },
  'Badulla': { lat: 6.9934, lng: 81.0550, pincode: '90000' }
};

export const useSimpleDeliveryAddress = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(false);

  // Load addresses from localStorage or use mock data
  const loadAddresses = async (): Promise<DeliveryAddress[]> => {
    setLoading(true);
    try {
      // Try to load from localStorage first
      const savedAddresses = localStorage.getItem('deliveryAddresses');
      let loadedAddresses: DeliveryAddress[] = [];
      
      if (savedAddresses) {
        loadedAddresses = JSON.parse(savedAddresses);
      } else {
        // Use mock data if no saved addresses
        loadedAddresses = [...mockAddresses];
        localStorage.setItem('deliveryAddresses', JSON.stringify(loadedAddresses));
      }
      
      setAddresses(loadedAddresses);
      return loadedAddresses;
    } catch (error) {
      console.error('Error loading addresses:', error);
      // Fallback to mock data
      setAddresses(mockAddresses);
      return mockAddresses;
    } finally {
      setLoading(false);
    }
  };

  // Save addresses to localStorage
  const saveAddresses = (addressList: DeliveryAddress[]) => {
    try {
      localStorage.setItem('deliveryAddresses', JSON.stringify(addressList));
      setAddresses(addressList);
    } catch (error) {
      console.error('Error saving addresses:', error);
    }
  };

  // Add new address
  const addAddress = async (addressData: Omit<DeliveryAddress, 'id' | 'created_at' | 'updated_at'>): Promise<DeliveryAddress> => {
    try {
      const newAddress: DeliveryAddress = {
        id: Date.now(),
        ...addressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedAddresses = [...addresses, newAddress];
      saveAddresses(updatedAddresses);
      
      return newAddress;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  };

  // Update address
  const updateAddress = async (addressId: number, addressData: Partial<DeliveryAddress>): Promise<DeliveryAddress> => {
    try {
      const updatedAddresses = addresses.map(addr => {
        if (addr.id === addressId) {
          return { 
            ...addr, 
            ...addressData,
            updated_at: new Date().toISOString()
          };
        }
        return addr;
      });
      
      const updatedAddress = updatedAddresses.find(addr => addr.id === addressId)!;
      saveAddresses(updatedAddresses);
      
      return updatedAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  // Delete address
  const deleteAddress = async (addressId: number): Promise<void> => {
    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      saveAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId: number): Promise<void> => {
    try {
      const updatedAddresses = addresses.map(addr => ({ 
        ...addr, 
        is_default: addr.id === addressId 
      }));
      saveAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  };

  // Get current location with improved accuracy and error handling
  const getCurrentLocation = (options?: PositionOptions): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 20000, // 20 seconds timeout
        maximumAge: 60000 // Cache for 1 minute
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Try to get high accuracy location first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          // If high accuracy fails, try with lower accuracy
          if (finalOptions.enableHighAccuracy) {
            const lowAccuracyOptions = {
              ...finalOptions,
              enableHighAccuracy: false,
              timeout: 10000
            };

            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              (lowAccuracyError) => {
                let errorMessage = 'Failed to get current location';
                
                switch (lowAccuracyError.code) {
                  case lowAccuracyError.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services and refresh the page.';
                    break;
                  case lowAccuracyError.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable. Please check your internet connection.';
                    break;
                  case lowAccuracyError.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
                  default:
                    errorMessage = 'An unknown error occurred while getting your location.';
                    break;
                }
                
                reject(new Error(errorMessage));
              },
              lowAccuracyOptions
            );
          } else {
            let errorMessage = 'Failed to get current location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location services and refresh the page.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your internet connection.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'An unknown error occurred while getting your location.';
                break;
            }
            
            reject(new Error(errorMessage));
          }
        },
        finalOptions
      );
    });
  };

  // Simple reverse geocoding without external API
  const reverseGeocode = async (latitude: number, longitude: number): Promise<{
    address: string;
    city: string;
    pincode: string;
  }> => {
    try {
      // Find the nearest city based on coordinates
      let nearestCity = 'Colombo';
      let minDistance = Infinity;

      Object.entries(sriLankanCities).forEach(([cityName, cityData]) => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          cityData.lat, 
          cityData.lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = cityName;
        }
      });

      const cityData = sriLankanCities[nearestCity];
      
      return {
        address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        city: nearestCity,
        pincode: cityData.pincode
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Fallback to Colombo
      return {
        address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        city: 'Colombo',
        pincode: '00100'
      };
    }
  };

  // Get default address
  const getDefaultAddress = (): DeliveryAddress | null => {
    return addresses.find(addr => addr.is_default) || null;
  };

  // Calculate distance between two coordinates using Haversine formula
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

  // Calculate delivery fee based on distance
  // Fee Structure: LKR 300 within 5 km, LKR 100 per km after 5 km
  const calculateDeliveryFee = (distanceKm: number): number => {
    const baseDeliveryFee = 300; // Base fee in LKR
    const additionalFeePerKm = 100; // Additional fee per km
    const freeDeliveryDistance = 5; // Free delivery within 5km
    
    if (distanceKm <= freeDeliveryDistance) {
      return baseDeliveryFee;
    }
    
    const additionalDistance = distanceKm - freeDeliveryDistance;
    return Math.round(baseDeliveryFee + (additionalDistance * additionalFeePerKm));
  };

  // Get city coordinates
  const getCityCoordinates = (cityName: string): LocationCoords | null => {
    const cityData = sriLankanCities[cityName];
    if (cityData) {
      return {
        latitude: cityData.lat,
        longitude: cityData.lng
      };
    }
    return null;
  };

  // Initialize addresses on hook mount
  useEffect(() => {
    loadAddresses();
  }, []);

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
    getDefaultAddress,
    calculateDistance,
    calculateDeliveryFee,
    getCityCoordinates,
    sriLankanCities: Object.keys(sriLankanCities)
  };
};