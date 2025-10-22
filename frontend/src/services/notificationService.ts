import apiClient from './apiClient';

export interface Notification {
  notification_id: number;
  subject: string;
  message: string;
  time: string;
  status: 'Read' | 'Unread';
  user: number;
  user_name: string;
  time_ago: string;
  is_unread: boolean;
}

export interface NotificationResponse {
  results: Notification[];
  count: number;
  unread_count: number;
}

class NotificationService {
  private baseUrl = '/communications/notifications';

  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<NotificationResponse>(`${this.baseUrl}/`);
    return response.data.results || [];
  }

  /**
   * Get recent notifications (last 20)
   */
  async getRecentNotifications(): Promise<NotificationResponse> {
    const response = await apiClient.get<NotificationResponse>(`${this.baseUrl}/recent/`);
    return response.data;
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(`${this.baseUrl}/unread_count/`);
    return response.data.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${notificationId}/mark_read/`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await apiClient.post<{ message: string; count: number }>(
      `${this.baseUrl}/mark_all_read/`
    );
    return response.data;
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<{ message: string; count: number }> {
    const response = await apiClient.delete<{ message: string; count: number }>(
      `${this.baseUrl}/clear_all/`
    );
    return response.data;
  }

  /**
   * Extract order number from notification message
   */
  extractOrderNumber(notification: Notification): string | null {
    const match = notification.subject.match(/#([A-Z0-9-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Determine notification type from subject
   */
  getNotificationType(notification: Notification): 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'rejected' | 'general' {
    const subject = notification.subject.toLowerCase();
    if (subject.includes('placed')) return 'placed';
    if (subject.includes('confirmed')) return 'confirmed';
    if (subject.includes('preparing')) return 'preparing';
    if (subject.includes('ready')) return 'ready';
    if (subject.includes('delivered')) return 'delivered';
    if (subject.includes('cancelled')) return 'cancelled';
    if (subject.includes('rejected') || subject.includes('not accepted')) return 'rejected';
    return 'general';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(notification: Notification): string {
    const type = this.getNotificationType(notification);
    switch (type) {
      case 'placed':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-green-600';
      case 'preparing':
        return 'text-blue-600';
      case 'ready':
        return 'text-orange-600';
      case 'delivered':
        return 'text-green-700';
      case 'cancelled':
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(notification: Notification): string {
    const type = this.getNotificationType(notification);
    switch (type) {
      case 'placed':
        return '📝';
      case 'confirmed':
        return '✅';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '📦';
      case 'delivered':
        return '🎉';
      case 'cancelled':
      case 'rejected':
        return '❌';
      default:
        return '🔔';
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

