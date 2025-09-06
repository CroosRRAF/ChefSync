import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { PlatformOverview } from '../../components/dashboard/PlatformOverview';
import { RecentOrdersTable } from '../../components/dashboard/RecentOrdersTable';
import { RecentActivityTable } from '../../components/dashboard/RecentActivityTable';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import type { DashboardStats } from '../../services/analyticsService';

// Dashboard component state interface
interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Simple notification handler - will be replaced with context later
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    console[type === 'error' ? 'error' : 'log'](`${type.toUpperCase()}: ${message}`);
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      showNotification('Logged out successfully', 'success');
    } catch (error) {
      showNotification('Error logging out', 'error');
    }
  }, [logout, showNotification]);

  // Navigation cards data
  const navigationCards = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: 'bx-user-group',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      path: '/admin/users',
      stats: 'Manage all users'
    },
    {
      title: 'Orders',
      description: 'View and manage all orders',
      icon: 'bx-shopping-bag',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      path: '/admin/orders',
      stats: 'Track orders'
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: 'bx-bar-chart-alt-2',
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
      path: '/admin/analytics',
      stats: 'View insights'
    },
    {
      title: 'Settings',
      description: 'Configure platform settings',
      icon: 'bx-cog',
      iconColor: 'text-gray-600',
      iconBgColor: 'bg-gray-100',
      path: '/admin/settings',
      stats: 'System config'
    },
    {
      title: 'Profile',
      description: 'Manage your admin profile',
      icon: 'bx-user',
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-100',
      path: '/admin/profile',
      stats: 'Your profile'
    },
    {
      title: 'Reports',
      description: 'Generate and view reports',
      icon: 'bx-file-blank',
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
      path: '/admin/reports',
      stats: 'View reports'
    }
  ];

  // Navigation handler
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);
  

  // State for dashboard data
  const [state, setState] = useState<DashboardState>({
    stats: null,
    loading: false,
    error: null,
  });

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const stats = await analyticsService.getDashboardStats();
      setState(prev => ({ ...prev, stats, loading: false }));
      showNotification('Dashboard data refreshed successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh dashboard data';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      showNotification(errorMessage, 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    // Load initial data
    refreshData();
  }, [refreshData]);

  const statsCards = state.stats ? [
    {
      title: 'Total Users',
      value: state.stats.total_users,
      icon: 'bx bx-group',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      trend: {
        value: state.stats.user_growth,
        isPositive: state.stats.user_growth >= 0
      },
      subtitle: 'Active users'
    },
    {
      title: 'Active Chefs',
      value: state.stats.active_chefs,
      icon: 'bx bx-restaurant',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      trend: {
        value: state.stats.chef_growth,
        isPositive: state.stats.chef_growth >= 0
      },
      subtitle: 'Verified chefs'
    },
    {
      title: 'Pending Approvals',
      value: state.stats.pending_approvals,
      icon: 'bx bx-bell',
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-yellow-100',
      trend: {
        value: 0,
        isPositive: false
      },
      subtitle: 'Awaiting review'
    },
    {
      title: 'Total Orders',
      value: state.stats.total_orders,
      icon: 'bx bx-package',
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
      trend: {
        value: state.stats.order_growth,
        isPositive: state.stats.order_growth >= 0
      },
      subtitle: 'This month'
    },
    {
      title: 'Total Revenue',
      value: Math.round(state.stats.total_revenue),
      icon: 'bx bx-dollar-circle',
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      trend: {
        value: state.stats.revenue_growth,
        isPositive: state.stats.revenue_growth >= 0
      },
      subtitle: 'Total earnings'
    },
    {
      title: 'Avg Order Value',
      value: Math.round((state.stats.total_revenue / Math.max(state.stats.total_orders, 1)) * 100),
      icon: 'bx bx-star',
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-100',
      trend: {
        value: 0,
        isPositive: true
      },
      subtitle: 'Per order'
    }
  ] : [];


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back{user?.name ? `, ${user.name}` : ''}! Here's what's happening with your platform today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={state.loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className={`bx bx-refresh w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`}></i>
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <i className="bx bx-log-out w-4 h-4 mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {state.loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            ))
          ) : state.error ? (
            // Error state
            <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center">
                <i className="bx bx-error-circle text-red-500 text-xl mr-3"></i>
                <div>
                  <h3 className="text-red-800 dark:text-red-200 font-medium">Failed to load dashboard data</h3>
                  <p className="text-red-600 dark:text-red-300 text-sm mt-1">{state.error}</p>
                </div>
              </div>
            </div>
          ) : (
            // Stats cards
            statsCards.map((card, index) => (
              <StatsCard key={index} {...card} />
            ))
          )}
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Admin Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigationCards.map((card, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(card.path)}
                className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.iconBgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <i className={`${card.icon} text-xl ${card.iconColor}`}></i>
                  </div>
                  <i className="bx bx-right-arrow-alt text-gray-400 group-hover:text-blue-500 transition-colors duration-200"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {card.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {card.stats}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h2>
              </div>
              <div className="p-6">
                <RecentOrdersTable />
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Platform Overview
                </h2>
              </div>
              <div className="p-6">
                <PlatformOverview />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <RecentActivityTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;