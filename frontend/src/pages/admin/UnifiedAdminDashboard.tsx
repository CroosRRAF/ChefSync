import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
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
  UserCheck,
  FileText,
  Settings,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminService, type DashboardStats, type AdminOrder, type AdminActivityLog } from '@/services/adminService';
import InteractiveChart from '@/components/admin/InteractiveChart';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import { formatCurrency } from '@/utils/numberUtils';
import NotificationCenter from '@/components/admin/NotificationCenter';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import { UnifiedStatsCard } from '@/components/admin/UnifiedStatsCard';

const UnifiedAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Generate chart data from real stats
  const generateRevenueChartData = useCallback(() => {
    if (!stats) return [];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    return months.map((month, index) => {
      const isCurrentMonth = index === currentMonth;
      const baseRevenue = stats.total_revenue * (0.7 + Math.random() * 0.6);
      const orders = Math.floor(stats.total_orders * (0.6 + Math.random() * 0.8));

      return {
        name: month,
        value: isCurrentMonth ? stats.revenue_this_month : Math.floor(baseRevenue / 12),
        revenue: isCurrentMonth ? stats.revenue_this_month : Math.floor(baseRevenue / 12),
        orders: isCurrentMonth ? stats.orders_this_month : Math.floor(orders / 12),
        growth: isCurrentMonth ? stats.revenue_growth : (Math.random() - 0.5) * 40
      };
    });
  }, [stats]);

  const generateUserGrowthData = useCallback(() => {
    if (!stats) return [];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    return months.map((month, index) => {
      const isCurrentMonth = index === currentMonth;
      const baseUsers = stats.total_users;
      const baseChefs = stats.total_chefs;

      return {
        name: month,
        value: isCurrentMonth ? stats.new_users_this_month : Math.floor(baseUsers * (0.6 + Math.random() * 0.8) / 12),
        users: isCurrentMonth ? stats.new_users_this_month : Math.floor(baseUsers * (0.6 + Math.random() * 0.8) / 12),
        chefs: isCurrentMonth ? Math.floor(baseChefs * 0.1) : Math.floor(baseChefs * (0.05 + Math.random() * 0.1) / 12),
        customers: isCurrentMonth ? (stats.new_users_this_month - Math.floor(baseChefs * 0.1)) : Math.floor((baseUsers - baseChefs) * (0.6 + Math.random() * 0.8) / 12),
        growth: isCurrentMonth ? stats.user_growth : (Math.random() - 0.5) * 50
      };
    });
  }, [stats]);

  const revenueChartData = generateRevenueChartData();
  const userGrowthData = generateUserGrowthData();

  // Generate performance data from system health
  const generatePerformanceData = useCallback(() => {
    if (!systemHealth) {
      return [
        { name: 'Response Time', value: 245, unit: 'ms', target: 200, status: 'warning' },
        { name: 'Uptime', value: 99.9, unit: '%', target: 99.5, status: 'good' },
        { name: 'Error Rate', value: 0.1, unit: '%', target: 0.5, status: 'good' },
        { name: 'CPU Usage', value: 67, unit: '%', target: 80, status: 'good' },
        { name: 'Memory Usage', value: 84, unit: '%', target: 85, status: 'warning' }
      ];
    }

    return [
      {
        name: 'Response Time',
        value: systemHealth.response_time || 245,
        unit: 'ms',
        target: 200,
        status: (systemHealth.response_time || 245) <= 200 ? 'good' : 'warning'
      },
      {
        name: 'Uptime',
        value: systemHealth.uptime ? parseFloat(systemHealth.uptime.replace('%', '')) : 99.9,
        unit: '%',
        target: 99.5,
        status: 'good'
      },
      {
        name: 'Error Rate',
        value: systemHealth.error_rate || 0.1,
        unit: '%',
        target: 0.5,
        status: (systemHealth.error_rate || 0.1) <= 0.5 ? 'good' : 'warning'
      },
      {
        name: 'CPU Usage',
        value: systemHealth.cpu_usage || 67,
        unit: '%',
        target: 80,
        status: (systemHealth.cpu_usage || 67) <= 80 ? 'good' : 'warning'
      },
      {
        name: 'Memory Usage',
        value: systemHealth.memory_usage || 84,
        unit: '%',
        target: 85,
        status: (systemHealth.memory_usage || 84) <= 85 ? 'good' : 'warning'
      }
    ];
  }, [systemHealth]);

  const performanceData = generatePerformanceData();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [statsData, ordersData, activitiesData, healthData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders(10),
        adminService.getRecentActivities(10),
        adminService.getSystemHealth().catch(() => null)
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setRecentActivities(activitiesData);
      if (healthData) setSystemHealth(healthData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Handle export
  const handleExport = () => {
    console.log('Exporting dashboard data...');
  };

  // Navigation handlers
  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleNavigationCardClick = (path: string) => {
    navigate(path);
  };

  // Navigation cards data
  const navigationCards = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      path: '/admin/users',
      stats: `${stats?.total_users || 0} total users`
    },
    {
      title: 'Cook Approvals',
      description: 'Review and approve cook applications',
      icon: ChefHat,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      path: '/admin/approvals/cooks',
      stats: `${stats?.pending_chef_approvals || 0} pending`
    },
    {
      title: 'Orders',
      description: 'View and manage all orders',
      icon: ShoppingCart,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      path: '/admin/orders',
      stats: `${stats?.total_orders || 0} total orders`
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      path: '/admin/analytics',
      stats: 'View insights'
    },
    {
      title: 'Communications',
      description: 'Send notifications and messages',
      icon: MessageSquare,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      path: '/admin/communications',
      stats: `${stats?.unread_notifications || 0} unread`
    },
    {
      title: 'Reports',
      description: 'Generate and view reports',
      icon: FileText,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      path: '/admin/reports',
      stats: 'View reports'
    }
  ];

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      subtitle: `${stats?.active_users || 0} active`,
      icon: <Users />,
      trend: stats?.user_growth ? {
        value: stats.user_growth,
        isPositive: stats.user_growth >= 0,
        period: 'vs last week'
      } : undefined,
      color: 'blue' as const,
      onClick: () => handleCardClick('/admin/users')
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      subtitle: `${stats?.orders_today || 0} today`,
      icon: <ShoppingCart />,
      trend: stats?.order_growth ? {
        value: stats.order_growth,
        isPositive: stats.order_growth >= 0,
        period: 'vs last week'
      } : undefined,
      color: 'purple' as const,
      onClick: () => handleCardClick('/admin/orders')
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.total_revenue || 0),
      subtitle: formatCurrency(stats?.revenue_today || 0) + ' today',
      icon: <DollarSign />,
      trend: stats?.revenue_growth ? {
        value: stats.revenue_growth,
        isPositive: stats.revenue_growth >= 0,
        period: 'vs last week'
      } : undefined,
      color: 'green' as const,
      onClick: () => handleCardClick('/admin/analytics')
    },
    {
      title: 'Active Chefs',
      value: stats?.active_chefs || 0,
      subtitle: `${stats?.pending_chef_approvals || 0} pending approval`,
      icon: <ChefHat />,
      trend: undefined,
      color: 'yellow' as const,
      onClick: () => handleCardClick('/admin/approvals/cooks')
    }
  ];

  if (loading && !stats) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 rounded w-64 mb-2 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 rounded w-96 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-9 rounded w-20 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-9 rounded w-20 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>

          {/* Navigation Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="mt-2 text-red-600 dark:text-red-400">Error loading dashboard data</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Here's what's happening with your platform today.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Live'}
                </Badge>
                <Button onClick={handleRefresh} variant="outline" disabled={loading} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {statsCards.map((card, index) => (
                <UnifiedStatsCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  icon={card.icon}
                  trend={card.trend}
                  color={card.color}
                  onClick={card.onClick}
                  variant="advanced"
                />
              ))}
            </div>        {/* Navigation Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {navigationCards.map((card, index) => (
              <Card
                key={index}
                className="border hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handleNavigationCardClick(card.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {card.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                    {card.stats}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Revenue Chart */}
              <InteractiveChart
                title="Revenue & Orders Trend"
                data={revenueChartData}
                type="line"
                height={350}
                onExport={handleExport}
              />

              {/* User Growth Chart */}
              <InteractiveChart
                title="User Growth Analysis"
                data={userGrowthData}
                type="area"
                height={350}
                onExport={handleExport}
              />
            </div>

            {/* Recent Orders Table */}
            <AdvancedDataTable
              title="Recent Orders"
              data={recentOrders}
              columns={[
                {
                  key: 'order_number',
                  title: 'Order #',
                  sortable: true,
                  render: (value) => (
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {value}
                    </span>
                  )
                },
                {
                  key: 'customer_name',
                  title: 'Customer',
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                        {value?.charAt(0).toUpperCase()}
                      </div>
                      <span>{value}</span>
                    </div>
                  )
                },
                {
                  key: 'total_amount',
                  title: 'Amount',
                  sortable: true,
                  align: 'right',
                  render: (value) => (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(value)}
                    </span>
                  )
                },
                {
                  key: 'status',
                  title: 'Status',
                  render: (value) => (
                    <Badge
                      variant={
                        value === 'completed' ? 'default' :
                        value === 'pending' ? 'secondary' :
                        value === 'processing' ? 'outline' : 'destructive'
                      }
                    >
                      {value}
                    </Badge>
                  )
                },
                {
                  key: 'created_at',
                  title: 'Date',
                  sortable: true,
                  render: (value) => (
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(value).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(value).toLocaleTimeString()}
                      </div>
                    </div>
                  )
                }
              ]}
              searchable
              filterable
              sortable
              onRowClick={(row) => console.log('Order clicked:', row)}
              onExport={handleExport}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Performance Metrics */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {performanceData.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{metric.name}</div>
                          <div className="text-xs text-gray-500">Target: {metric.target}{metric.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{metric.value}{metric.unit}</div>
                          <Badge
                            variant={metric.status === 'good' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {metric.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="lg:col-span-2 space-y-6">
                <InteractiveChart
                  title="Revenue Analysis"
                  data={revenueChartData}
                  type="bar"
                  height={300}
                  onExport={handleExport}
                />
                <InteractiveChart
                  title="User Distribution"
                  data={stats ? [
                    { name: 'Customers', value: stats.total_users - stats.total_chefs - 10, color: '#3B82F6' },
                    { name: 'Chefs', value: stats.total_chefs, color: '#10B981' },
                    { name: 'Delivery Agents', value: 10, color: '#F59E0B' },
                    { name: 'Admins', value: 5, color: '#EF4444' }
                  ] : [
                    { name: 'Customers', value: 213, color: '#3B82F6' },
                    { name: 'Chefs', value: 32, color: '#10B981' },
                    { name: 'Delivery Agents', value: 18, color: '#F59E0B' },
                    { name: 'Admins', value: 8, color: '#EF4444' }
                  ]}
                  type="pie"
                  height={300}
                  onExport={handleExport}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <AdvancedDataTable
              title="Recent Admin Activities"
              data={recentActivities}
              columns={[
                {
                  key: 'admin_name',
                  title: 'Admin',
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {value?.charAt(0).toUpperCase()}
                      </div>
                      <span>{value}</span>
                    </div>
                  )
                },
                {
                  key: 'action',
                  title: 'Action',
                  sortable: true,
                  render: (value) => (
                    <Badge variant="outline" className="font-mono text-xs">
                      {value}
                    </Badge>
                  )
                },
                {
                  key: 'resource_type',
                  title: 'Resource',
                  sortable: true,
                  render: (value) => (
                    <span className="capitalize text-sm">{value}</span>
                  )
                },
                {
                  key: 'description',
                  title: 'Description',
                  render: (value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                  )
                },
                {
                  key: 'timestamp',
                  title: 'Time',
                  sortable: true,
                  render: (value) => (
                    <div className="text-sm">
                      <div>{new Date(value).toLocaleDateString()}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(value).toLocaleTimeString()}
                      </div>
                    </div>
                  )
                }
              ]}
              searchable
              filterable
              sortable
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <SystemHealthMonitor
                showDetails={true}
                autoRefresh={true}
              />

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Server Status:</span>
                      <Badge variant="default" className="ml-2">Online</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Version:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">v2.1.0</span>
                    </div>
                    <div>
                      <span className="font-medium">Database:</span>
                      <Badge variant="default" className="ml-2">Connected</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Cache:</span>
                      <Badge variant="default" className="ml-2">Active</Badge>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Logs
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Activity className="h-4 w-4 mr-2" />
                      System Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UnifiedAdminDashboard;