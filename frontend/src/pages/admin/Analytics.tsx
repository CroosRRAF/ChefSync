import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/fetcher';
import InteractiveChart from '@/components/admin/InteractiveChart';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Calendar,
  Clock,
  MapPin,
  ChefHat,
  Truck,
  User,
  Activity,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
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
  pending_approvals: number;
}

const AdminAnalytics: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30d');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAnalytics();
    } else {
      setIsLoading(false);
      console.log('User not authenticated or not admin:', { isAuthenticated, userRole: user?.role });
    }
  }, [timeRange, isAuthenticated, user]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching analytics with timeRange:', timeRange);
      const response = await apiClient.get(`/analytics/dashboard/stats/?range=${timeRange}`);
      console.log('Analytics response:', response);
      setAnalytics(response.data || response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Show error state instead of fallback to dummy data
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to access analytics data.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <AdminLayout>
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need admin privileges to access analytics data.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to load analytics data at this time.
            </p>
            <Button onClick={fetchAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Analytics Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {analytics.user_growth > 0 ? '+' : ''}{analytics.user_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_orders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {analytics.order_growth > 0 ? '+' : ''}{analytics.order_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {analytics.revenue_growth > 0 ? '+' : ''}{analytics.revenue_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.active_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Currently active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>User registration and activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Total Users</span>
                </div>
                <Badge variant="secondary">{analytics.total_users}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Active Users</span>
                </div>
                <Badge variant="secondary">{analytics.active_users}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>New Today</span>
                </div>
                <Badge variant="secondary">{analytics.new_users_today}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>New This Week</span>
                </div>
                <Badge variant="secondary">{analytics.new_users_this_week}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>New This Month</span>
                </div>
                <Badge variant="secondary">{analytics.new_users_this_month}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Order Statistics</CardTitle>
            <CardDescription>Order volume and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Total Orders</span>
                </div>
                <Badge variant="secondary">{analytics.total_orders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Orders Today</span>
                </div>
                <Badge variant="secondary">{analytics.orders_today}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Orders This Week</span>
                </div>
                <Badge variant="secondary">{analytics.orders_this_week}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Orders This Month</span>
                </div>
                <Badge variant="secondary">{analytics.orders_this_month}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Statistics</CardTitle>
          <CardDescription>Revenue breakdown by time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.total_revenue.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Revenue Today</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.revenue_today.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Revenue This Week</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.revenue_this_week.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Revenue This Month</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.revenue_this_month.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Food Statistics</CardTitle>
          <CardDescription>Menu items and availability status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Total Foods</div>
              <div className="text-2xl font-bold">
                {analytics.total_foods}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Active Foods</div>
              <div className="text-2xl font-bold text-green-600">
                {analytics.active_foods}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Inactive Foods</div>
              <div className="text-2xl font-bold text-red-600">
                {analytics.total_foods - analytics.active_foods}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
