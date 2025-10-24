import apiClient from './apiClient';

// Types
export interface CustomerProfile {
  user_id: number;
  name: string;
  email: string;
  phone_no: string;
  address: string;
  role: string;
  role_display: string;
  profile_image: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  profile_data: {
    type: string;
    profile_id: number;
  } | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  delivery_address: string;
  delivery_instructions: string;
  customer_notes: string;
  chef_notes: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  items: OrderItem[];
  chef: {
    id: number;
    name: string;
    profile_image: string | null;
  };
  delivery_partner: {
    id: number;
    name: string;
    profile_image: string | null;
  } | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string;
  food_name: string;
  food_description: string;
  food_image: string | null;
  size: string;
  cook_name: string;
}

export interface CustomerStats {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_spent: number;
  average_order_value: number;
  favorite_cuisines: string[];
  recent_orders: Order[];
}

// API Functions
export const customerService = {
  // Get customer profile
  getProfile: async (): Promise<CustomerProfile> => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  // Update customer profile
  updateProfile: async (data: Partial<CustomerProfile>): Promise<CustomerProfile> => {
    const response = await apiClient.patch('/auth/profile/update/', data);
    return response.data;
  },

  // Get customer orders
  getOrders: async (params: {
    status?: string;
    page?: number;
    page_size?: number;
    ordering?: string;
  } = {}): Promise<{ results: Order[]; count: number; next: string | null; previous: string | null }> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/orders/orders/?${searchParams}`);
    return response.data;
  },

  // Get specific order details
  getOrder: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/orders/${orderId}/`);
    return response.data;
  },

  // Get customer stats
  getCustomerStats: async (): Promise<CustomerStats> => {
        const response = await apiClient.get<CustomerStats>('/orders/customer/stats/');
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: number, reason?: string): Promise<void> => {
    await apiClient.patch(`/orders/orders/${orderId}/`, {
      status: 'cancelled',
      customer_notes: reason || 'Order cancelled by customer'
    });
  },

  // Get order status history
  getOrderHistory: async (orderId: number): Promise<any[]> => {
    const response = await apiClient.get(`/orders/order-history/?order=${orderId}`);
    return response.data.results || response.data;
  },

  // Get customer orders
  getCustomerOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders/customer/orders/');
    return response.data;
  },
};

export default customerService;
