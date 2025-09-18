import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
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
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  orderTrends: Array<{ day: string; orders: number }>;
  roleDistribution: Record<string, number>;
}

const AdminAnalytics: React.FC = () => {
  const { user } = useUserStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/admin/analytics/?range=${timeRange}`);
      setAnalytics(response.data || response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data for development
      setAnalytics(getMockAnalytics());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAnalytics = (): AnalyticsData => ({
    totalUsers: 1247,
    totalOrders: 8934,
    totalRevenue: 45678.90,
    averageOrderValue: 51.12,
    ordersByStatus: {
      'pending': 45,
      'preparing': 23,
      'ready': 12,
      'out_for_delivery': 8,
      'delivered': 8846
    },
    revenueByMonth: [
      { month: 'Jan', revenue: 4200 },
      { month: 'Feb', revenue: 3800 },
      { month: 'Mar', revenue: 4500 },
      { month: 'Apr', revenue: 5200 },
      { month: 'May', revenue: 4800 },
      { month: 'Jun', revenue: 6100 }
    ],
    topItems: [
      { name: 'Margherita Pizza', quantity: 234, revenue: 4680 },
      { name: 'Chicken Burger', quantity: 189, revenue: 2835 },
      { name: 'Caesar Salad', quantity: 156, revenue: 2340 },
      { name: 'Pasta Carbonara', quantity: 134, revenue: 2010 },
      { name: 'Chocolate Cake', quantity: 98, revenue: 1470 }
    ],
    userGrowth: [
      { month: 'Jan', users: 890 },
      { month: 'Feb', users: 920 },
      { month: 'Mar', users: 980 },
      { month: 'Apr', users: 1050 },
      { month: 'May', users: 1120 },
      { month: 'Jun', users: 1247 }
    ],
    orderTrends: [
      { day: 'Mon', orders: 45 },
      { day: 'Tue', orders: 52 },
      { day: 'Wed', orders: 48 },
      { day: 'Thu', orders: 61 },
      { day: 'Fri', orders: 78 },
      { day: 'Sat', orders: 89 },
      { day: 'Sun', orders: 67 }
    ],
    roleDistribution: {
      'customer': 1050,
      'cook': 45,
      'delivery_agent': 32,
      'admin': 8
    }
  });

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
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
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
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'preparing' ? 'bg-blue-500' :
                      status === 'ready' ? 'bg-green-500' :
                      status === 'out_for_delivery' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Breakdown of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      role === 'customer' ? 'bg-blue-500' :
                      role === 'cook' ? 'bg-orange-500' :
                      role === 'delivery_agent' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
          <CardDescription>Most popular menu items by quantity and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} orders
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${item.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    ${(item.revenue / item.quantity).toFixed(2)} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {analytics.revenueByMonth.map((month, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium">{month.month}</div>
                <div className="text-2xl font-bold text-green-600">
                  ${month.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </AdminLayout>
  );
};

export default AdminAnalytics;
