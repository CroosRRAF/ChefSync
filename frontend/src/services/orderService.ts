import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Get authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Order Types
export interface OrderItem {
  id: number;
  quantity: number;
  special_instructions: string;
  price_details: {
    id: number;
    price: string;
    size: string;
    food_name: string;
    food_description: string;
    food_category: string;
    food_image: string;
  };
  item_total: string;
}

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
  customer: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
  };
  items: OrderItem[];
  special_instructions: string;
  payment_method: string;
  payment_status: string;
  estimated_delivery_time: string;
  delivery_instructions: string;
  customer_notes: string;
  chef_notes: string;
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

// Bulk Order interfaces
export interface BulkOrder {
  id: number;
  order_number: string;
  customer_name: string;
  event_type: string;
  items: BulkOrderItem[];
  total_quantity: number;
  total_amount: string;
  event_date: string;
  status: 'pending' | 'accepted' | 'declined' | 'collaborating' | 'preparing' | 'completed';
  collaborators?: ChefCollaborator[];
  created_at: string;
  updated_at: string;
}

export interface BulkOrderItem {
  id: number;
  food_name: string;
  quantity: number;
  special_instructions?: string;
}

export interface ChefCollaborator {
  id: number;
  name: string;
  username: string;
  email: string;
  role?: string;
  active_assignments?: number;
  availability_status?: 'available' | 'busy';
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

// Order Service
export class OrderService {
  
  /**
   * Get chef's orders with filtering
   */
  static async getChefOrders(filters?: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.date_from) {
        params.append('created_at__gte', filters.date_from);
      }
      if (filters?.date_to) {
        params.append('created_at__lte', filters.date_to);
      }
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/orders/orders/${queryString ? '?' + queryString : ''}`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      
      return response.data.results || response.data;
      
    } catch (error) {
      console.error('Error loading chef orders:', error);
      throw error;
    }
  }

  /**
   * Get specific order details
   */
  static async getOrderDetails(orderId: number): Promise<Order> {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/orders/${orderId}/`, {
        headers: getAuthHeaders()
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Error loading order details:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: number, status: string, notes?: string): Promise<void> {
    try {
      await axios.patch(`${API_BASE_URL}/orders/orders/${orderId}/chef_update_status/`, {
        status: status,
        notes: notes || ''
      }, {
        headers: getAuthHeaders()
      });
      
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Accept order (chef confirms to prepare)
   */
  static async acceptOrder(orderId: number, notes?: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/orders/orders/${orderId}/chef_accept/`, {
        notes: notes || 'Order accepted by chef'
      }, {
        headers: getAuthHeaders()
      });
      
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  }

  /**
   * Reject order
   */
  static async rejectOrder(orderId: number, reason?: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/orders/orders/${orderId}/chef_reject/`, {
        reason: reason || 'Order rejected by chef'
      }, {
        headers: getAuthHeaders()
      });
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  }

  /**
   * Get chef dashboard statistics
   */
  static async getChefDashboardStats(): Promise<ChefDashboardStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/chef/dashboard/stats/`, {
        headers: getAuthHeaders()
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Error loading chef dashboard stats:', error);
      return {
        orders_completed: 0,
        orders_active: 0,
        bulk_orders: 0,
        total_reviews: 0,
        average_rating: 0,
        today_revenue: 0,
        pending_orders: 0,
        monthly_orders: 0,
        customer_satisfaction: 0
      };
    }
  }

  /**
   * Get recent chef reviews
   */
  static async getChefRecentReviews() {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/chef/reviews/recent/`, {
        headers: getAuthHeaders()
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Error loading chef reviews:', error);
      return [];
    }
  }

  /**
   * Get recent chef activity
   */
  static async getChefRecentActivity() {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/chef/activity/recent/`, {
        headers: getAuthHeaders()
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Error loading chef activity:', error);
      return [];
    }
  }

  // Bulk Order Management Methods
  static async getBulkOrders(filters: BulkOrderFilters = {}): Promise<BulkOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.event_date_from) params.append('event_date_from', filters.event_date_from);
      if (filters.event_date_to) params.append('event_date_to', filters.event_date_to);

      const response = await axios.get(
        `${API_BASE_URL}/orders/bulk/?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error loading bulk orders:', error);
      throw error;
    }
  }

  static async getBulkOrder(orderId: number): Promise<BulkOrder> {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/bulk/${orderId}/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error loading bulk order details:', error);
      throw error;
    }
  }

  static async acceptBulkOrder(orderId: number, notes?: string): Promise<BulkOrder> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/bulk/${orderId}/accept/`,
        { notes },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error accepting bulk order:', error);
      throw error;
    }
  }

  static async declineBulkOrder(orderId: number, reason?: string): Promise<BulkOrder> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/bulk/${orderId}/decline/`,
        { reason },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error declining bulk order:', error);
      throw error;
    }
  }

  static async requestCollaboration(orderId: number, request: CollaborationRequest): Promise<BulkOrder> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/bulk/${orderId}/collaborate/`,
        request,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error requesting collaboration:', error);
      throw error;
    }
  }

  static async getAvailableChefs(): Promise<ChefCollaborator[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/bulk/available_chefs/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error loading available chefs:', error);
      throw error;
    }
  }

  static async getBulkOrderStats(): Promise<{
    pending: number;
    accepted: number;
    collaborating: number;
    total_revenue: string;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/bulk/stats/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error loading bulk order stats:', error);
      throw error;
    }
  }
}

// React Hook for Order Management
export const useOrderService = () => {
  const loadOrders = async (filters?: any) => {
    return OrderService.getChefOrders(filters);
  };

  const loadOrderDetails = async (orderId: number) => {
    return OrderService.getOrderDetails(orderId);
  };

  const acceptOrder = async (orderId: number, notes?: string) => {
    return OrderService.acceptOrder(orderId, notes);
  };

  const rejectOrder = async (orderId: number, reason?: string) => {
    return OrderService.rejectOrder(orderId, reason);
  };

  const updateStatus = async (orderId: number, status: string, notes?: string) => {
    return OrderService.updateOrderStatus(orderId, status, notes);
  };

  const loadDashboardStats = async () => {
    return OrderService.getChefDashboardStats();
  };

  // Bulk Order functions
  const loadBulkOrders = async (filters: BulkOrderFilters = {}) => {
    return OrderService.getBulkOrders(filters);
  };

  const loadBulkOrder = async (orderId: number) => {
    return OrderService.getBulkOrder(orderId);
  };

  const acceptBulkOrder = async (orderId: number, notes?: string) => {
    return OrderService.acceptBulkOrder(orderId, notes);
  };

  const declineBulkOrder = async (orderId: number, reason?: string) => {
    return OrderService.declineBulkOrder(orderId, reason);
  };

  const requestCollaboration = async (orderId: number, request: CollaborationRequest) => {
    return OrderService.requestCollaboration(orderId, request);
  };

  const loadBulkOrderStats = async () => {
    return OrderService.getBulkOrderStats();
  };

  const loadAvailableChefs = async () => {
    return OrderService.getAvailableChefs();
  };

  return {
    loadOrders,
    loadOrderDetails,
    acceptOrder,
    rejectOrder,
    updateStatus,
    loadDashboardStats,
    loadBulkOrders,
    loadBulkOrder,
    acceptBulkOrder,
    declineBulkOrder,
    requestCollaboration,
    loadBulkOrderStats,
    loadAvailableChefs
  };
};

export default OrderService;