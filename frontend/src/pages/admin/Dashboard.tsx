import InteractiveChart from "@/components/admin/InteractiveChart";
import { UnifiedStatsCard } from "@/components/admin/UnifiedStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  adminService,
  type AdminActivityLog,
  type AdminOrder,
  type DashboardStats,
} from "@/services/adminService";
import { formatCurrency } from "@/utils/numberUtils";
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>(
    []
  );
  const [weeklyPerformance, setWeeklyPerformance] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any>(null);
  const [growthAnalytics, setGrowthAnalytics] = useState<any>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [
        statsData,
        ordersData,
        activitiesData,
        weeklyPerformanceData,
        revenueTrendData,
        growthAnalyticsData,
      ] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders(5),
        adminService.getRecentActivities(5),
        adminService.getWeeklyPerformance(30),
        adminService.getRevenueTrend(30),
        adminService.getGrowthAnalytics(30),
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setRecentActivities(activitiesData);
      setWeeklyPerformance(weeklyPerformanceData);
      setRevenueTrend(revenueTrendData);
      setGrowthAnalytics(growthAnalyticsData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Dashboard API Error:", err);
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
        pending_backups: 2,
      };

      setStats(mockStats);
      setLastRefresh(new Date());
      setError("Using demo data - Backend API not available");
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

  // Stats cards data for new design
  const kpiCards = [
    {
      title: "Orders Today",
      value: stats?.orders_today || 0,
      subtitle: `${stats?.orders_this_week || 0} this week`,
      icon: <ShoppingCart />,
      trend: stats?.order_growth
        ? {
            value: stats.order_growth,
            isPositive: stats.order_growth >= 0,
            period: "vs last week",
          }
        : undefined,
      color: "blue" as const,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.total_revenue || 0),
      subtitle: `${formatCurrency(stats?.revenue_today || 0)} today`,
      icon: <DollarSign />,
      trend: stats?.revenue_growth
        ? {
            value: stats.revenue_growth,
            isPositive: stats.revenue_growth >= 0,
            period: "vs last week",
          }
        : undefined,
      color: "green" as const,
    },
    {
      title: "Active Chefs",
      value: stats?.active_chefs || 0,
      subtitle: `${stats?.total_chefs || 0} total`,
      icon: <Users />,
      trend: stats?.chef_growth
        ? {
            value: stats.chef_growth,
            isPositive: stats.chef_growth >= 0,
            period: "vs last week",
          }
        : undefined,
      color: "purple" as const,
    },
    {
      title: "Pending Approvals",
      value:
        (stats?.pending_chef_approvals || 0) +
        (stats?.pending_food_approvals || 0),
      subtitle: "Awaiting review",
      icon: <Clock />,
      color: "yellow" as const,
    },
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
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-gradient-to-br from-card to-muted dark:from-card dark:to-muted border border-border animate-pulse shadow-lg"
                ></div>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-gradient-to-br from-card to-muted dark:from-card dark:to-muted border border-border animate-pulse shadow-lg"
                ></div>
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
                  ⚠️ Backend API not available. Showing demo data for
                  development.
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-border dark:border-border hover:bg-muted dark:hover:bg-muted"
              >
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
                Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
              </h1>
              <p className="mt-2 text-muted-foreground dark:text-muted-foreground">
                Here's what's happening with your platform today. Stay on top of
                your business metrics and manage operations efficiently.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge
                variant="outline"
                className="text-xs border-border dark:border-border"
              >
                {lastRefresh
                  ? `Updated ${lastRefresh.toLocaleTimeString()}`
                  : "Live"}
              </Badge>
              {error && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning border-warning/20 dark:border-warning/30"
                >
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
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {kpiCards.map((card, index) => (
              <UnifiedStatsCard
                key={index}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                trend={card.trend}
                color={card.color}
                variant="advanced"
                isLoading={refreshing}
              />
            ))}
          </div>

          {/* Quick Trends */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground dark:from-foreground dark:to-muted-foreground bg-clip-text text-transparent">
              Quick Trends
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                    <BarChart3 className="h-5 w-5 text-primary dark:text-primary-light" />
                    Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueTrend ? (
                    <InteractiveChart
                      title=""
                      data={revenueTrend.data}
                      type="bar"
                      height={200}
                      showLegend={false}
                    />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      Loading revenue data...
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                    <Users className="h-5 w-5 text-accent dark:text-accent-light" />
                    Growth Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {growthAnalytics ? (
                    <InteractiveChart
                      title=""
                      data={growthAnalytics.data}
                      type="area"
                      height={200}
                      showLegend={true}
                    />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      Loading growth data...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Summary Widget */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border-primary/20 dark:border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                <Activity className="h-5 w-5 text-primary dark:text-primary-light" />
                Here's what's happening today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {stats ? (
                    <>
                      Today, you have{" "}
                      <strong>{stats.orders_today} orders</strong> placed,
                      generating{" "}
                      <strong>{formatCurrency(stats.revenue_today)}</strong> in
                      revenue.{" "}
                      {stats.pending_chef_approvals > 0 && (
                        <>
                          There are{" "}
                          <strong>
                            {stats.pending_chef_approvals} chef approvals
                          </strong>{" "}
                          pending review.{" "}
                        </>
                      )}
                      System health is at{" "}
                      <strong>{stats.system_health_score}%</strong> with{" "}
                      <strong>{stats.active_sessions} active sessions</strong>.
                    </>
                  ) : (
                    "Loading today's summary..."
                  )}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span>
                    Updated{" "}
                    {lastRefresh
                      ? lastRefresh.toLocaleTimeString()
                      : "just now"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                <Activity className="h-5 w-5 text-accent dark:text-accent-light" />
                Recent Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full bg-primary dark:bg-primary-light mt-1"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground dark:text-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {activity.admin_name}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          •
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {activity.time_ago}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={`order-${order.id}`}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full bg-success dark:bg-success-light mt-1"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground dark:text-foreground">
                        New order #{order.order_number} from{" "}
                        {order.customer_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {formatCurrency(order.total_amount)}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          •
                        </span>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCardClick("/admin/analytics")}
                >
                  View All Activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
