import apiClient from './apiClient';

export interface OrderTimeline {
  status: string;
  status_display: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  timestamp?: string;
}

export interface Person {
  name: string;
  phone: string | null;
  specialty?: string | null;
}

export interface OrderTrackingData {
  id?: number;
  order_number: string;
  status: string;
  status_display: string;
  order_type?: 'delivery' | 'pickup';
  created_at: string;
  updated_at: string;
  
  // Timeline
  timeline: OrderTimeline[];
  status_timestamps: Record<string, string>;
  
  // Locations
  chef_location: Location | null;
  delivery_location: Location | null;
  agent_location: Location | null;
  distance_km: number | null;
  
  // Order details
  total_amount: number;
  delivery_fee: number;
  items: Array<{
    id: number;
    food_name: string;
    quantity: number;
    price: number;
  }>;
  total_items: number;
  
  // Time estimates
  estimated_delivery_time: string | null;
  estimated_time_remaining_minutes: number | null;
  actual_delivery_time: string | null;
  
  // People
  customer: Person | null;
  chef: Person | null;
  delivery_partner: Person | null;
  
  // Cancellation
  can_cancel: boolean;
  cancellation_time_remaining_seconds: number;
}

class OrderTrackingService {
  private baseUrl = '/orders';

  /**
   * Get comprehensive real-time tracking data for an order
   */
  async getOrderTracking(orderId: number): Promise<OrderTrackingData> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/${orderId}/tracking/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching order tracking:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch order tracking');
    }
  }

  /**
   * Poll for order updates
   */
  async pollOrderTracking(
    orderId: number,
    callback: (data: OrderTrackingData) => void,
    interval: number = 10000 // 10 seconds
  ): Promise<() => void> {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      try {
        const data = await this.getOrderTracking(orderId);
        callback(data);
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (isActive) {
        setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();

    // Return cleanup function
    return () => {
      isActive = false;
    };
  }

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '0 seconds';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }

    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      cart: 'bg-gray-500',
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-purple-500',
      out_for_delivery: 'bg-indigo-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
      refunded: 'bg-gray-500',
    };

    return colors[status] || 'bg-gray-500';
  }

  /**
   * Get status icon name for UI
   */
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      cart: 'ShoppingCart',
      pending: 'Clock',
      confirmed: 'CheckCircle',
      preparing: 'ChefHat',
      ready: 'Package',
      out_for_delivery: 'Truck',
      delivered: 'CheckCircle2',
      cancelled: 'XCircle',
      refunded: 'DollarSign',
    };

    return icons[status] || 'Package';
  }

  /**
   * Calculate estimated time of arrival
   */
  formatETA(estimatedDeliveryTime: string | null): string {
    if (!estimatedDeliveryTime) return 'Not available';

    const eta = new Date(estimatedDeliveryTime);
    const now = new Date();
    const diff = eta.getTime() - now.getTime();

    if (diff <= 0) return 'Arriving soon';

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

export const orderTrackingService = new OrderTrackingService();
export default orderTrackingService;

