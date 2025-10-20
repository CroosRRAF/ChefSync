import apiClient from './apiClient';

// Cart Types
export interface CartItem {
  id: number;
  quantity: number;
  special_instructions: string;
  created_at: string;
  updated_at: string;
  food_name: string;
  food_description: string;
  unit_price: number;
  total_price: number;
  food_image: string;
  size: string;
  chef_id: number;
  chef_name: string;
  kitchen_address: string;
  kitchen_location: { lat: number; lng: number };
  price_id: number;
  food_id: number;
}

export interface CartSummary {
  total_value: number;
  total_items: number;
  cart_items: CartItem[];
}

export interface UserAddress {
  id: number;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckoutCalculation {
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  distance_km: number;
  total_amount: number;
  breakdown: {
    base_delivery_fee: number;
    extra_km: number;
    extra_km_rate: number;
    extra_km_fee: number;
  };
}

export interface OrderPlacement {
  success: string;
  order_id: number;
  order_number: string;
  status: string;
  total_amount: number;
}

// Cart Service
export class CartService {
  
  /**
   * Get cart items
   */
  static async getCartItems(): Promise<CartItem[]> {
    try {
      const response = await apiClient.get('/api/orders/cart/');
      // Ensure we always return an array
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else if (data && Array.isArray(data.cart_items)) {
        return data.cart_items;
      }
      return [];
    } catch (error) {
      console.error('Error loading cart items:', error);
      return []; // Return empty array instead of throwing
    }
  }
  
  /**
   * Get cart summary
   */
  static async getCartSummary(): Promise<CartSummary> {
    try {
      const response = await apiClient.get('/api/orders/cart/cart_summary/');
      const data = response.data;
      // Ensure cart_items is always an array
      if (data && !Array.isArray(data.cart_items)) {
        data.cart_items = [];
      }
      return data;
    } catch (error) {
      console.error('Error loading cart summary:', error);
      // Return empty cart summary instead of throwing
      return {
        total_value: 0,
        total_items: 0,
        cart_items: []
      };
    }
  }
  
  /**
   * Add item to cart
   */
  static async addToCart(priceId: number, quantity: number = 1, specialInstructions: string = ''): Promise<CartItem> {
    try {
      const response = await apiClient.post('/api/orders/cart/add_to_cart/', {
        price_id: priceId,
        quantity: quantity,
        special_instructions: specialInstructions
      });
      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }
  
  /**
   * Update cart item quantity
   */
  static async updateCartItem(cartItemId: number, quantity: number, specialInstructions?: string): Promise<CartItem> {
    try {
      const response = await apiClient.patch(`/api/orders/cart/${cartItemId}/`, {
        quantity: quantity,
        special_instructions: specialInstructions || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }
  
  /**
   * Remove item from cart
   */
  static async removeFromCart(cartItemId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/orders/cart/${cartItemId}/`);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }
  
  /**
   * Clear entire cart
   */
  static async clearCart(): Promise<void> {
    try {
      await apiClient.delete('/api/orders/cart/clear_cart/');
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
  
  /**
   * Get user addresses
   */
  static async getUserAddresses(): Promise<UserAddress[]> {
    try {
      const response = await apiClient.get('/orders/addresses/');
      const data = response.data;

      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      if (data && Array.isArray(data.addresses)) return data.addresses;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch (error) {
      console.error('Error loading addresses:', error);
      throw error;
    }
  }
  
  /**
   * Add new address
   */
  static async addAddress(address: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>): Promise<UserAddress> {
    try {
      const response = await apiClient.post('/orders/addresses/', address);
      return response.data;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }
  
  /**
   * Update address
   */
  static async updateAddress(addressId: number, address: Partial<UserAddress>): Promise<UserAddress> {
    try {
      const response = await apiClient.patch(`/orders/addresses/${addressId}/`, address);
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }
  
  /**
   * Delete address
   */
  static async deleteAddress(addressId: number): Promise<void> {
    try {
      await apiClient.delete(`/orders/addresses/${addressId}/`);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }
  
  /**
   * Set default address
   */
  static async setDefaultAddress(addressId: number): Promise<void> {
    try {
      await apiClient.post('/orders/addresses/set_default/', {
        address_id: addressId
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }
  
  /**
   * Calculate checkout totals
   */
  static async calculateCheckout(
    chefId: number,
    deliveryLat: number,
    deliveryLng: number
  ): Promise<CheckoutCalculation> {
    try {
      const response = await apiClient.post('/orders/checkout/calculate/', {
        chef_id: chefId,
        delivery_latitude: deliveryLat,
        delivery_longitude: deliveryLng
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating checkout:', error);
      throw error;
    }
  }
  
  /**
   * Place order
   */
  static async placeOrder(orderData: {
    chef_id: number;
    delivery_address_id?: number;
    delivery_latitude?: number;
    delivery_longitude?: number;
    promo_code?: string;
    customer_notes?: string;
  }): Promise<OrderPlacement> {
    try {
      const response = await apiClient.post('/orders/orders/place/', orderData);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }
}

// React Hook for Cart Management
export const useCartService = () => {
  const loadCartItems = async () => {
    return CartService.getCartItems();
  };

  const loadCartSummary = async () => {
    return CartService.getCartSummary();
  };

  const addToCart = async (priceId: number, quantity: number = 1, specialInstructions: string = '') => {
    return CartService.addToCart(priceId, quantity, specialInstructions);
  };

  const updateCartItem = async (cartItemId: number, quantity: number, specialInstructions?: string) => {
    return CartService.updateCartItem(cartItemId, quantity, specialInstructions);
  };

  const removeFromCart = async (cartItemId: number) => {
    return CartService.removeFromCart(cartItemId);
  };

  const clearCart = async () => {
    return CartService.clearCart();
  };

  const loadAddresses = async () => {
    return CartService.getUserAddresses();
  };

  const addAddress = async (address: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>) => {
    return CartService.addAddress(address);
  };

  const updateAddress = async (addressId: number, address: Partial<UserAddress>) => {
    return CartService.updateAddress(addressId, address);
  };

  const deleteAddress = async (addressId: number) => {
    return CartService.deleteAddress(addressId);
  };

  const setDefaultAddress = async (addressId: number) => {
    return CartService.setDefaultAddress(addressId);
  };

  const calculateCheckout = async (chefId: number, deliveryLat: number, deliveryLng: number) => {
    return CartService.calculateCheckout(chefId, deliveryLat, deliveryLng);
  };

  const placeOrder = async (orderData: {
    chef_id: number;
    delivery_address_id?: number;
    delivery_latitude?: number;
    delivery_longitude?: number;
    promo_code?: string;
    customer_notes?: string;
  }) => {
    return CartService.placeOrder(orderData);
  };

  return {
    loadCartItems,
    loadCartSummary,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    calculateCheckout,
    placeOrder
  };
};

export default CartService;
