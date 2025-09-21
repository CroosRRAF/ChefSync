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
  CheckCircle2,
  Bell
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
    // Removed cards that link to non-existent pages (approvals, chefs, delivery agents)
  ];

  // Quick actions data with modern color theme
  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      iconColor: 'text-primary dark:text-primary-light',
      bgColor: 'bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/20 dark:border-primary/30',
      path: '/admin/users',
      badge: stats?.total_users ? `${stats.total_users} users` : null
    },
    {
      title: 'Food Management',
      description: 'Manage food items and categories',
      icon: Package,
      iconColor: 'text-success dark:text-success-light',
      bgColor: 'bg-gradient-to-br from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 border-success/20 dark:border-success/30',
      path: '/admin/foods',
      badge: stats?.total_foods ? `${stats.total_foods} items` : null
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and insights',
      icon: BarChart3,
      iconColor: 'text-accent dark:text-accent-light',
      bgColor: 'bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 border-accent/20 dark:border-accent/30',
      path: '/admin/analytics',
      badge: 'View insights'
    },
    {
      title: 'Complaints',
      description: 'Manage complaints and feedback',
      icon: MessageSquare,
      iconColor: 'text-warning dark:text-warning-light',
      bgColor: 'bg-gradient-to-br from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 border-warning/20 dark:border-warning/30',
      path: '/admin/complaints',
      badge: stats?.unread_notifications ? `${stats.unread_notifications} unread` : null
    },
    {
      title: 'Notifications',
      description: 'Send and manage notifications',
      icon: Bell,
      iconColor: 'text-info dark:text-info-light',
      bgColor: 'bg-gradient-to-br from-info/10 to-info/5 dark:from-info/20 dark:to-info/10 border-info/20 dark:border-info/30',
      path: '/admin/notifications',
      badge: undefined
    }
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-8 rounded-lg w-64 mb-2 bg-gradient-to-r from-muted to-muted-foreground/20 dark:from-muted dark:to-muted-foreground/10 animate-pulse"></div>
              <div className="h-4 rounded-lg w-96 bg-gradient-to-r from-muted to-muted-foreground/20 dark:from-muted dark:to-muted-foreground/10 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gradient-to-br from-card to-muted dark:from-card dark:to-muted border border-border animate-pulse shadow-lg"></div>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gradient-to-br from-card to-muted dark:from-card dark:to-muted border border-border animate-pulse shadow-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground dark:from-foreground dark:to-muted-foreground bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="mt-2 text-warning dark:text-warning-light">
                  ⚠️ Backend API not available. Showing demo data for development.
                </p>
              </div>
              <Button onClick={handleRefresh} variant="outline" className="border-border dark:border-border hover:bg-muted dark:hover:bg-muted">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground dark:from-foreground dark:to-muted-foreground bg-clip-text text-transparent">
                Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
              </h1>
              <p className="mt-2 text-muted-foreground dark:text-muted-foreground">
                Here's what's happening with your platform today. Stay on top of your business metrics and manage operations efficiently.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs border-border dark:border-border">
                {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Live'}
              </Badge>
              {error && (
                <Badge variant="secondary" className="text-xs bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning border-warning/20 dark:border-warning/30">
                  Demo Data
                </Badge>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
                size="sm"
                className="flex items-center gap-2 border-border dark:border-border hover:bg-muted dark:hover:bg-muted"
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
              <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground dark:from-foreground dark:to-muted-foreground bg-clip-text text-transparent">Quick Actions</h2>
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border">
                {quickActions.length} Actions Available
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className={`${action.bgColor} border hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/5 transition-all duration-300 cursor-pointer group hover:-translate-y-1`}
                  onClick={() => handleCardClick(action.path)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                      </div>
                      {action.badge && (
                        <Badge variant="outline" className="text-xs border-border dark:border-border">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-200">
                      {action.title}
                    </h3>
                    <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground dark:text-muted-foreground font-medium">
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
            <Card className="lg:col-span-2 bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                  <TrendingUp className="h-5 w-5 text-success dark:text-success-light" />
                  Platform Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 border border-success/20 dark:border-success/30">
                    <div className="text-2xl font-bold text-success dark:text-success-light">
                      {formatCurrency(stats?.total_revenue || 0)}
                    </div>
                    <div className="text-sm text-success dark:text-success-light">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 dark:border-primary/30">
                    <div className="text-2xl font-bold text-primary dark:text-primary-light">
                      {stats?.system_health_score || 0}%
                    </div>
                    <div className="text-sm text-primary dark:text-primary-light">System Health</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 border border-accent/20 dark:border-accent/30">
                    <div className="text-2xl font-bold text-accent dark:text-accent-light">
                      {stats?.active_sessions || 0}
                    </div>
                    <div className="text-sm text-accent dark:text-accent-light">Active Sessions</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 border border-warning/20 dark:border-warning/30">
                    <div className="text-2xl font-bold text-warning dark:text-warning-light">
                      {stats?.pending_backups || 0}
                    </div>
                    <div className="text-sm text-warning dark:text-warning-light">Pending Backups</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                  <AlertCircle className="h-5 w-5 text-error dark:text-error-light" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">Revenue Today</span>
                  <span className="font-semibold text-success dark:text-success-light">
                    {formatCurrency(stats?.revenue_today || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">Orders Today</span>
                  <span className="font-semibold text-accent dark:text-accent-light">
                    {stats?.orders_today || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">New Users Today</span>
                  <span className="font-semibold text-primary dark:text-primary-light">
                    {stats?.new_users_today || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">Unread Notifications</span>
                  <span className="font-semibold text-error dark:text-error-light">
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