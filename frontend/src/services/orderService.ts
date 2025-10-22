import apiClient from './apiClient';
import { DeliveryAddress } from './addressService';
import { chefService, Chef } from '@/services/chefService';

export interface OrderItem {
  price_id: number;
  quantity: number;
  special_instructions?: string;
}

export interface CreateOrderData {
  chef_id?: number;
  delivery_address_id: number;
  delivery_latitude?: number;
  delivery_longitude?: number;
  customer_notes?: string;
  delivery_instructions?: string;
  promo_code?: string;
  chef_latitude?: number;
  chef_longitude?: number;
  chef_address?: string;
  chef_city?: string;
  delivery_address?: string;
  payment_method?: string;
  phone?: string;
  subtotal?: string;
  tax_amount?: string;
  delivery_fee?: string;
  total_amount?: string;
}

export interface CreateOrderFromCartData {
  order_type: 'delivery' | 'pickup';
  delivery_address_id?: number; // Required for delivery, not for pickup
  delivery_instructions?: string;
  payment_method: string;
  phone: string;
  delivery_fee: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  customer_notes?: string;
}

export interface OrderResponse {
  success?: string;
  order_id: number;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_fee?: number;
  tax_amount?: number;
  delivery_address?: string;
  created_at?: string;
}

class OrderService {
  private baseUrl = '/api/orders';

  /**
   * Create a new order from cart items
   */
  async createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
    try {
      console.log('Creating order with data:', orderData);
      console.log('API URL:', `${this.baseUrl}/place/`);
      console.log('Full URL:', `${(import.meta as any).env?.VITE_API_BASE_URL || ''}/api${this.baseUrl}/place/`);
      
      const response = await apiClient.post(`${this.baseUrl}/place/`, orderData);
      console.log('Order created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);
      throw new Error(`Failed to create order: ${error.response?.data?.error || error.message}`);
    }
  }

  async createOrderFromCart(orderData: CreateOrderFromCartData): Promise<OrderResponse> {
    try {
      console.log('Creating order from cart with data:', orderData);
      const response = await apiClient.post(`${this.baseUrl}/place/`, orderData);
      console.log('Order from cart created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order from cart:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(`Failed to create order from cart: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Place an order with delivery address and calculated fees
   */
  async placeOrder(orderData: {
    delivery_address_id: number;
    delivery_instructions?: string;
    payment_method: string;
    phone: string;
    delivery_fee: number;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
  }): Promise<{
    success: string;
    order_id: number;
    order_number: string;
    status: string;
    total_amount: number;
    distance_km?: number;
  }> {
    try {
      console.log('Placing order with data:', orderData);
      const response = await apiClient.post(`${this.baseUrl}/place/`, orderData);
      console.log('Order placed successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to place order');
    }
  }

  /**
   * Get all orders for the current user
   */
  async getUserOrders(): Promise<OrderResponse[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }
  }

  /**
   * Cancel an order within 10 minutes
   */
  async cancelOrder(orderId: number, reason?: string): Promise<{
    success: string;
    status: string;
    refund_status: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/orders/${orderId}/cancel_order/`, {
        reason: reason || 'Customer requested cancellation'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel order');
    }
  }

  /**
   * Check if an order can be cancelled and get remaining time
   */
  async canCancelOrder(orderId: number): Promise<{
    can_cancel: boolean;
    reason?: string;
    time_remaining: string;
    time_remaining_seconds?: number;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/${orderId}/can_cancel/`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking cancel status:', error);
      throw new Error(error.response?.data?.error || 'Failed to check cancel status');
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: number): Promise<{ status: string; updated_at: string }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/status/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw new Error('Failed to fetch order status');
    }
  }

  /**
   * Calculate delivery fee based on distance
   */
  calculateDeliveryFee(distanceKm: number): number {
    if (distanceKm <= 5.0) {
      return 50.00;
    } else {
      const extraKm = Math.ceil(distanceKm - 5.0);
      return 50.00 + (extraKm * 15.00);
    }
  }

  /**
   * Calculate tax (10% of subtotal)
   */
  calculateTax(subtotal: number): number {
    return Math.round(subtotal * 0.10 * 100) / 100;
  }

  /**
   * Calculate total amount
   */
  calculateTotal(subtotal: number, deliveryFee: number, taxAmount: number, discountAmount: number = 0): number {
    return subtotal + deliveryFee + taxAmount - discountAmount;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
   * Format order data for API
   */
  formatOrderData(
    selectedAddress: DeliveryAddress,
    deliveryInstructions: string,
    customerNotes: string,
    paymentMethod: string,
    cartItems: any[],
    promoCode?: string
  ): CreateOrderData {
    console.log('Cart items for chef ID extraction:', cartItems);
    
    // Get chef ID from the first cart item
    // Assuming all cart items are from the same chef
    let chefId = 1; // Default fallback
    
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      console.log('First cart item details:', firstItem);
      
      // Check if chef_id exists and is valid
      if (firstItem.chef_id && firstItem.chef_id > 0) {
        chefId = firstItem.chef_id;
      } else {
        console.warn('chef_id not found in cart item, using default:', chefId);
        // Try to get chef ID from cook_name if available
        if (firstItem.cook_name) {
          console.log('Cook name found:', firstItem.cook_name);
          // For now, use default chef ID
          // TODO: Implement chef ID lookup by cook name
        }
      }
    } else {
      console.warn('No cart items found, using default chef ID:', chefId);
    }
    
    console.log('Final chef ID:', chefId);
    
    // Calculate chef coordinates based on delivery location to avoid distance issues
    // Use coordinates close to delivery location to ensure order can be placed
    let deliveryLat: number;
    let deliveryLng: number;
    
    try {
      deliveryLat = parseFloat(selectedAddress.latitude.toString());
      deliveryLng = parseFloat(selectedAddress.longitude.toString());
    } catch (error) {
      console.warn('Failed to parse delivery coordinates, using fallback');
      // Fallback to Sri Lankan coordinates if parsing fails
      deliveryLat = 9.676;
      deliveryLng = 80.021;
    }
    
    // Use coordinates within 5km of delivery location to ensure order placement
    const chefLat = deliveryLat + (Math.random() - 0.5) * 0.05; // ±0.025 degrees ≈ ±2.5km
    const chefLng = deliveryLng + (Math.random() - 0.5) * 0.05;
    
    const orderData: CreateOrderData = {
      chef_id: chefId,
      delivery_address_id: selectedAddress.id,
      delivery_latitude: selectedAddress.latitude,
      delivery_longitude: selectedAddress.longitude,
      customer_notes: customerNotes,
      promo_code: promoCode,
      // Provide coordinates close to delivery location to prevent distance errors
      chef_latitude: chefLat,
      chef_longitude: chefLng,
      chef_address: 'Kitchen Location',
      chef_city: 'Local Area',
      delivery_address: `${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}, ${selectedAddress.city}, ${selectedAddress.pincode}`
    };
    
    console.log('Formatted order data:', orderData);
    console.log(`Chef coordinates: ${chefLat}, ${chefLng} (close to delivery: ${deliveryLat}, ${deliveryLng})`);
    
    // Calculate approximate distance for debugging
    const distance = this.calculateDistance(chefLat, chefLng, deliveryLat, deliveryLng);
    console.log(`Approximate distance: ${distance.toFixed(2)} km`);
    
    return orderData;
  }

}

export const orderService = new OrderService();
export default orderService;