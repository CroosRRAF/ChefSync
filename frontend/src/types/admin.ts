/**
 * Admin-related type definitions
 */

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  typed_value: string | number | boolean;
  setting_type: 'string' | 'integer' | 'boolean' | 'float' | 'json' | 'email' | 'url';
  category: 'general' | 'security' | 'performance' | 'notifications' | 'backup' | 'maintenance' | 'api' | 'ui' | 'delivery' | 'orders' | 'system' | 'users';
  description: string;
  is_public: boolean;
  is_encrypted: boolean;
  default_value: string;
  validation_rules: Record<string, any>;
  updated_by: number | null;
  updated_at: string;
  created_at: string;
}

export interface AdminDashboardStats {
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
  pending_user_approvals: number;
  system_health_score: number;
  active_sessions: number;
  unread_notifications: number;
  pending_backups: number;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  is_active: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AdminActivityLog {
  id: number;
  admin: {
    id: number;
    name: string;
    email: string;
  };
  action: string;
  resource_type: string;
  resource_id: string;
  description: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface AdminUserSummary {
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

export interface AdminOrderSummary {
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
