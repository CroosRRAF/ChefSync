import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShoppingCart,
  ChefHat,
  Truck,
  RefreshCw,
  UserCheck,
  FileText,
  BarChart3,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Package,
  UserPlus,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminService, type DashboardStats } from '@/services/adminService';
import { UnifiedStatsCard } from '@/components/admin/UnifiedStatsCard';
import { formatCurrency } from '@/utils/numberUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const statsData = await adminService.getDashboardStats();
      setStats(statsData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard API Error:', err);
      // For development/demo purposes, set mock data if API fails
      const mockStats: DashboardStats = {
        total_users: 1250,
        active_users: 892,
        new_users_today: 12,
        new_users_this_week: 67,
        new_users_this_month: 234,
        user_growth: 8.5,
        
        total_chefs: 45,
        active_chefs: 38,
        pending_chef_approvals: 7,
        chef_growth: 12.3,
        
        total_orders: 3456,
        orders_today: 23,
        orders_this_week: 156,
        orders_this_month: 678,
        order_growth: 15.2,
        
        total_revenue: 125000,
        revenue_today: 2500,
        revenue_this_week: 15000,
        revenue_this_month: 45000,
        revenue_growth: 22.1,
        
        total_foods: 234,
        active_foods: 198,
        pending_food_approvals: 3,
        
        system_health_score: 87,
        active_sessions: 45,
        unread_notifications: 8,
        pending_backups: 2
      };
      
      setStats(mockStats);
      setLastRefresh(new Date());
      setError('Using demo data - Backend API not available');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Navigation handlers
  const handleCardClick = (route: string) => {
    navigate(route);
  };

  // Stats cards data with modern color theme
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
      title: 'Total Food Items',
      value: stats?.total_foods || 0,
      subtitle: `${stats?.active_foods || 0} active`,
      icon: <Package />,
      color: 'green' as const,
      onClick: () => handleCardClick('/admin/foods')
    },
    {
      title: 'New Users',
      value: stats?.new_users_this_week || 0,
      subtitle: `${stats?.new_users_today || 0} today`,
      icon: <UserPlus />,
      color: 'indigo' as const,
      onClick: () => handleCardClick('/admin/users')
    },
    {
      title: 'New Orders',
      value: stats?.orders_this_week || 0,
      subtitle: `${stats?.orders_today || 0} today`,
      icon: <ShoppingBag />,
      color: 'purple' as const,
      onClick: () => handleCardClick('/admin/orders')
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_chef_approvals || 0,
      subtitle: 'Chef applications',
      icon: <AlertCircle />,
      color: 'yellow' as const,
      onClick: () => handleCardClick('/admin/approvals')
    },
    {
      title: 'Total Chefs',
      value: stats?.total_chefs || 0,
      subtitle: `${stats?.active_chefs || 0} active`,
      icon: <ChefHat />,
      color: 'red' as const,
      onClick: () => handleCardClick('/admin/chefs')
    },
    {
      title: 'Delivery Agents',
      value: 0, // Will be updated when backend supports this
      subtitle: 'Active agents',
      icon: <Truck />,
      color: 'green' as const,
      onClick: () => handleCardClick('/admin/delivery-agents')
    }
  ];

  // Quick actions data with modern color theme
  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      iconColor: 'text-slate-700 dark:text-slate-300',
      bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600',
      path: '/admin/users',
      badge: stats?.total_users ? `${stats.total_users} users` : null
    },
    {
      title: 'Food Management',
      description: 'Manage food items and categories',
      icon: Package,
      iconColor: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700',
      path: '/admin/foods',
      badge: stats?.total_foods ? `${stats.total_foods} items` : null
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and insights',
      icon: BarChart3,
      iconColor: 'text-violet-700 dark:text-violet-300',
      bgColor: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 border-violet-200 dark:border-violet-700',
      path: '/admin/analytics',
      badge: 'View insights'
    },
    {
      title: 'Reports',
      description: 'Generate and download reports',
      icon: FileText,
      iconColor: 'text-indigo-700 dark:text-indigo-300',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border-indigo-200 dark:border-indigo-700',
      path: '/admin/reports',
      badge: 'Generate reports'
    },
    {
      title: 'User Approvals',
      description: 'Review and approve user applications',
      icon: UserCheck,
      iconColor: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700',
      path: '/admin/approvals',
      badge: stats?.pending_chef_approvals ? `${stats.pending_chef_approvals} pending` : null
    },
    {
      title: 'Complaints & Feedback',
      description: 'Manage user complaints and feedback',
      icon: MessageSquare,
      iconColor: 'text-rose-700 dark:text-rose-300',
      bgColor: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border-rose-200 dark:border-rose-700',
      path: '/admin/communications',
      badge: stats?.unread_notifications ? `${stats.unread_notifications} unread` : null
    }
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-8 rounded-lg w-64 mb-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse"></div>
              <div className="h-4 rounded-lg w-96 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 animate-pulse shadow-lg"></div>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 animate-pulse shadow-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="mt-2 text-amber-600 dark:text-amber-400">
                  ⚠️ Backend API not available. Showing demo data for development.
                </p>
              </div>
              <Button onClick={handleRefresh} variant="outline" className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Here's what's happening with your platform today. Stay on top of your business metrics and manage operations efficiently.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Live'}
              </Badge>
              {error && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700">
                  Demo Data
                </Badge>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
                size="sm"
                className="flex items-center gap-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
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
                isLoading={refreshing}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">Quick Actions</h2>
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600">
                {quickActions.length} Actions Available
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className={`${action.bgColor} border hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1`}
                  onClick={() => handleCardClick(action.path)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                      </div>
                      {action.badge && (
                        <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-200">
                      {action.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-500 font-medium">
                      <span>Click to manage</span>
                      <CheckCircle2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* System Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card className="lg:col-span-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Platform Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700">
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(stats?.total_revenue || 0)}
                    </div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {stats?.system_health_score || 0}%
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">System Health</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 border border-violet-200 dark:border-violet-700">
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {stats?.active_sessions || 0}
                    </div>
                    <div className="text-sm text-violet-600 dark:text-violet-400">Active Sessions</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border border-amber-200 dark:border-amber-700">
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {stats?.pending_backups || 0}
                    </div>
                    <div className="text-sm text-amber-600 dark:text-amber-400">Pending Backups</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Revenue Today</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(stats?.revenue_today || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Orders Today</span>
                  <span className="font-semibold text-violet-700 dark:text-violet-300">
                    {stats?.orders_today || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-400">New Users Today</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {stats?.new_users_today || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Unread Notifications</span>
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    {stats?.unread_notifications || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;