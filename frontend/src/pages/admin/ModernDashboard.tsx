import React, { useState, useEffect, useCallback } from 'react';
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
  BarChart3,
  PieChart,
  Calendar,
  Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminService, type DashboardStats, type AdminOrder, type AdminActivityLog } from '@/services/adminService';
import ModernStatsCard from '@/components/admin/ModernStatsCard';
import InteractiveChart from '@/components/admin/InteractiveChart';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import { formatCurrency } from '@/utils/numberUtils';
import NotificationCenter from '@/components/admin/NotificationCenter';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

const ModernDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Mock enhanced chart data
  const revenueChartData = [
    { name: 'Jan', value: 12000, revenue: 12000, orders: 45, growth: 8.2 },
    { name: 'Feb', value: 15000, revenue: 15000, orders: 52, growth: 25 },
    { name: 'Mar', value: 18000, revenue: 18000, orders: 61, growth: 20 },
    { name: 'Apr', value: 22000, revenue: 22000, orders: 78, growth: 22.2 },
    { name: 'May', value: 25000, revenue: 25000, orders: 89, growth: 13.6 },
    { name: 'Jun', value: 28000, revenue: 28000, orders: 95, growth: 12 }
  ];

  const userGrowthData = [
    { name: 'Jan', value: 120, users: 120, chefs: 15, customers: 105, growth: 15 },
    { name: 'Feb', value: 145, users: 145, chefs: 18, customers: 127, growth: 20.8 },
    { name: 'Mar', value: 168, users: 168, chefs: 22, customers: 146, growth: 15.9 },
    { name: 'Apr', value: 195, users: 195, chefs: 25, customers: 170, growth: 16.1 },
    { name: 'May', value: 220, users: 220, chefs: 28, customers: 192, growth: 12.8 },
    { name: 'Jun', value: 245, users: 245, chefs: 32, customers: 213, growth: 11.4 }
  ];

  const performanceData = [
    { name: 'Response Time', value: 245, unit: 'ms', target: 200, status: 'warning' },
    { name: 'Uptime', value: 99.9, unit: '%', target: 99.5, status: 'good' },
    { name: 'Error Rate', value: 0.1, unit: '%', target: 0.5, status: 'good' },
    { name: 'CPU Usage', value: 67, unit: '%', target: 80, status: 'good' },
    { name: 'Memory Usage', value: 84, unit: '%', target: 85, status: 'warning' }
  ];

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, ordersData, activitiesData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders(10),
        adminService.getRecentActivities(10)
      ]);
      
      setStats(statsData);
      setRecentOrders(ordersData);
      setRecentActivities(activitiesData);
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

  // Calculate sparkline data
  const getSparklineData = (data: any[], field: string) => {
    return data.map(item => item[field] || 0);
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-red-600 mt-2">Error loading dashboard data</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          subtitle={`${stats?.active_users || 0} active users`}
          icon={<Users className="h-6 w-6" />}
          trend={{
            value: stats?.user_growth || 0,
            isPositive: (stats?.user_growth || 0) >= 0,
            period: 'vs last month'
          }}
          color="blue"
          showSparkline
          sparklineData={getSparklineData(userGrowthData, 'users')}
        />
        
        <ModernStatsCard
          title="Revenue"
          value={`$${(stats?.total_revenue || 0).toLocaleString()}`}
          subtitle={`$${(stats?.revenue_today || 0).toLocaleString()} today`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{
            value: stats?.revenue_growth || 0,
            isPositive: (stats?.revenue_growth || 0) >= 0,
            period: 'vs last month'
          }}
          color="green"
          showSparkline
          sparklineData={getSparklineData(revenueChartData, 'revenue')}
        />
        
        <ModernStatsCard
          title="Orders"
          value={stats?.total_orders || 0}
          subtitle={`${stats?.orders_today || 0} new today`}
          icon={<ShoppingCart className="h-6 w-6" />}
          trend={{
            value: stats?.order_growth || 0,
            isPositive: (stats?.order_growth || 0) >= 0,
            period: 'vs last month'
          }}
          color="purple"
          showSparkline
          sparklineData={getSparklineData(revenueChartData, 'orders')}
        />
        
        <ModernStatsCard
          title="Active Chefs"
          value={stats?.active_chefs || 0}
          subtitle={`${stats?.pending_chef_approvals || 0} pending approval`}
          icon={<ChefHat className="h-6 w-6" />}
          trend={{
            value: stats?.chef_growth || 0,
            isPositive: (stats?.chef_growth || 0) >= 0,
            period: 'vs last month'
          }}
          color="teal"
          showSparkline
          sparklineData={getSparklineData(userGrowthData, 'chefs')}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Quick Actions</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Manage your platform</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button size="sm" variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Add User
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <ChefHat className="h-3 w-3 mr-1" />
                Add Chef
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Send Alert
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">System Health</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">All systems operational</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2 mt-4">
              {performanceData.slice(0, 2).map((metric, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-green-700 dark:text-green-300">{metric.name}</span>
                  <Badge 
                    variant={metric.status === 'good' ? 'default' : 'secondary'}
                    className="h-4 px-1.5"
                  >
                    {metric.value}{metric.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Recent Activity</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Latest updates</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="space-y-2 mt-4">
              {recentActivities.slice(0, 2).map((activity, index) => (
                <div key={index} className="text-xs text-purple-700 dark:text-purple-300">
                  <div className="font-medium truncate">{activity.action}</div>
                  <div className="text-purple-600 dark:text-purple-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                data={[
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <span className="ml-2 text-gray-600">v2.1.0</span>
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
  );
};

export default ModernDashboard;