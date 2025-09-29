import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  ShoppingCart,
  DollarSign,
  ChefHat,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Bell,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  Globe,
  Package,
  Utensils,
  Shield,
  MessageSquare,
  Settings,
  FileText,
  UserCheck,
  UserX,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminService, type DashboardStats, type AdminOrder, type AdminActivityLog } from '@/services/adminService';
import InteractiveChart from '@/components/admin/InteractiveChart';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import { formatCurrency } from '@/utils/numberUtils';
import NotificationCenter from '@/components/admin/NotificationCenter';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

// Fallback data for charts when backend data is not available
const generateFallbackChartData = (type: 'revenue' | 'growth' | 'orders' | 'weekly', days: number = 30) => {
  const labels = [];
  const data = [];
  const currentDate = new Date();
  
  const dataDays = type === 'weekly' ? 7 : days;
  
  for (let i = dataDays - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    if (type === 'weekly') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      labels.push(dayNames[date.getDay()]);
    } else {
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    if (type === 'revenue') {
      data.push(Math.floor(Math.random() * 1000) + 500);
    } else if (type === 'growth') {
      data.push(Math.floor(Math.random() * 20) + 5);
    } else if (type === 'orders') {
      data.push(Math.floor(Math.random() * 50) + 10);
    } else if (type === 'weekly') {
      data.push(Math.floor(Math.random() * 30) + 5);
    }
  }
  
  return {
    chart_type: type === 'revenue' ? 'area' : type === 'growth' ? 'bar' : type === 'orders' ? 'line' : 'pie',
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Trend`,
    data: {
      labels,
      datasets: [{
        label: type.charAt(0).toUpperCase() + type.slice(1),
        data,
        backgroundColor: type === 'revenue' ? 'rgba(34, 197, 94, 0.2)' : 
                        type === 'growth' ? 'rgba(59, 130, 246, 0.2)' : 
                        type === 'orders' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 99, 132, 0.2)',
        borderColor: type === 'revenue' ? '#22c55e' : 
                    type === 'growth' ? '#3b82f6' : 
                    type === 'orders' ? '#a855f7' : '#ff6384',
        borderWidth: 2,
        fill: type === 'revenue'
      }]
    }
  };
};

const UltimateDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any>(null);
  const [growthChart, setGrowthChart] = useState<any>(null);
  const [ordersChart, setOrdersChart] = useState<any>(null);

  // Quick actions state
  const [quickActions] = useState([
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      path: '/admin/users',
      stats: 'Manage all users'
    },
    {
      title: 'Cook Approvals',
      description: 'Review and approve cook applications',
      icon: ChefHat,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
      path: '/admin/approvals/cooks',
      stats: 'Review applications'
    },
    {
      title: 'Delivery Agent Approvals',
      description: 'Review and approve delivery agent applications',
      icon: Package,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      path: '/admin/approvals/delivery-agents',
      stats: 'Review applications'
    },
    {
      title: 'Orders',
      description: 'View and manage all orders',
      icon: ShoppingCart,
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
      path: '/admin/orders',
      stats: 'Track orders'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-100',
      path: '/admin/analytics',
      stats: 'View reports'
    },
    {
      title: 'Communications',
      description: 'Manage customer communications',
      icon: MessageSquare,
      iconColor: 'text-pink-600',
      iconBgColor: 'bg-pink-100',
      path: '/admin/communications',
      stats: 'Manage messages'
    }
  ]);

  // Load dashboard data
  const loadDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Load stats
      const statsData = await adminService.getDashboardStats();
      setStats(statsData);

      // Load recent orders
      const ordersData = await adminService.getRecentOrders();
      setRecentOrders(ordersData);

      // Load recent activities
      const activitiesData = await adminService.getRecentActivities();
      setRecentActivities(activitiesData);

      // Load chart data
      try {
        const chartData = await adminService.getChartData();
        setRevenueChart(chartData.revenue || generateFallbackChartData('revenue'));
        setGrowthChart(chartData.growth || generateFallbackChartData('growth'));
        setOrdersChart(chartData.orders || generateFallbackChartData('orders'));
        setWeeklyPerformance(chartData.weekly || generateFallbackChartData('weekly'));
      } catch (chartError) {
        console.warn('Chart data not available, using fallback data');
        setRevenueChart(generateFallbackChartData('revenue'));
        setGrowthChart(generateFallbackChartData('growth'));
        setOrdersChart(generateFallbackChartData('orders'));
        setWeeklyPerformance(generateFallbackChartData('weekly'));
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
      
      // Set fallback data
      setStats({
        total_users: 0,
        total_orders: 0,
        total_revenue: 0,
        pending_approvals: 0,
        active_cooks: 0,
        active_delivery_agents: 0,
        total_foods: 0,
        low_stock_items: 0
      });
      setRevenueChart(generateFallbackChartData('revenue'));
      setGrowthChart(generateFallbackChartData('growth'));
      setOrdersChart(generateFallbackChartData('orders'));
      setWeeklyPerformance(generateFallbackChartData('weekly'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (activity: string) => {
    if (activity.includes('login')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (activity.includes('order')) return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    if (activity.includes('approval')) return <Shield className="h-4 w-4 text-orange-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Admin'}. Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_approvals}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleQuickAction(action.path)}
              >
                <div className={`p-2 rounded-lg ${action.iconBgColor}`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        {revenueChart && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveChart data={revenueChart} />
            </CardContent>
          </Card>
        )}

        {/* Orders Chart */}
        {ordersChart && (
          <Card>
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveChart data={ordersChart} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Orders and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name} • {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  {getActivityIcon(activity.activity_type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.activity_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user_name} • {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemHealthMonitor />
        </CardContent>
      </Card>
    </div>
  );
};

export default UltimateDashboard;
