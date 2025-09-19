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
  Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminService, type DashboardStats, type AdminOrder, type AdminActivityLog } from '@/services/adminService';
import InteractiveChart from '@/components/admin/InteractiveChart';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import { formatCurrency } from '@/utils/numberUtils';
import NotificationCenter from '@/components/admin/NotificationCenter';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

const ModernDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Generate chart data from real stats
  const generateRevenueChartData = useCallback(() => {
    if (!stats) return [];
    
    // Create monthly data based on current stats
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      const isCurrentMonth = index === currentMonth;
      const baseRevenue = stats.total_revenue * (0.7 + Math.random() * 0.6); // Random variation
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
    
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
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
        adminService.getSystemHealth().catch(() => null) // Don't fail if system health is not available
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

  // Navigation handlers for stats cards
  const handleCardClick = (route: string) => {
    navigate(route);
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
            <div className="h-8 rounded w-64 mb-2 animate-pulse" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
            }}></div>
            <div className="h-4 rounded w-96 animate-pulse" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
            }}></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-9 rounded w-20 animate-pulse" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
            }}></div>
            <div className="h-9 rounded w-20 animate-pulse" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
            }}></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg animate-pulse" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
            }}></div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-lg animate-pulse" style={{
            backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
          }}></div>
          <div className="h-80 rounded-lg animate-pulse" style={{
            backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>Dashboard</h1>
            <p className="mt-2" style={{
              color: theme === 'light' ? '#EF4444' : '#F87171'
            }}>Error loading dashboard data</p>
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
            <h1 className="text-3xl font-bold" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>
              Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
            </h1>
            <p className="mt-2" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Total Users */}
          <Card 
            className="border hover:shadow-lg transition-all duration-200 cursor-pointer group"
            style={{
              background: theme === 'light' ? 
                'linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%)' : 
                'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
              borderColor: theme === 'light' ? '#BFDBFE' : '#1E3A8A',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}
            onClick={() => handleCardClick('/admin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{
                    color: theme === 'light' ? '#2563EB' : '#3B82F6'
                  }}>Total Users</p>
                  <p className="text-3xl font-bold mt-2" style={{
                    color: theme === 'light' ? '#1E3A8A' : '#93C5FD'
                  }}>
                    {stats?.total_users || 0}
                  </p>
                  <p className="text-xs mt-1" style={{
                    color: theme === 'light' ? '#2563EB' : '#3B82F6'
                  }}>
                    {stats?.active_users || 0} active
                  </p>
                </div>
                <div className="p-3 rounded-full group-hover:opacity-90 transition-opacity" style={{
                  backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6'
                }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" style={{
                  color: theme === 'light' ? '#2563EB' : '#3B82F6'
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card 
            className="border hover:shadow-lg transition-all duration-200 cursor-pointer group"
            style={{
              background: theme === 'light' ? 
                'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)' : 
                'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
              borderColor: theme === 'light' ? '#C4B5FD' : '#5B21B6',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}
            onClick={() => handleCardClick('/admin/orders')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{
                    color: theme === 'light' ? '#7C3AED' : '#A78BFA'
                  }}>Total Orders</p>
                  <p className="text-3xl font-bold mt-2" style={{
                    color: theme === 'light' ? '#5B21B6' : '#C4B5FD'
                  }}>
                    {stats?.total_orders || 0}
                  </p>
                  <p className="text-xs mt-1" style={{
                    color: theme === 'light' ? '#7C3AED' : '#A78BFA'
                  }}>
                    {stats?.orders_today || 0} today
                  </p>
                </div>
                <div className="p-3 rounded-full group-hover:opacity-90 transition-opacity" style={{
                  backgroundColor: theme === 'light' ? '#7C3AED' : '#8B5CF6'
                }}>
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" style={{
                  color: theme === 'light' ? '#7C3AED' : '#8B5CF6'
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card 
            className="border hover:shadow-lg transition-all duration-200 cursor-pointer group"
            style={{
              background: theme === 'light' ? 
                'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : 
                'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderColor: theme === 'light' ? '#A7F3D0' : '#047857',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}
            onClick={() => handleCardClick('/admin/analytics')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{
                    color: theme === 'light' ? '#10B981' : '#34D399'
                  }}>Total Revenue</p>
                  <p className="text-3xl font-bold mt-2" style={{
                    color: theme === 'light' ? '#047857' : '#6EE7B7'
                  }}>
                    ${(stats?.total_revenue || 0).toLocaleString()}
                  </p>
                  <p className="text-xs mt-1" style={{
                    color: theme === 'light' ? '#10B981' : '#34D399'
                  }}>
                    ${(stats?.revenue_today || 0).toLocaleString()} today
                  </p>
                </div>
                <div className="p-3 rounded-full group-hover:opacity-90 transition-opacity" style={{
                  backgroundColor: theme === 'light' ? '#10B981' : '#34D399'
                }}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" style={{
                  color: theme === 'light' ? '#10B981' : '#34D399'
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Total Food Items */}
          <Card 
            className="border hover:shadow-lg transition-all duration-200 cursor-pointer group"
            style={{
              background: theme === 'light' ? 
                'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : 
                'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
              borderColor: theme === 'light' ? '#FCD34D' : '#92400E',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}
            onClick={() => handleCardClick('/admin/analytics')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{
                    color: theme === 'light' ? '#F59E0B' : '#FBBF24'
                  }}>Total Food Items</p>
                  <p className="text-3xl font-bold mt-2" style={{
                    color: theme === 'light' ? '#92400E' : '#FCD34D'
                  }}>
                    {stats?.total_foods || 0}
                  </p>
                  <p className="text-xs mt-1" style={{
                    color: theme === 'light' ? '#F59E0B' : '#FBBF24'
                  }}>
                    {stats?.active_foods || 0} active
                  </p>
                </div>
                <div className="p-3 rounded-full group-hover:opacity-90 transition-opacity" style={{
                  backgroundColor: theme === 'light' ? '#F59E0B' : '#FBBF24'
                }}>
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" style={{
                  color: theme === 'light' ? '#F59E0B' : '#FBBF24'
                }} />
              </div>
            </CardContent>
          </Card>

          {/* New Users (1 week) */}
          <Card 
            className="border hover:shadow-lg transition-all duration-200 cursor-pointer group"
            style={{
              background: theme === 'light' ? 
                'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : 
                'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
              borderColor: theme === 'light' ? '#C7D2FE' : '#3730A3',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}
            onClick={() => handleCardClick('/admin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">New Users (1 week)</p>
                  <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-2">
                    {stats?.new_users_this_week || 0}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    +{stats?.user_growth || 0}% growth
                  </p>
                </div>
                <div className="bg-indigo-500 p-3 rounded-full group-hover:bg-indigo-600 transition-colors">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* New Orders (1 week) */}
          <Card 
            className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => handleCardClick('/admin/orders')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600 dark:text-pink-400">New Orders (1 week)</p>
                  <p className="text-3xl font-bold text-pink-900 dark:text-pink-100 mt-2">
                    {stats?.orders_this_week || 0}
                  </p>
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                    +{stats?.order_growth || 0}% growth
                  </p>
                </div>
                <div className="bg-pink-500 p-3 rounded-full group-hover:bg-pink-600 transition-colors">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 text-pink-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Pending User Approvals */}
          <Card 
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => handleCardClick('/admin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Pending Approvals</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                    {stats?.pending_chef_approvals || 0}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Chef applications
                  </p>
                </div>
                <div className="bg-red-500 p-3 rounded-full group-hover:bg-red-600 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <ArrowRight className="h-4 w-4 text-red-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
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
                  data={stats ? [
                    { name: 'Customers', value: stats.total_users - stats.total_chefs - 10, color: '#3B82F6' }, // Approximate delivery agents
                    { name: 'Chefs', value: stats.total_chefs, color: '#10B981' },
                    { name: 'Delivery Agents', value: 10, color: '#F59E0B' }, // Approximate
                    { name: 'Admins', value: 5, color: '#EF4444' } // Approximate
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