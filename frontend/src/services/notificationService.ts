import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Notification {
  notification_id: number;
  subject: string;
  message: string;
  time: string;
  status: 'Read' | 'Unread';
  user: number;
  user_name?: string;
  time_ago?: string;
  is_unread?: boolean;
  // Parsed metadata for order notifications
  order_id?: number;
  order_number?: string;
}

export interface NotificationResponse {
  results: Notification[];
  count: number;
  unread_count?: number;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(limit: number = 50): Promise<NotificationResponse> {
    try {
      const response = await apiClient.get('/communications/notifications/', {
        params: { page_size: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { results: [], count: 0, unread_count: 0 };
    }
  }

  /**
   * Get recent notifications (last 20)
   */
  async getRecentNotifications(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.get('/communications/notifications/recent/');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      return { results: [], count: 0, unread_count: 0 };
    }
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get('/communications/notifications/unread_count/');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      await apiClient.post(`/communications/notifications/${notificationId}/mark_read/`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.post('/communications/notifications/mark_all_read/');
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<boolean> {
    try {
      await apiClient.delete('/communications/notifications/clear_all/');
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }

  /**
   * Parse notification to extract order information
   */
  parseNotification(notification: Notification): Notification {
    // Try to extract order ID and number from the message
    const orderNumberMatch = notification.message.match(/#(\w+-\d+)/);
    const orderIdMatch = notification.subject.match(/order[:\s]+(\d+)/i);
    
    if (orderNumberMatch) {
      notification.order_number = orderNumberMatch[1];
    }
    
    if (orderIdMatch) {
      notification.order_id = parseInt(orderIdMatch[1]);
    }
    
    return notification;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
