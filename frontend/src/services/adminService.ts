import axios from "axios";
import { SystemSetting } from "../types/admin";

// Use Vite dev proxy by default to avoid protocol mismatches in development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Enhanced error handling for different error types
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth/login";
    } else if (error.response?.status === 500) {
      // Handle server errors with detailed logging
      console.error("🚨 Server Error (500) in Admin API:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        timestamp: new Date().toISOString(),
      });

      // Show user-friendly error message
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Server error occurred. Please try again later or contact support.";

      // You could dispatch to a global error handler or toast system here
      console.warn("User-friendly error:", errorMessage);
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      // Handle client errors (400-499)
      console.warn("Client Error in Admin API:", {
        status: error.response.status,
        message: error.response.data?.error || error.response.data?.message,
        url: error.config?.url,
      });
    } else if (
      error.code === "ERR_NETWORK" ||
      error.code === "ERR_CONNECTION_REFUSED"
    ) {
      // Handle network errors
      console.error("🌐 Network Error:", {
        code: error.code,
        message:
          "Unable to connect to server. Please check your internet connection.",
        url: error.config?.url,
      });
    } else {
      // Handle other errors
      console.error("❌ Unexpected Error in Admin API:", {
        code: error.code,
        message: error.message,
        url: error.config?.url,
      });
    }

    return Promise.reject(error);
  }
);

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
  pending_user_approvals: number; // New field for actual user approvals
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
  approval_status: string;
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
  total_amount: number | string; // API might return string
  created_at: string;
  updated_at: string;
  payment_status: string;
  items_count: number | string; // API might return string
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
  metadata: Record<string, unknown>;
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
  metadata: Record<string, unknown>;
}

export interface ApprovalDocument {
  id: number;
  file_name: string;
  file: string;
  file_size?: number;
  file_type?: string;
  document_type: {
    id: number;
    name: string;
    description: string;
  };
  uploaded_at: string;
  updated_at?: string;
  is_visible_to_admin: boolean;
  status: "pending" | "approved" | "rejected" | "needs_resubmission";
  status_display?: string;
  admin_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
}

export interface PendingApprovalUser {
  user_id: number;
  name: string;
  email: string;
  role: string;
  phone_no?: string;
  address?: string;
  created_at: string;
  approval_status: string;
  documents: ApprovalDocument[];
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
  private baseUrl = "/admin";

  async fetchDocumentBlob(
    documentId: number,
    options: { preview?: boolean; fileUrl?: string } = {}
  ): Promise<Blob> {
    try {
      const response = await apiClient.post(
        `/auth/documents/proxy-download/`,
        {
          document_id: documentId,
          preview: options.preview ?? false,
          file_url: options.fileUrl ?? undefined,
        },
        {
          responseType: "blob",
        }
      );

      return response.data as Blob;
    } catch (error) {
      console.error("Error fetching document blob:", error);
      throw new Error("Failed to retrieve document content");
    }
  }

  async reviewDocument(
    documentId: number,
    payload: {
      status: "pending" | "approved" | "rejected" | "needs_resubmission";
      notes?: string;
    }
  ): Promise<ApprovalDocument> {
    try {
      const response = await apiClient.patch(
        `/auth/documents/${documentId}/review/`,
        {
          status: payload.status,
          notes: payload.notes ?? "",
        }
      );

      return response.data.document as ApprovalDocument;
    } catch (error) {
      console.error("Error updating document status:", error);
      throw new Error("Failed to update document status");
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/dashboard/stats/`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      } else if (error.response?.status === 403) {
        throw new Error(
          "You do not have permission to access admin dashboard."
        );
      } else if (error.response?.status === 404) {
        throw new Error(
          "Admin dashboard endpoint not found. Please check if the backend server is running."
        );
      }
      throw new Error("Failed to fetch dashboard statistics");
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/system_health/`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw new Error("Failed to fetch system health");
    }
  }

  async getRecentActivities(limit: number = 10): Promise<AdminActivityLog[]> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/recent_activities/`,
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      throw new Error("Failed to fetch recent activities");
    }
  }

  async getRecentOrders(limit: number = 10): Promise<AdminOrder[]> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/recent_orders/`,
        {
          params: { limit },
        }
      );

      // Transform data to ensure type safety
      const orders: AdminOrder[] = response.data.map(
        (order: {
          id: number;
          order_number: string;
          customer_name: string;
          customer_email: string;
          status: string;
          total_amount: string | number;
          created_at: string;
          updated_at: string;
          payment_status: string;
          items_count: string | number;
        }) => ({
          ...order,
          total_amount:
            typeof order.total_amount === "string"
              ? parseFloat(order.total_amount)
              : Number(order.total_amount) || 0,
          items_count: Number(order.items_count) || 0,
          id: Number(order.id) || 0,
        })
      );

      return orders;
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      throw new Error("Failed to fetch recent orders");
    }
  }

  async getOrders(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      payment_status?: string;
      search?: string;
      sort_by?: string;
      sort_order?: "asc" | "desc";
    } = {}
  ): Promise<{
    orders: AdminOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }> {
    try {
      console.log(`🔄 AdminService: Fetching orders with params:`, params);

      const response = await apiClient.get(`${this.baseUrl}/orders/`, {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status || "",
          payment_status: params.payment_status || "",
          search: params.search || "",
          sort_by: params.sort_by || "created_at",
          sort_order: params.sort_order || "desc",
        },
      });

      console.log(`✅ AdminService: Orders response:`, {
        ordersCount: response.data.orders?.length || 0,
        pagination: response.data.pagination,
      });

      // Transform data to ensure type safety
      const orders: AdminOrder[] = (response.data.orders || []).map(
        (order: {
          id: number;
          order_number: string;
          customer_name: string;
          customer_email: string;
          status: string;
          total_amount: string | number;
          created_at: string;
          updated_at: string;
          payment_status: string;
          items_count: string | number;
        }) => ({
          ...order,
          total_amount:
            typeof order.total_amount === "string"
              ? parseFloat(order.total_amount)
              : Number(order.total_amount) || 0,
          items_count: Number(order.items_count) || 0,
          id: Number(order.id) || 0,
        })
      );

      return {
        orders,
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      };
    } catch (error: any) {
      console.error("❌ AdminService: Error fetching orders:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to fetch orders: ${error?.message || "Unknown error"}`
      );
    }
  }

  async getOrderDetails(orderId: number): Promise<any> {
    try {
      console.log(`🔄 AdminService: Fetching order details for ID: ${orderId}`);

      const response = await apiClient.get(
        `${this.baseUrl}/orders/${orderId}/details/`
      );

      console.log(`✅ AdminService: Order details response:`, response.data);

      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error fetching order details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to fetch order details: ${error?.message || "Unknown error"}`
      );
    }
  }

  async updateOrderStatus(orderId: number, newStatus: string): Promise<any> {
    try {
      console.log(
        `🔄 AdminService: Updating order ${orderId} status to ${newStatus}`
      );

      const response = await apiClient.patch(
        `${this.baseUrl}/orders/${orderId}/update_status/`,
        {
          status: newStatus,
        }
      );

      console.log(
        `✅ AdminService: Order status update response:`,
        response.data
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error updating order status:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to update order status: ${error?.message || "Unknown error"}`
      );
    }
  }

  async assignChef(orderId: number, chefId: number): Promise<any> {
    try {
      console.log(
        `🔄 AdminService: Assigning chef ${chefId} to order ${orderId}`
      );

      const response = await apiClient.patch(
        `${this.baseUrl}/orders/${orderId}/assign_chef/`,
        {
          chef_id: chefId,
        }
      );

      console.log(`✅ AdminService: Chef assignment response:`, response.data);

      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error assigning chef:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to assign chef: ${error?.message || "Unknown error"}`
      );
    }
  }

  async assignDeliveryPartner(
    orderId: number,
    partnerId: number
  ): Promise<any> {
    try {
      console.log(
        `🔄 AdminService: Assigning delivery partner ${partnerId} to order ${orderId}`
      );

      const response = await apiClient.patch(
        `${this.baseUrl}/orders/${orderId}/assign_delivery_partner/`,
        {
          partner_id: partnerId,
        }
      );

      console.log(
        `✅ AdminService: Delivery partner assignment response:`,
        response.data
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error assigning delivery partner:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to assign delivery partner: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  async getAvailableChefs(): Promise<any[]> {
    try {
      console.log(`🔄 AdminService: Fetching available chefs`);

      const response = await apiClient.get(
        `${this.baseUrl}/orders/available_chefs/`
      );

      console.log(`✅ AdminService: Available chefs response:`, response.data);

      return response.data.chefs || [];
    } catch (error: any) {
      console.error("❌ AdminService: Error fetching available chefs:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to fetch available chefs: ${error?.message || "Unknown error"}`
      );
    }
  }

  async getAvailableDeliveryPartners(): Promise<any[]> {
    try {
      console.log(`🔄 AdminService: Fetching available delivery partners`);

      const response = await apiClient.get(
        `${this.baseUrl}/orders/available_delivery_partners/`
      );

      console.log(
        `✅ AdminService: Available delivery partners response:`,
        response.data
      );

      return response.data.partners || [];
    } catch (error: any) {
      console.error(
        "❌ AdminService: Error fetching available delivery partners:",
        {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          url: error?.config?.url,
        }
      );
      throw new Error(
        `Failed to fetch available delivery partners: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  async getNotifications(
    params: {
      limit?: number;
      is_read?: boolean;
      type?: string;
      priority?: string;
      is_active?: boolean;
    } = {}
  ): Promise<{ notifications: AdminNotification[] }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/notifications/`, {
        params: {
          limit: params.limit || 10,
          is_read: params.is_read,
          type: params.type,
          priority: params.priority,
          is_active: params.is_active,
        },
      });

      // Normalize response to always return { notifications: [...] } format
      let notifications: AdminNotification[] = [];

      if (response.data && typeof response.data === "object") {
        if (
          "notifications" in response.data &&
          Array.isArray(response.data.notifications)
        ) {
          notifications = response.data.notifications;
        } else if (Array.isArray(response.data)) {
          // Handle legacy array format
          notifications = response.data;
        } else if (
          "results" in response.data &&
          Array.isArray(response.data.results)
        ) {
          // Handle paginated format
          notifications = response.data.results;
        }
      }

      return { notifications };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Return empty notifications object on error
      return { notifications: [] };
    }
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    try {
      await apiClient.patch(
        `${this.baseUrl}/notifications/${notificationId}/mark_read/`
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    try {
      const response = await apiClient.patch(
        `${this.baseUrl}/notifications/mark_all_read/`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  async getRevenueTrends(): Promise<{
    revenue_trends: Array<{ name: string; value: number }>;
    total_revenue?: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/revenue_trends/`
      );

      // Normalize response to always return object format
      let trends: Array<{ name: string; value: number }> = [];

      if (Array.isArray(response.data)) {
        trends = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        // Handle chart format
        const chartData = response.data.data;
        if (
          chartData &&
          Array.isArray(chartData.datasets) &&
          chartData.datasets.length > 0
        ) {
          const dataset = chartData.datasets[0];
          if (Array.isArray(dataset.data) && Array.isArray(chartData.labels)) {
            trends = chartData.labels.map((label: string, index: number) => ({
              name: label,
              value: dataset.data[index] || 0,
            }));
          }
        }
      }

      return {
        revenue_trends: trends,
        total_revenue:
          response.data?.total_revenue ||
          trends.reduce((sum, item) => sum + (item.value || 0), 0),
      };
    } catch (error) {
      console.error("Error fetching revenue trends:", error);
      // Return default structure on error
      return {
        revenue_trends: [],
        total_revenue: 0,
      };
    }
  }

  async getUserGrowthTrends(): Promise<{
    user_growth_trends: Array<{ name: string; value: number }>;
    total_new_users?: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/user_growth_trends/`
      );

      // Normalize response to always return object format
      let trends: Array<{ name: string; value: number }> = [];

      if (Array.isArray(response.data)) {
        trends = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        // Handle chart format
        const chartData = response.data.data;
        if (
          chartData &&
          Array.isArray(chartData.datasets) &&
          chartData.datasets.length > 0
        ) {
          const dataset = chartData.datasets[0];
          if (Array.isArray(dataset.data) && Array.isArray(chartData.labels)) {
            trends = chartData.labels.map((label: string, index: number) => ({
              name: label,
              value: dataset.data[index] || 0,
            }));
          }
        }
      }

      return {
        user_growth_trends: trends,
        total_new_users:
          response.data?.total_new_users ||
          trends.reduce((sum, item) => sum + (item.value || 0), 0),
      };
    } catch (error) {
      console.error("Error fetching user growth trends:", error);
      // Return default structure on error
      return {
        user_growth_trends: [],
        total_new_users: 0,
      };
    }
  }

  // New Analytics Endpoints for Dashboard Migration
  async getWeeklyPerformance(days: number = 30): Promise<{
    chart_type: string;
    title: string;
    data: {
      labels: string[];
      datasets: Array<{
        data: number[];
        backgroundColor: string[];
        borderWidth: number;
      }>;
    };
    total_orders: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/weekly_performance/`,
        { params: { days } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching weekly performance:", error);
      throw new Error("Failed to fetch weekly performance");
    }
  }

  async getRevenueTrend(days: number = 30): Promise<{
    chart_type: string;
    title: string;
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }>;
    };
    total_revenue: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/revenue_trend/`,
        { params: { days } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching revenue trend:", error);
      throw new Error("Failed to fetch revenue trend");
    }
  }

  async getGrowthAnalytics(days: number = 30): Promise<{
    chart_type: string;
    title: string;
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
        fill: boolean;
      }>;
    };
    total_new_users: number;
    total_new_orders: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/growth_analytics/`,
        { params: { days } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching growth analytics:", error);
      throw new Error("Failed to fetch growth analytics");
    }
  }

  async getOrdersTrend(days: number = 30): Promise<{
    chart_type: string;
    title: string;
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }>;
    };
    total_orders: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/orders_trend/`,
        { params: { days } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching orders trend:", error);
      throw new Error("Failed to fetch orders trend");
    }
  }

  async getTopPerformingChefs(limit: number = 10): Promise<{
    chefs: Array<{
      id: number;
      name: string;
      email: string;
      total_orders: number;
      total_revenue: number;
      rating: number;
      status: string;
    }>;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/top_performing_chefs/`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top performing chefs:", error);
      throw new Error("Failed to fetch top performing chefs");
    }
  }

  async getTopPerformingFoodItems(limit: number = 10): Promise<{
    food_items: Array<{
      id: number;
      name: string;
      category: string;
      total_orders: number;
      total_revenue: number;
      rating: number;
      status: string;
    }>;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/dashboard/top_performing_food_items/`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top performing food items:", error);
      throw new Error("Failed to fetch top performing food items");
    }
  }

  // User Management
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      approval_status?: string;
      sort_by?: string;
      sort_order?: string;
    } = {}
  ): Promise<UserListResponse> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/users/list_users/`,
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 25,
            search: params.search || "",
            role: params.role || "",
            status: params.status || "",
            approval_status: params.approval_status || "",
            sort_by: params.sort_by || "date_joined",
            sort_order: params.sort_order || "desc",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async updateUserStatus(
    userId: number,
    action: "activate" | "deactivate"
  ): Promise<void> {
    try {
      await apiClient.patch(
        `${this.baseUrl}/users/${userId}/update_user_status/`,
        {
          action,
        }
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      throw new Error(`Failed to ${action} user`);
    }
  }

  async updateUser(userId: number, updates: Partial<AdminUser>): Promise<void> {
    try {
      console.log(`🔄 AdminService: Updating user ${userId} with:`, updates);
      await apiClient.patch(
        `${this.baseUrl}/users/${userId}/update_user/`,
        updates
      );
      console.log(`✅ AdminService: Update successful`);
    } catch (error: any) {
      console.error("❌ AdminService: Error updating user:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Re-throw with more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to update user";
      throw new Error(errorMessage);
    }
  }

  // Get user statistics
  async getUserStats(): Promise<any> {
    try {
      console.log(`🔄 AdminService: Fetching user stats`);
      const response = await apiClient.get(`${this.baseUrl}/users/stats/`);
      console.log(`✅ AdminService: Stats response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error fetching user stats:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Re-throw with more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to fetch user stats";
      throw new Error(errorMessage);
    }
  }

  // Individual User Activation/Deactivation
  async activateUser(userId: number): Promise<{ message: string }> {
    try {
      console.log(`🔄 AdminService: Activating user ${userId}`);
      const response = await apiClient.post(
        `${this.baseUrl}/users/${userId}/activate/`
      );
      console.log(`✅ AdminService: Activate response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error activating user:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Re-throw with more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to activate user";
      throw new Error(errorMessage);
    }
  }

  async deactivateUser(userId: number): Promise<{ message: string }> {
    try {
      console.log(`🔄 AdminService: Deactivating user ${userId}`);
      const response = await apiClient.post(
        `${this.baseUrl}/users/${userId}/deactivate/`
      );
      console.log(`✅ AdminService: Deactivate response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error deactivating user:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Re-throw with more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to deactivate user";
      throw new Error(errorMessage);
    }
  }

  // User Statistics
  async getUserStatistics(): Promise<{
    total_users: number;
    active_users: number;
    inactive_users: number;
    pending_approvals: number;
    total_chefs: number;
    active_chefs: number;
    pending_chef_approvals: number;
    total_customers: number;
    active_customers: number;
    new_users_today: number;
    new_users_this_week: number;
    new_users_this_month: number;
    user_growth_percentage: number;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/statistics/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      throw new Error("Failed to fetch user statistics");
    }
  }

  // Bulk User Operations
  async bulkActivateUsers(
    userIds: number[]
  ): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/users/bulk_activate/`,
        {
          user_ids: userIds,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk activating users:", error);
      throw new Error("Failed to bulk activate users");
    }
  }

  async bulkDeactivateUsers(
    userIds: number[]
  ): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/users/bulk_deactivate/`,
        {
          user_ids: userIds,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk deactivating users:", error);
      throw new Error("Failed to bulk deactivate users");
    }
  }

  async bulkDeleteUsers(
    userIds: number[]
  ): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/users/bulk_delete/`,
        {
          user_ids: userIds,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      throw new Error("Failed to bulk delete users");
    }
  }

  // User Details and Management
  async getUserDetails(userId: number): Promise<{
    id: number;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    date_joined: string;
    phone_no?: string;
    address?: string;
    total_orders: number;
    total_spent: number;
    last_login?: string;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/users/${userId}/details/`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw new Error("Failed to fetch user details");
    }
  }

  // Approval Management
  async getPendingApprovals(
    params: {
      role?: string;
    } = {}
  ): Promise<PendingApprovalUser[]> {
    try {
      console.log(
        "🔄 AdminService: Fetching pending approvals with params:",
        params
      );

      // If no role is specified, don't send any params to get all pending approvals
      const config =
        params.role && params.role.trim() !== ""
          ? { params: { role: params.role } }
          : {};

      console.log(
        "🌐 Making request to: /auth/admin/pending-approvals/ with config:",
        config
      );
      const response = await apiClient.get(
        "/auth/admin/pending-approvals/",
        config
      );
      console.log("✅ API Response received:", response.status, response.data);
      return (response.data.users || []) as PendingApprovalUser[]; // Extract users array from response
    } catch (error) {
      console.error("❌ Error fetching pending approvals:", error);
      throw new Error("Failed to fetch pending approvals");
    }
  }

  async getUserForApproval(userId: number): Promise<PendingApprovalUser> {
    try {
      const response = await apiClient.get(`/auth/admin/user/${userId}/`);
      return response.data as PendingApprovalUser;
    } catch (error) {
      console.error("Error fetching user for approval:", error);
      throw new Error("Failed to fetch user details");
    }
  }

  async approveUser(
    userId: number,
    action: "approve" | "reject",
    notes?: string
  ): Promise<{
    message: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      approval_status: string;
    };
  }> {
    try {
      const response = await apiClient.post(
        `/auth/admin/user/${userId}/approve/`,
        {
          action,
          notes: notes || "",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error approving/rejecting user:", error);
      throw new Error(`Failed to ${action} user`);
    }
  }

  // Utility methods
  async refreshDashboardData(): Promise<DashboardStats> {
    try {
      // Clear any cached data and fetch fresh stats
      const stats = await this.getDashboardStats();
      return stats;
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      throw new Error("Failed to refresh dashboard data");
    }
  }

  async exportData(
    type: "users" | "orders" | "activity_logs",
    format: "csv" | "excel" | "pdf" = "csv"
  ): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export/${type}/`, {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting data:", error);
      throw new Error("Failed to export data");
    }
  }

  async exportUsers(
    params: {
      role?: string;
      status?: string;
    } = {}
  ): Promise<Blob> {
    try {
      console.log(`🔄 AdminService: Exporting users with params:`, params);
      const response = await apiClient.get(
        `${this.baseUrl}/users/export_users/`,
        {
          params: {
            role: params.role || "",
            status: params.status || "",
          },
          responseType: "blob",
        }
      );
      console.log(`✅ AdminService: Export successful`);
      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error exporting users:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Re-throw with more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to export users";
      throw new Error(errorMessage);
    }
  }

  // Quick actions
  async performQuickAction(
    actionType: string,
    params: Record<string, unknown> = {}
  ): Promise<{
    success: boolean;
    message: string;
    data?: unknown;
  }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/quick-actions/${actionType}/`,
        params
      );
      return response.data;
    } catch (error) {
      console.error("Error performing quick action:", error);
      throw new Error("Failed to perform quick action");
    }
  }

  // System maintenance
  async toggleMaintenanceMode(enabled: boolean): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/maintenance/toggle/`,
        {
          enabled,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      throw new Error("Failed to toggle maintenance mode");
    }
  }

  async clearCache(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/maintenance/clear-cache/`
      );
      return response.data;
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw new Error("Failed to clear cache");
    }
  }

  async createBackup(
    backupType: "database" | "files" | "full" = "full"
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/backup/create/`, {
        backup_type: backupType,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating backup:", error);
      throw new Error("Failed to create backup");
    }
  }

  // System Settings
  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    try {
      console.log(
        `🔄 AdminService: Fetching system settings${
          category ? ` for category: ${category}` : ""
        }`
      );

      const params = category ? { category } : {};
      const response = await apiClient.get(`${this.baseUrl}/settings/`, {
        params,
      });

      console.log(`✅ AdminService: System settings response:`, response.data);

      // Handle paginated response - return results array
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("❌ AdminService: Error fetching system settings:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to fetch system settings: ${error?.message || "Unknown error"}`
      );
    }
  }

  async updateSystemSetting(
    key: string,
    value: string | number | boolean
  ): Promise<SystemSetting> {
    try {
      console.log(
        `🔄 AdminService: Updating system setting ${key} with value:`,
        value
      );

      const response = await apiClient.patch(
        `${this.baseUrl}/settings/${key}/`,
        {
          value: value.toString(),
        }
      );

      console.log(
        `✅ AdminService: System setting update response:`,
        response.data
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error updating system setting:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to update system setting: ${error?.message || "Unknown error"}`
      );
    }
  }

  async createSystemSetting(
    setting: Partial<SystemSetting>
  ): Promise<SystemSetting> {
    try {
      console.log(`🔄 AdminService: Creating system setting:`, setting);

      const response = await apiClient.post(
        `${this.baseUrl}/settings/`,
        setting
      );

      console.log(
        `✅ AdminService: System setting creation response:`,
        response.data
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ AdminService: Error creating system setting:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to create system setting: ${error?.message || "Unknown error"}`
      );
    }
  }

  async deleteSystemSetting(key: string): Promise<void> {
    try {
      console.log(`🔄 AdminService: Deleting system setting: ${key}`);

      await apiClient.delete(`${this.baseUrl}/settings/${key}/`);

      console.log(`✅ AdminService: System setting deleted successfully`);
    } catch (error: any) {
      console.error("❌ AdminService: Error deleting system setting:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw new Error(
        `Failed to delete system setting: ${error?.message || "Unknown error"}`
      );
    }
  }
}

export const adminService = new AdminService();
