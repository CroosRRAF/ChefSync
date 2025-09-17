import apiClient from './apiClient';

// Types for admin dashboard
export interface DashboardStats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  user_growth: number;
  
  total_chefs: number;
  active_chefs: number;
  pending_chef_approvals: number;
  chef_growth: number;
  
  total_orders: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  order_growth: number;
  
  total_revenue: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  revenue_growth: number;
  
  total_foods: number;
  active_foods: number;
  pending_food_approvals: number;
  
  system_health_score: number;
  active_sessions: number;
  unread_notifications: number;
  pending_backups: number;
}

export interface SystemHealth {
  overall_health: string;
  health_score: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  database_connections: number;
  response_time: number;
  error_rate: number;
  uptime: string;
  last_backup: string | null;
  alerts: Array<{
    type: string;
    message: string;
  }>;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  total_orders: number;
  total_spent: number;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  payment_status: string;
  items_count: number;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  is_active: boolean;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
  time_ago: string;
  is_expired: boolean;
  metadata: Record<string, any>;
}

export interface AdminActivityLog {
  id: number;
  admin: number;
  admin_email: string;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  time_ago: string;
  metadata: Record<string, any>;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  typed_value: any;
  setting_type: string;
  category: string;
  description: string;
  is_public: boolean;
  is_encrypted: boolean;
  default_value: string;
  validation_rules: Record<string, any>;
  updated_by: number | null;
  updated_at: string;
  created_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
}

export interface OrderListResponse {
  orders: AdminOrder[];
  pagination: PaginationInfo;
}

class AdminService {
  private baseUrl = '/api/admin';

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/dashboard/stats/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/dashboard/system_health/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw new Error('Failed to fetch system health');
    }
  }

  async getRecentActivities(limit: number = 10): Promise<AdminActivityLog[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/dashboard/recent_activities/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('Failed to fetch recent activities');
    }
  }

  async getRecentOrders(limit: number = 10): Promise<AdminOrder[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/dashboard/recent_orders/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw new Error('Failed to fetch recent orders');
    }
  }

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<UserListResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/list_users/`, {
        params: {
          page: params.page || 1,
          limit: params.limit || 25,
          search: params.search || '',
          role: params.role || '',
          status: params.status || '',
          sort_by: params.sort_by || 'date_joined',
          sort_order: params.sort_order || 'desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async updateUserStatus(userId: number, action: 'activate' | 'deactivate'): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/users/${userId}/update_user_status/`, {
        action
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error(`Failed to ${action} user`);
    }
  }

  // Bulk User Operations
  async bulkActivateUsers(userIds: number[]): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/bulk_activate/`, {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk activating users:', error);
      throw new Error('Failed to bulk activate users');
    }
  }

  async bulkDeactivateUsers(userIds: number[]): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/bulk_deactivate/`, {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk deactivating users:', error);
      throw new Error('Failed to bulk deactivate users');
    }
  }

  async bulkDeleteUsers(userIds: number[]): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/bulk_delete/`, {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      throw new Error('Failed to bulk delete users');
    }
  }

  // User Details and Management
  async getUserDetails(userId: number): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${userId}/details/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw new Error('Failed to fetch user details');
    }
  }

  async updateUser(userId: number, data: {
    name?: string;
    phone_no?: string;
    address?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<{ message: string; user: AdminUser }> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/users/${userId}/update_user/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async exportUsers(params: {
    role?: string;
    status?: string;
  } = {}): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/export_users/`, {
        params: {
          role: params.role,
          status: params.status
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw new Error('Failed to export users');
    }
  }

  // Order Management
  async getOrders(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    payment_status?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<OrderListResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/orders/list_orders/`, {
        params: {
          page: params.page || 1,
          limit: params.limit || 25,
          search: params.search || '',
          status: params.status || '',
          payment_status: params.payment_status || '',
          sort_by: params.sort_by || 'created_at',
          sort_order: params.sort_order || 'desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  // Notifications
  async getNotifications(params: {
    is_read?: boolean;
    type?: string;
    priority?: string;
    is_active?: boolean;
  } = {}): Promise<AdminNotification[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/notifications/`, {
        params: {
          is_read: params.is_read,
          type: params.type,
          priority: params.priority,
          is_active: params.is_active
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async markNotificationRead(notificationId: number): Promise<AdminNotification> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/notifications/${notificationId}/mark_read/`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/notifications/mark_all_read/`);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/notifications/unread_count/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw new Error('Failed to fetch unread notification count');
    }
  }

  // System Settings
  async getSystemSettings(params: {
    category?: string;
    is_public?: boolean;
  } = {}): Promise<SystemSetting[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/settings/`, {
        params: {
          category: params.category,
          is_public: params.is_public
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw new Error('Failed to fetch system settings');
    }
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/settings/${key}/`, {
        value
      });
      return response.data;
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw new Error('Failed to update system setting');
    }
  }

  // Activity Logs
  async getActivityLogs(params: {
    admin?: number;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<AdminActivityLog[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/activity-logs/`, {
        params: {
          admin: params.admin,
          action: params.action,
          resource_type: params.resource_type,
          start_date: params.start_date,
          end_date: params.end_date
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw new Error('Failed to fetch activity logs');
    }
  }

  // Utility methods
  async refreshDashboardData(): Promise<DashboardStats> {
    try {
      // Clear any cached data and fetch fresh stats
      const stats = await this.getDashboardStats();
      return stats;
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      throw new Error('Failed to refresh dashboard data');
    }
  }

  async exportData(type: 'users' | 'orders' | 'activity_logs', format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export/${type}/`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Quick actions
  async performQuickAction(actionType: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/quick-actions/${actionType}/`, params);
      return response.data;
    } catch (error) {
      console.error('Error performing quick action:', error);
      throw new Error('Failed to perform quick action');
    }
  }

  // System maintenance
  async toggleMaintenanceMode(enabled: boolean): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/maintenance/toggle/`, {
        enabled
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      throw new Error('Failed to toggle maintenance mode');
    }
  }

  async clearCache(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/maintenance/clear-cache/`);
      return response.data;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error('Failed to clear cache');
    }
  }

  async createBackup(backupType: 'database' | 'files' | 'full' = 'full'): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/backup/create/`, {
        backup_type: backupType
      });
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }
}

export const adminService = new AdminService();
