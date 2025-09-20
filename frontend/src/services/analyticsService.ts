// Analytics service for admin dashboard - now using admin service
import { adminService, type DashboardStats } from './adminService';

class AnalyticsService {
  private baseUrl = "/api/admin";
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
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  }

;
  }
}

export const analyticsService = new AnalyticsService();
