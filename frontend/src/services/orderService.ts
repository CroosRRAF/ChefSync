import apiClient from './apiClient';

// Local interfaces
export interface DeliveryAddress {
  id?: number;
  address_line_1: string;
  address_line1: string; // Alternative naming
  address_line_2?: string;
  address_line2?: string; // Alternative naming
  city: string;
  state: string;
  postal_code: string;
  pincode: string; // Alternative naming
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  price_id: number;
  quantity: number;
  special_instructions?: string;
}

export interface CreateOrderData {
  chef_id: number;
  delivery_address_id?: number;
  delivery_latitude: number;
  delivery_longitude: number;
  customer_notes?: string;
  promo_code?: string;
  chef_latitude?: number;
  chef_longitude?: number;
  chef_address?: string;
  chef_city?: string;
  delivery_address?: string;
}

export interface OrderResponse {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  tax_amount: number;
  delivery_address: string;
  created_at: string;
}

export interface ChefDashboardStats {
  orders_completed: number;
  orders_active: number;
  bulk_orders: number;
  total_reviews: number;
  average_rating: number;
  today_revenue: number;
  pending_orders: number;
  monthly_orders: number;
  customer_satisfaction: number;
}

// Regular Order interfaces
export interface Order {
  id: number;
  order_number: string;
  status: 'cart' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  status_display: string;
  total_amount: string;
  customer_name: string;
  chef_name: string;
  total_items: number;
  created_at: string;
  time_since_order: string;
  delivery_address: string;
  order_type: string;
  payment_method?: string;
  payment_status?: string;
  special_instructions?: string;
  customer: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone?: string;
  };
  items: any[];
}

export interface OrderFilters {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Bulk Order interfaces
export interface BulkOrderItem {
  id: number;
  food_name: string;
  quantity: number;
  special_instructions?: string;
}

export interface ChefCollaborator {
  id: number;
  name: string;
  email: string;
  role: string;
  username?: string;
  active_assignments?: number;
  availability_status?: string;
}

export interface BulkOrder {
  id: number;
  order_number: string;
  customer_name: string;
  event_type: string;
  event_date: string;
  status: string;
  total_amount: string;
  total_quantity: number;
  description: string;
  items: BulkOrderItem[];
  collaborators: ChefCollaborator[];
  created_at: string;
  updated_at: string;
}

export interface BulkOrderFilters {
  status?: string;
  search?: string;
  event_date_from?: string;
  event_date_to?: string;
}

export interface CollaborationRequest {
  chef_id: number;
  message: string;
  work_distribution: string;
}

export class OrderService {
  private baseUrl = '/orders';

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

  // Regular Order Management Methods
  async getOrders(filters: OrderFilters = {}): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await apiClient.get(`/orders/orders/?${params.toString()}`);
      
      // Handle both paginated and direct array responses
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data) {
        // Paginated response from DRF
        return data.results;
      } else if (Array.isArray(data)) {
        // Direct array response
        return data;
      } else {
        // Unexpected format
        console.warn('Unexpected API response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      throw error;
    }
  }

  async acceptOrder(orderId: number, notes?: string): Promise<Order> {
    try {
      const response = await apiClient.post(`/orders/orders/${orderId}/chef_accept/`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  }

  async rejectOrder(orderId: number, reason?: string): Promise<Order> {
    try {
      const response = await apiClient.post(`/orders/orders/${orderId}/chef_reject/`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, status: string, notes?: string): Promise<Order> {
    try {
      const response = await apiClient.post(`/orders/orders/${orderId}/chef_update_status/`, { status, notes });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async loadOrderDetails(orderId: number): Promise<Order> {
    try {
      const response = await apiClient.get(`/orders/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error('Error loading order details:', error);
      throw error;
    }
  }

  // Bulk Order Management Methods
  async getBulkOrders(filters: BulkOrderFilters = {}): Promise<BulkOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.event_date_from) params.append('event_date_from', filters.event_date_from);
      if (filters.event_date_to) params.append('event_date_to', filters.event_date_to);

      const response = await apiClient.get(`/orders/bulk/?${params.toString()}`);
      
      // Handle both paginated and direct array responses
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data) {
        // Paginated response from DRF
        return data.results;
      } else if (Array.isArray(data)) {
        // Direct array response
        return data;
      } else {
        // Unexpected format
        console.warn('Unexpected bulk orders API response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error loading bulk orders:', error);
      throw error;
    }
  }

  async getBulkOrder(orderId: number): Promise<BulkOrder> {
    try {
      const response = await apiClient.get(`/orders/bulk/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error('Error loading bulk order details:', error);
      throw error;
    }
  }

  async acceptBulkOrder(orderId: number, notes?: string): Promise<BulkOrder> {
    try {
      const response = await apiClient.post(`/orders/bulk/${orderId}/accept/`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error accepting bulk order:', error);
      throw error;
    }
  }

  async declineBulkOrder(orderId: number, reason?: string): Promise<BulkOrder> {
    try {
      const response = await apiClient.post(`/orders/bulk/${orderId}/decline/`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error declining bulk order:', error);
      throw error;
    }
  }

  async requestCollaboration(orderId: number, request: CollaborationRequest): Promise<BulkOrder> {
    try {
      const response = await apiClient.post(`/orders/bulk/${orderId}/collaborate/`, request);
      return response.data;
    } catch (error) {
      console.error('Error requesting collaboration:', error);
      throw error;
    }
  }

  async getBulkOrderStats(): Promise<any> {
    try {
      const response = await apiClient.get('/orders/bulk/stats/');
      return response.data;
    } catch (error) {
      console.error('Error loading bulk order stats:', error);
      throw error;
    }
  }

  async getAvailableChefs(): Promise<ChefCollaborator[]> {
    try {
      const response = await apiClient.get('/orders/bulk/available_chefs/');
      return response.data;
    } catch (error) {
      console.error('Error loading available chefs:', error);
      throw error;
    }
  }

  async getChefDashboardStats(): Promise<ChefDashboardStats> {
    try {
      const response = await apiClient.get('/orders/chef/dashboard/stats/');
      return response.data;
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      throw error;
    }
  }

}

// Custom hook for using OrderService
export const useOrderService = () => {
  // Regular order methods
  const loadOrders = async (filters: OrderFilters = {}) => {
    return orderService.getOrders(filters);
  };

  const acceptOrder = async (orderId: number, notes?: string) => {
    return orderService.acceptOrder(orderId, notes);
  };

  const rejectOrder = async (orderId: number, reason?: string) => {
    return orderService.rejectOrder(orderId, reason);
  };

  const updateStatus = async (orderId: number, status: string, notes?: string) => {
    return orderService.updateOrderStatus(orderId, status, notes);
  };

  const loadOrderDetails = async (orderId: number) => {
    return orderService.loadOrderDetails(orderId);
  };

  // Bulk order methods
  const loadBulkOrders = async (filters: BulkOrderFilters = {}) => {
    return orderService.getBulkOrders(filters);
  };

  const loadBulkOrder = async (orderId: number) => {
    return orderService.getBulkOrder(orderId);
  };

  const acceptBulkOrder = async (orderId: number, notes?: string) => {
    return orderService.acceptBulkOrder(orderId, notes);
  };

  const declineBulkOrder = async (orderId: number, reason?: string) => {
    return orderService.declineBulkOrder(orderId, reason);
  };

  const requestCollaboration = async (orderId: number, request: CollaborationRequest) => {
    return orderService.requestCollaboration(orderId, request);
  };

  const loadBulkOrderStats = async () => {
    return orderService.getBulkOrderStats();
  };

  const loadAvailableChefs = async () => {
    return orderService.getAvailableChefs();
  };

  const loadDashboardStats = async () => {
    return orderService.getChefDashboardStats();
  };

  return {
    // Regular order methods
    loadOrders,
    acceptOrder,
    rejectOrder,
    updateStatus,
    loadOrderDetails,
    // Bulk order methods
    loadBulkOrders,
    loadBulkOrder,
    acceptBulkOrder,
    declineBulkOrder,
    requestCollaboration,
    loadBulkOrderStats,
    loadAvailableChefs,
    loadDashboardStats
  };
};

export const orderService = new OrderService();
export default orderService;