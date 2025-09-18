// Analytics service for admin dashboard
export interface DashboardStats {
  total_users: number;
  active_users: number;
  new_users_this_week: number;
  new_users_this_month: number;
  user_growth: number;
  
  total_chefs: number;
  active_chefs: number;
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
  pending_approvals: number;
}

class AnalyticsService {
  private baseUrl = '/api/analytics';

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/stats/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('chefsync_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for development
      return this.getMockDashboardStats();
    }
  }

  private getMockDashboardStats(): DashboardStats {
    return {
      total_users: 1247,
      active_users: 892,
      new_users_this_week: 45,
      new_users_this_month: 156,
      user_growth: 12.5,
      
      total_chefs: 45,
      active_chefs: 38,
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
      pending_approvals: 12,
    };
  }
}

export const analyticsService = new AnalyticsService();
