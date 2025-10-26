import apiClient from './apiClient';

export interface DeliveryAddress {
  id: number;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: number;
}

class AddressService {
  // Use new address endpoints for better structure and features
  // The new system supports both simple addresses and detailed customer addresses
  private baseUrl = '/users/addresses/';
  private quickCreateUrl = '/users/customer-addresses/quick_create/';

  /**
   * Get all addresses for the current user (supports both old and new systems)
   */
  async getAddresses(): Promise<DeliveryAddress[]> {
    try {
      // Try new address system first
      try {
        const response = await apiClient.get(`${this.baseUrl}by_type/?type=customer`);
        const data = response.data;

        // Normalize response to always return an array of addresses.
        let addresses: DeliveryAddress[] = [];
        
        if (Array.isArray(data)) {
          addresses = data;
        } else if (data && Array.isArray(data.results)) {
          addresses = data.results;
        } else if (data && Array.isArray(data.addresses)) {
          addresses = data.addresses;
        } else if (data && Array.isArray(data.data)) {
          addresses = data.data;
        }

        if (addresses.length > 0) {
          console.log('✅ Loaded addresses from new system:', addresses.length);
          return addresses;
        }
      } catch (newSystemError) {
        console.warn('New address system not available, trying old system...');
      }

      // Fallback to old address system (user_addresses table)
      try {
        const response = await apiClient.get('/orders/addresses/');
        const data = response.data;

        let addresses: DeliveryAddress[] = [];
        
        if (Array.isArray(data)) {
          addresses = data;
        } else if (data && Array.isArray(data.results)) {
          addresses = data.results;
        }

        console.log('✅ Loaded addresses from old system:', addresses.length);
        return addresses;
      } catch (oldSystemError) {
        console.error('Failed to load from old system too:', oldSystemError);
      }

      // Return empty array if both systems fail
      return [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }
  }

  /**
   * Get a specific address by ID
   */
  async getAddress(id: number): Promise<DeliveryAddress> {
    try {
      const response = await apiClient.get(`${this.baseUrl}${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address:', error);
      throw new Error('Failed to fetch address');
    }
  }

  /**
   * Create a new address (tries new system first, falls back to old)
   */
  async createAddress(addressData: CreateAddressData): Promise<DeliveryAddress> {
    // Ensure state is set (required by backend)
    // Format coordinates to 6 decimal places to fit backend's max_digits=9 constraint
    const dataToSend = {
      ...addressData,
      state: addressData.state || addressData.city || 'Unknown',
      latitude: parseFloat(addressData.latitude.toFixed(6)),
      longitude: parseFloat(addressData.longitude.toFixed(6)),
    };

    // Try new system first
    try {
      const response = await apiClient.post(this.quickCreateUrl, dataToSend);
      console.log('✅ Address created in new system');
      return response.data;
    } catch (newSystemError: any) {
      console.warn('New system failed, trying old system...', newSystemError);
      
      // Fallback to old system (user_addresses table)
      try {
        const response = await apiClient.post('/orders/addresses/', dataToSend);
        console.log('✅ Address created in old system');
        return response.data;
      } catch (oldSystemError: any) {
        console.error('Both systems failed:', oldSystemError);
        
        // Format error message
        const anyErr: any = oldSystemError;
        if (anyErr.response) {
          const status = anyErr.response.status;
          const respData = anyErr.response.data;
          console.error('Address creation response data:', status, respData);
          
          // Check for duplicate label error
          if (status === 500 && typeof respData === 'string' && respData.includes('Duplicate entry')) {
            throw new Error('An address with this label already exists. Please use a different label (e.g., "Home 2", "Work", "Office").');
          }
          
          const respString = typeof respData === 'string' ? respData : JSON.stringify(respData);
          throw new Error(`Failed to create address (status ${status}): ${respString}`);
        }
        throw new Error('Failed to create address');
      }
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressData: UpdateAddressData): Promise<DeliveryAddress> {
    try {
      const { id, ...updateData } = addressData;
      const response = await apiClient.put(`${this.baseUrl}${id}/`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Failed to update address');
    }
  }

  /**
   * Delete an address (supports both old and new systems)
   */
  async deleteAddress(id: number): Promise<void> {
    try {
      // Try new system first
      await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (newSystemError) {
      console.warn('New system failed, trying old system...');
      try {
        // Fallback to old system
        await apiClient.delete(`/orders/addresses/${id}/`);
        console.log('✅ Address deleted from old system');
      } catch (oldSystemError) {
        console.error('Error deleting address from both systems:', oldSystemError);
        throw new Error('Failed to delete address');
      }
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: number): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}${addressId}/set_default/`);
    } catch (error) {
      console.error('Error setting default address:', error);
      // Don't throw - fail gracefully
      console.warn('Failed to set default address, but continuing...');
    }
  }

  /**
   * Get the default address for the current user
   */
  async getDefaultAddress(): Promise<DeliveryAddress | null> {
    try {
      // Try new system default endpoint
      try {
        const response = await apiClient.get(`${this.baseUrl}default/?type=customer`);
        const data = response.data;
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('✅ Default address from new system');
          return data[0];
        }
      } catch (error) {
        console.warn('New system default endpoint not available');
      }
      
      // Fallback to searching through all addresses
      const addresses = await this.getAddresses();
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0] || null;
      
      if (defaultAddress) {
        console.log('✅ Default address found:', defaultAddress.label);
      } else {
        console.log('ℹ️ No default address found');
      }
      
      return defaultAddress;
    } catch (error) {
      console.error('Error fetching default address:', error);
      return null;
    }
  }

  /**
   * Validate address coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  /**
   * Format address for display
   */
  formatAddress(address: DeliveryAddress): string {
    let formatted = address.address_line1;
    if (address.address_line2) {
      formatted += `, ${address.address_line2}`;
    }
    formatted += `, ${address.city} ${address.pincode}`;
    return formatted;
  }

  /**
   * Search addresses by query
   */
  async searchAddresses(query: string): Promise<DeliveryAddress[]> {
    try {
      const addresses = await this.getAddresses();
      const lowercaseQuery = query.toLowerCase();
      
      return addresses.filter(address => 
        address.label.toLowerCase().includes(lowercaseQuery) ||
        address.address_line1.toLowerCase().includes(lowercaseQuery) ||
        address.city.toLowerCase().includes(lowercaseQuery) ||
        address.pincode.includes(query)
      );
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  }
}

export const addressService = new AddressService();
export default addressService;
