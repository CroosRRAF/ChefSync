import InteractiveChart from "@/components/admin/InteractiveChart";
import SystemAlerts from "@/components/admin/SystemAlerts";
import { UnifiedStatsCard } from "@/components/admin/UnifiedStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
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
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [statsData, ordersData, activitiesData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders(5),
        adminService.getRecentActivities(5),
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setRecentActivities(activitiesData);
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

  // Stats cards data with modern color theme
  const statsCards = [
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      subtitle: `${stats?.active_users || 0} active`,
      icon: <Users />,
      trend: stats?.user_growth
        ? {
            value: stats.user_growth,
            isPositive: stats.user_growth >= 0,
            period: "vs last week",
          }
        : undefined,
      color: "blue" as const,
      onClick: () => handleCardClick("/admin/users"),
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      subtitle: `${stats?.orders_today || 0} today`,
      icon: <ShoppingCart />,
      trend: stats?.order_growth
        ? {
            value: stats.order_growth,
            isPositive: stats.order_growth >= 0,
            period: "vs last week",
          }
        : undefined,
      color: "purple" as const,
      onClick: () => handleCardClick("/admin/orders"),
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
      onClick: () => handleCardClick("/admin/analytics"),
    },
    {
      title: "System Health",
      value: `${stats?.system_health_score || 0}%`,
      subtitle: `${stats?.active_sessions || 0} active sessions`,
      icon: <Activity />,
      color: "green" as const,
      onClick: () => setActiveTab("system"),
    },
    {
      title: "Pending Approvals",
      value:
        (stats?.pending_chef_approvals || 0) +
        (stats?.pending_food_approvals || 0),
      subtitle: "Awaiting review",
      icon: <Clock />,
      color: "yellow" as const,
      onClick: () => handleCardClick("/admin/users"),
    },
    {
      title: "Unread Notifications",
      value: stats?.unread_notifications || 0,
      subtitle: "Require attention",
      icon: <Bell />,
      color: "red" as const,
      onClick: () => handleCardClick("/admin/notifications"),
    },
    {
      title: "Platform Status",
      value: "Operational",
      subtitle: "All systems running",
      icon: <CheckCircle2 />,
      color: "green" as const,
      onClick: () => setActiveTab("activity"),
    },
  ];

  // Quick actions data with modern color theme
  const quickActions = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      iconColor: "text-primary dark:text-primary-light",
      bgColor:
        "bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/20 dark:border-primary/30",
      path: "/admin/users",
      badge: stats?.total_users ? `${stats.total_users} users` : null,
    },
    {
      title: "Order Management",
      description: "Track and manage orders",
      icon: ShoppingCart,
      iconColor: "text-success dark:text-success-light",
      bgColor:
        "bg-gradient-to-br from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 border-success/20 dark:border-success/30",
      path: "/admin/orders",
      badge: stats?.orders_today ? `${stats.orders_today} today` : null,
    },
    {
      title: "Analytics",
      description: "View detailed analytics and insights",
      icon: BarChart3,
      iconColor: "text-accent dark:text-accent-light",
      bgColor:
        "bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 border-accent/20 dark:border-accent/30",
      path: "/admin/analytics",
      badge: "View insights",
    },
    {
      title: "Complaints",
      description: "Manage complaints and feedback",
      icon: MessageSquare,
      iconColor: "text-warning dark:text-warning-light",
      bgColor:
        "bg-gradient-to-br from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 border-warning/20 dark:border-warning/30",
      path: "/admin/complaints",
      badge: stats?.unread_notifications
        ? `${stats.unread_notifications} unread`
        : null,
    },
    {
      title: "Notifications",
      description: "Send and manage notifications",
      icon: Bell,
      iconColor: "text-info dark:text-info-light",
      bgColor:
        "bg-gradient-to-br from-info/10 to-info/5 dark:from-info/20 dark:to-info/10 border-info/20 dark:border-info/30",
      path: "/admin/notifications",
      badge: undefined,
    },
  ];

  // Chart data for analytics
  const weeklyPerformanceData = [
    { name: "Mon", value: 120, users: 120, orders: 45, revenue: 2400 },
    { name: "Tue", value: 132, users: 132, orders: 52, revenue: 2800 },
    { name: "Wed", value: 101, users: 101, orders: 38, revenue: 2100 },
    { name: "Thu", value: 134, users: 134, orders: 48, revenue: 2600 },
    { name: "Fri", value: 190, users: 190, orders: 72, revenue: 3800 },
    { name: "Sat", value: 230, users: 230, orders: 85, revenue: 4200 },
    { name: "Sun", value: 210, users: 210, orders: 78, revenue: 3900 },
  ];

  const revenueData = [
    { name: "Mon", value: 2400 },
    { name: "Tue", value: 2800 },
    { name: "Wed", value: 2100 },
    { name: "Thu", value: 2600 },
    { name: "Fri", value: 3800 },
    { name: "Sat", value: 4200 },
    { name: "Sun", value: 3900 },
  ];

  const userGrowthData = [
    { name: "Mon", value: 120 },
    { name: "Tue", value: 132 },
    { name: "Wed", value: 101 },
    { name: "Thu", value: 134 },
    { name: "Fri", value: 190 },
    { name: "Sat", value: 230 },
    { name: "Sun", value: 210 },
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

          {/* Dashboard Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground dark:from-foreground dark:to-muted-foreground bg-clip-text text-transparent">
                    Quick Actions
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border"
                  >
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
                          <div
                            className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                          >
                            <action.icon
                              className={`h-6 w-6 ${action.iconColor}`}
                            />
                          </div>
                          {action.badge && (
                            <Badge
                              variant="outline"
                              className="text-xs border-border dark:border-border"
                            >
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

              {/* Recent Orders & Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                      <ShoppingCart className="h-5 w-5 text-primary dark:text-primary-light" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentOrders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {order.order_number}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                              {order.customer_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {formatCurrency(order.total_amount)}
                            </p>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCardClick("/admin/orders")}
                      >
                        View All Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                      <Activity className="h-5 w-5 text-accent dark:text-accent-light" />
                      Recent Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivities.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted dark:bg-muted"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary dark:bg-primary-light mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                              {activity.admin_name} • {activity.time_ago}
                            </p>
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
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveChart
                  title="Weekly Performance"
                  data={weeklyPerformanceData}
                  type="line"
                  height={300}
                  colors={["#3B82F6", "#10B981", "#F59E0B"]}
                />
                <InteractiveChart
                  title="Revenue Trends"
                  data={revenueData}
                  type="area"
                  height={300}
                  colors={["#10B981"]}
                />
              </div>
              <InteractiveChart
                title="User Growth"
                data={userGrowthData}
                type="bar"
                height={300}
                colors={["#8B5CF6", "#F97316"]}
              />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/70 dark:bg-card/70 backdrop-blur-sm border-border dark:border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                      <Activity className="h-5 w-5 text-primary dark:text-primary-light" />
                      Recent Admin Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-4 rounded-lg border border-border dark:border-border"
                        >
                          <div className="w-3 h-3 rounded-full bg-primary dark:bg-primary-light mt-1"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
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
                    </div>
                  </CardContent>
                </Card>

                <SystemAlerts />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
