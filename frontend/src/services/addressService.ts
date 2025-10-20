import apiClient from './apiClient';

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

export interface CreateAddressData {
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: number;
}

class AddressService {
  // Ensure trailing slash to match DRF router endpoints and avoid redirects
  private baseUrl = '/orders/addresses/';

  /**
   * Get all addresses for the current user
   */
  async getAddresses(): Promise<DeliveryAddress[]> {
    try {
      const response = await apiClient.get(this.baseUrl);
      const data = response.data;

      // Normalize response to always return an array of addresses.
      if (Array.isArray(data)) {
        return data;
      }

      // DRF pagination returns { count, next, previous, results: [...] }
      if (data && Array.isArray(data.results)) {
        return data.results;
      }

      // Some endpoints may wrap results under 'addresses' or 'data'
      if (data && Array.isArray(data.addresses)) {
        return data.addresses;
      }

      if (data && Array.isArray(data.data)) {
        return data.data;
      }

      // Fallback: return empty array if shape is unexpected
      return [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw new Error('Failed to fetch addresses');
    }
  }

  /**
   * Get a specific address by ID
   */
  async getAddress(id: number): Promise<DeliveryAddress> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address:', error);
      throw new Error('Failed to fetch address');
    }
  }

  /**
   * Create a new address
   */
  async createAddress(addressData: CreateAddressData): Promise<DeliveryAddress> {
    try {
      const response = await apiClient.post(this.baseUrl, addressData);
      return response.data;
    } catch (error) {
      console.error('Error creating address:', error);
      // If the server returned validation errors, include them in the thrown error
      const anyErr: any = error;
      if (anyErr.response) {
        const status = anyErr.response.status;
        const respData = anyErr.response.data;
        console.error('Address creation response data:', status, respData);
        const respString = typeof respData === 'string' ? respData : JSON.stringify(respData);
        // Include status for easier debugging in the UI
        throw new Error(`HTTP ${status} - ${respString}`);
      }
      throw new Error('Failed to create address');
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressData: UpdateAddressData): Promise<DeliveryAddress> {
    try {
      const { id, ...updateData } = addressData;
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Failed to update address');
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw new Error('Failed to delete address');
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: number): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/set_default/`, {
        address_id: addressId
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      throw new Error('Failed to set default address');
    }
  }

  /**
   * Get the default address for the current user
   */
  async getDefaultAddress(): Promise<DeliveryAddress | null> {
    try {
      const addresses = await this.getAddresses();
      return addresses.find(addr => addr.is_default) || null;
    } catch (error) {
      console.error('Error fetching default address:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
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
