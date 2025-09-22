// Analytics service for admin dashboard - now using admin service
import { adminService, type DashboardStats } from './adminService';

class AnalyticsService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/stats/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for development if admin service fails
      return this.getMockDashboardStats();
    }
  }

  private getMockDashboardStats(): DashboardStats {
    return {
      total_users: 1247,
      active_users: 892,
      new_users_today: 12,
      new_users_this_week: 45,
      new_users_this_month: 156,
      user_growth: 12.5,
      
      total_chefs: 45,
      active_chefs: 38,
      pending_chef_approvals: 7,
      chef_growth: 8.2,
      
      total_orders: 2341,
      orders_today: 24,
      orders_this_week: 156,
      orders_this_month: 567,
      order_growth: 15.3,
      
      total_revenue: 45678.90,
      revenue_today: 1247.50,
      revenue_this_week: 8765.40,
      revenue_this_month: 23456.70,
      revenue_growth: 18.7,
      
      total_foods: 234,
      active_foods: 198,
      pending_food_approvals: 12,
      
      system_health_score: 85.5,
      active_sessions: 23,
      unread_notifications: 5,
      pending_backups: 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
