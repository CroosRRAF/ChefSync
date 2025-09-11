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
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Settings,
  Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminService, type DashboardStats, type AdminOrder, type AdminActivityLog } from '@/services/adminService';
import AdvancedStatsCard from '@/components/admin/AdvancedStatsCard';
import InteractiveChart from '@/components/admin/InteractiveChart';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import NotificationCenter from '@/components/admin/NotificationCenter';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Mock chart data - in real app, this would come from the API
  const revenueChartData = [
    { name: 'Jan', value: 12000, revenue: 12000, orders: 45 },
    { name: 'Feb', value: 15000, revenue: 15000, orders: 52 },
    { name: 'Mar', value: 18000, revenue: 18000, orders: 61 },
    { name: 'Apr', value: 22000, revenue: 22000, orders: 78 },
    { name: 'May', value: 25000, revenue: 25000, orders: 89 },
    { name: 'Jun', value: 28000, revenue: 28000, orders: 95 }
  ];

  const userGrowthData = [
    { name: 'Jan', value: 120, users: 120, chefs: 15 },
    { name: 'Feb', value: 145, users: 145, chefs: 18 },
    { name: 'Mar', value: 168, users: 168, chefs: 22 },
    { name: 'Apr', value: 195, users: 195, chefs: 25 },
    { name: 'May', value: 220, users: 220, chefs: 28 },
    { name: 'Jun', value: 245, users: 245, chefs: 32 }
  ];

  const orderStatusData = [
    { name: 'Completed', value: 45, color: '#10B981' },
    { name: 'Pending', value: 25, color: '#F59E0B' },
    { name: 'Processing', value: 20, color: '#3B82F6' },
    { name: 'Cancelled', value: 10, color: '#EF4444' }
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
    // Implement export functionality
    console.log('Exporting dashboard data...');
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-red-600">Error loading dashboard data</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <NotificationCenter />
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdvancedStatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          subtitle={`${stats?.active_users || 0} active`}
          icon={<Users className="h-6 w-6" />}
          trend={{
            value: stats?.user_growth || 0,
            isPositive: (stats?.user_growth || 0) >= 0,
            period: 'vs last week'
          }}
          color="blue"
          onRefresh={handleRefresh}
          showChart
          chartData={userGrowthData.map(d => ({ name: d.name, value: d.users }))}
        />
        
        <AdvancedStatsCard
          title="Total Revenue"
          value={`$${(stats?.total_revenue || 0).toLocaleString()}`}
          subtitle={`$${(stats?.revenue_today || 0).toLocaleString()} today`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{
            value: stats?.revenue_growth || 0,
            isPositive: (stats?.revenue_growth || 0) >= 0,
            period: 'vs last week'
          }}
          color="green"
          onRefresh={handleRefresh}
          showChart
          chartData={revenueChartData.map(d => ({ name: d.name, value: d.revenue }))}
        />
        
        <AdvancedStatsCard
          title="Total Orders"
          value={stats?.total_orders || 0}
          subtitle={`${stats?.orders_today || 0} today`}
          icon={<ShoppingCart className="h-6 w-6" />}
          trend={{
            value: stats?.order_growth || 0,
            isPositive: (stats?.order_growth || 0) >= 0,
            period: 'vs last week'
          }}
          color="purple"
          onRefresh={handleRefresh}
          showChart
          chartData={revenueChartData.map(d => ({ name: d.name, value: d.orders }))}
        />
        
        <AdvancedStatsCard
          title="Active Chefs"
          value={stats?.active_chefs || 0}
          subtitle={`${stats?.pending_chef_approvals || 0} pending`}
          icon={<ChefHat className="h-6 w-6" />}
          trend={{
            value: stats?.chef_growth || 0,
            isPositive: (stats?.chef_growth || 0) >= 0,
            period: 'vs last week'
          }}
          color="indigo"
          onRefresh={handleRefresh}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <InteractiveChart
              title="Revenue & Orders Trend"
              data={revenueChartData}
              type="line"
              height={300}
              onExport={handleExport}
            />
            
            {/* Order Status Distribution */}
            <InteractiveChart
              title="Order Status Distribution"
              data={orderStatusData}
              type="pie"
              height={300}
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
                  <span className="font-mono text-sm">{value}</span>
                )
              },
              {
                key: 'customer_name',
                title: 'Customer',
                sortable: true
              },
              {
                key: 'total_amount',
                title: 'Amount',
                sortable: true,
                align: 'right',
                render: (value) => (
                  <span className="font-medium">${value.toFixed(2)}</span>
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
                  <span className="text-sm text-gray-500">
                    {new Date(value).toLocaleDateString()}
                  </span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <InteractiveChart
              title="User Growth"
              data={userGrowthData}
              type="area"
              height={300}
              onExport={handleExport}
            />
            
            {/* Revenue Chart */}
            <InteractiveChart
              title="Revenue Trend"
              data={revenueChartData}
              type="bar"
              height={300}
              onExport={handleExport}
            />
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <AdvancedDataTable
            title="Recent Admin Activities"
            data={recentActivities}
            columns={[
              {
                key: 'admin_name',
                title: 'Admin',
                sortable: true
              },
              {
                key: 'action',
                title: 'Action',
                sortable: true,
                render: (value) => (
                  <Badge variant="outline">{value}</Badge>
                )
              },
              {
                key: 'resource_type',
                title: 'Resource',
                sortable: true
              },
              {
                key: 'description',
                title: 'Description'
              },
              {
                key: 'timestamp',
                title: 'Time',
                sortable: true,
                render: (value) => (
                  <span className="text-sm text-gray-500">
                    {new Date(value).toLocaleString()}
                  </span>
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
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleQuickAction('backup')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleQuickAction('maintenance')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Maintenance Mode
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleQuickAction('cache')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {lastRefresh && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;
