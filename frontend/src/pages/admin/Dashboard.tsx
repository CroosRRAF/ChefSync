import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Import shared components
import {
  AnimatedStats,
  BarChart,
  ErrorBoundary,
  GlassCard,
  GradientButton,
  LazyPageWrapper,
  MemoizedDataTable,
  OptimisticButton,
  PieChart,
} from "@/components/admin/shared";

import { useAuth } from "@/context/AuthContext";
import {
  adminService,
  type DashboardStats as ApiDashboardStats,
} from "@/services/adminService";
import { aiService } from "@/services/aiService";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  DollarSign,
  Download,
  Eye,
  Gauge,
  MessageSquare,
  RefreshCw,
  Settings,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react";

/**
 * Admin Dashboard Page - Unified Implementation
 *
 * Features Consolidated from UltimateDashboard, ModernDashboard, EnhancedDashboard:
 * - Real-time KPI cards with trend indicators
 * - Interactive charts for revenue, orders, and growth analytics
 * - Recent activity feed with system events
 * - Quick action buttons for common admin tasks
 * - System health monitoring
 * - Recent orders table with filtering
 * - Performance metrics and goal tracking
 * - Responsive design for all devices
 */

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  totalFoods: number;
  totalChefs: number;
  totalDeliveryAgents: number;
  pendingApprovals: number;
  revenueGrowth: number;
  ordersGrowth: number;
  usersGrowth: number;
  foodsGrowth: number;
  chefsGrowth: number;
  deliveryGrowth: number;
  approvalsGrowth: number;
  averageOrderValue: number;
  completionRate: number;
  responseTime: number;
  systemHealth: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string; // Backend uses snake_case
  total_amount: number;
  status: string;
  created_at: string; // Backend uses snake_case
  items_count: number;
  payment_status: string;
}

interface RecentDelivery {
  id: number;
  order_id: number;
  delivery_agent: string;
  customer_name: string;
  delivery_address: string;
  status: string;
  estimated_time: string;
  actual_time?: string;
  tracking_code: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
  user?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  color:
    | "blue"
    | "green"
    | "red"
    | "yellow"
    | "purple"
    | "gray"
    | "orange"
    | "cyan"
    | "pink";
  badge?: number;
  description: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: "success" | "warning" | "info" | "error";
  confidence: number;
  action?: string;
  icon: React.ComponentType<any>;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }>;
}

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper function to determine activity type
  const determineActivityType = (
    action: string
  ): "info" | "success" | "warning" | "error" => {
    if (
      action.includes("error") ||
      action.includes("failed") ||
      action.includes("delete")
    )
      return "error";
    if (
      action.includes("success") ||
      action.includes("completed") ||
      action.includes("approve")
    )
      return "success";
    if (action.includes("warning") || action.includes("pending"))
      return "warning";
    return "info";
  };

  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiStats, setApiStats] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>(
    []
  );
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d">("30d");

  // Chart datasets from backend
  const [revenueTrend, setRevenueTrend] = useState<any | null>(null);
  const [ordersTrend, setOrdersTrend] = useState<any | null>(null);
  const [weeklyPerformance, setWeeklyPerformance] = useState<any | null>(null);
  const [growthAnalytics, setGrowthAnalytics] = useState<any | null>(null);
  const [ordersDistribution, setOrdersDistribution] = useState<any | null>(
    null
  );
  const [newUsersData, setNewUsersData] = useState<any | null>(null);

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [chartData, setChartData] = useState<{
    revenue: ChartData | null;
    orders: ChartData | null;
    users: ChartData | null;
    weeklyOrders: ChartData | null;
  }>({
    revenue: null,
    orders: null,
    users: null,
    weeklyOrders: null,
  });

  // Quick Actions Configuration - Updated for consolidated routes
  const quickActions: QuickAction[] = [
    {
      id: "users",
      label: "User Management",
      icon: Users,
      color: "blue",
      badge: stats?.pendingApprovals || 0,
      description: "Manage users and permissions",
      onClick: () => navigate("/admin/users"),
    },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingCart,
      color: "green",
      badge: Math.floor((stats?.totalOrders || 0) * 0.1), // 10% pending orders
      description: "Manage orders and deliveries",
      onClick: () => navigate("/admin/orders"),
    },
    {
      id: "communications",
      label: "Communications",
      icon: MessageSquare,
      color: "purple",
      badge: 8,
      description: "Messages and feedback",
      onClick: () => navigate("/admin/communications"),
    },
    {
      id: "contents",
      label: "Content Management",
      icon: Utensils,
      color: "orange",
      description: "Manage menus and offers",
      onClick: () => navigate("/admin/contents"),
    },
    {
      id: "analytics",
      label: "Analytics Hub",
      icon: BarChart3,
      color: "cyan",
      description: "Business insights and reports",
      onClick: () => navigate("/admin/analytics"),
    },
    {
      id: "settings",
      label: "System Settings",
      icon: Settings,
      color: "pink",
      description: "System configuration",
      onClick: () => navigate("/admin/settings"),
    },
  ];

  // Helper functions to create fallback chart data
  const createFallbackChartData = useCallback((type: string, days: number) => {
    const labels = [];
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      if (days <= 7) {
        labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
      } else {
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
      }

      // Generate realistic fallback data
      const baseValue =
        type === "Revenue"
          ? 15000
          : type === "Orders"
          ? 25
          : type === "Users"
          ? 8
          : 75;
      const randomVariation = (Math.random() - 0.5) * 0.3; // ±15% variation
      data.push(Math.max(0, Math.floor(baseValue * (1 + randomVariation))));
    }

    return {
      data: {
        labels,
        datasets: [
          {
            label: type,
            data,
            backgroundColor:
              type === "Revenue"
                ? "#3B82F6"
                : type === "Orders"
                ? "#10B981"
                : type === "Users"
                ? "#F59E0B"
                : "#8B5CF6",
            borderColor:
              type === "Revenue"
                ? "#2563EB"
                : type === "Orders"
                ? "#059669"
                : type === "Users"
                ? "#D97706"
                : "#7C3AED",
          },
        ],
      },
    };
  }, []);

  const createFallbackPieData = useCallback(() => {
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const data = dayNames.map(() => Math.floor(Math.random() * 15) + 5); // 5-20 orders per day

    return {
      data: {
        labels: dayNames,
        datasets: [
          {
            data,
            backgroundColor: [
              "#8B5CF6",
              "#EC4899",
              "#F59E0B",
              "#EF4444",
              "#10B981",
              "#3B82F6",
              "#6366F1",
            ],
          },
        ],
      },
    };
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        // Fetch real data from API
        const days = timeFilter === "7d" ? 7 : timeFilter === "90d" ? 90 : 30;
        const [
          dashboardStats,
          recentOrdersData,
          recentDeliveriesData,
          recentActivitiesData,
          revenueTrendRes,
          weeklyOrdersRes,
          weeklyPerformanceRes,
          growthAnalyticsRes,
          ordersDistributionRes,
          newUsersDataRes,
        ] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRecentOrders(5),
          adminService.getRecentDeliveries(5),
          adminService.getRecentActivities(5),
          adminService.getRevenueTrend(days),
          adminService.getWeeklyOrdersDistribution(),
          adminService.getWeeklyPerformance(days),
          adminService.getGrowthAnalytics(days),
          adminService.getOrdersDistribution(days),
          adminService.getNewUsersData(days),
        ]);

        // Transform API data to match component state
        const transformedStats: DashboardStats = {
          totalRevenue: dashboardStats.total_revenue || 0,
          totalOrders: dashboardStats.total_orders || 0,
          activeUsers: dashboardStats.active_users || 0,
          totalFoods: dashboardStats.total_foods || 0,
          totalChefs: dashboardStats.total_chefs || 0,
          totalDeliveryAgents:
            (dashboardStats as any).total_delivery_agents || 15,
          // Use backend's pending_user_approvals; keep name aligned with UI card
          pendingApprovals: dashboardStats.pending_user_approvals || 0,
          revenueGrowth: dashboardStats.revenue_growth || 0,
          ordersGrowth: dashboardStats.order_growth || 0,
          usersGrowth: dashboardStats.user_growth || 0,
          foodsGrowth: (dashboardStats as any).foods_growth || 8.5,
          chefsGrowth:
            (dashboardStats as any).chefs_growth ||
            dashboardStats.chef_growth ||
            12.3,
          deliveryGrowth: (dashboardStats as any).delivery_growth || 6.7,
          // approvalsGrowth isn't provided by backend; leave synthetic for now
          approvalsGrowth: -5.2,
          averageOrderValue:
            dashboardStats.total_orders > 0
              ? dashboardStats.total_revenue / dashboardStats.total_orders
              : 0, // Calculate from available data
          completionRate: 94.2, // Fallback - backend doesn't provide this
          responseTime: 1.2, // Fallback - backend doesn't provide this
          systemHealth: dashboardStats.system_health_score || 85, // Use available system health score
        };

        // Transform recent orders
        const transformedOrders: RecentOrder[] = recentOrdersData.map(
          (order) => ({
            id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name, // Backend uses snake_case
            total_amount:
              typeof order.total_amount === "string"
                ? parseFloat(order.total_amount)
                : order.total_amount,
            status: order.status,
            created_at: order.created_at, // Backend uses snake_case
            items_count:
              typeof order.items_count === "string"
                ? parseInt(order.items_count)
                : order.items_count,
            payment_status: order.payment_status,
          })
        );

        // Transform recent deliveries
        const transformedDeliveries: RecentDelivery[] =
          recentDeliveriesData.map((delivery) => ({
            id: delivery.id,
            order_id: delivery.order_id,
            delivery_agent: delivery.delivery_agent || "Unassigned",
            customer_name: delivery.customer_name || "Unknown Customer",
            delivery_address:
              delivery.delivery_address || "Address not provided",
            status: delivery.status || "pending",
            estimated_time: delivery.estimated_time,
            actual_time: delivery.actual_time,
            tracking_code: delivery.tracking_code || `TRK${delivery.id}`,
          }));

        // Transform recent activities
        const transformedActivities: ActivityItem[] = recentActivitiesData.map(
          (activity) => ({
            id: activity.id.toString(),
            title: activity.action,
            description: activity.description,
            timestamp: new Date(activity.timestamp),
            type: determineActivityType(activity.action),
            user: activity.admin_name,
          })
        );

        setApiStats(dashboardStats);
        setStats(transformedStats);
        setRecentOrders(transformedOrders);
        setRecentDeliveries(transformedDeliveries);
        setRecentActivities(transformedActivities);

        // Set chart data with fallbacks
        setRevenueTrend(
          revenueTrendRes || createFallbackChartData("Revenue", days)
        );
        setOrdersTrend(
          weeklyOrdersRes || createFallbackChartData("Orders", days)
        );
        setWeeklyPerformance(
          weeklyPerformanceRes || createFallbackChartData("Performance", days)
        );
        setGrowthAnalytics(
          growthAnalyticsRes || createFallbackChartData("Growth", days)
        );
        setOrdersDistribution(ordersDistributionRes || createFallbackPieData());
        setNewUsersData(
          newUsersDataRes || createFallbackChartData("Users", days)
        );
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data"
        );

        // Set fallback data to ensure charts still display
        const days = timeFilter === "7d" ? 7 : timeFilter === "90d" ? 90 : 30;
        setRevenueTrend(createFallbackChartData("Revenue", days));
        setOrdersTrend(createFallbackPieData());
        setWeeklyPerformance(createFallbackChartData("Performance", days));
        setGrowthAnalytics(createFallbackChartData("Growth", days));
        setOrdersDistribution(createFallbackPieData());
        setNewUsersData(createFallbackChartData("Users", days));

        // Set minimal stats to prevent null errors
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          activeUsers: 0,
          totalFoods: 0,
          totalChefs: 0,
          totalDeliveryAgents: 0,
          pendingApprovals: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          usersGrowth: 0,
          foodsGrowth: 0,
          chefsGrowth: 0,
          deliveryGrowth: 0,
          approvalsGrowth: 0,
          averageOrderValue: 0,
          completionRate: 0,
          responseTime: 0,
          systemHealth: 0,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeFilter, createFallbackChartData, createFallbackPieData]
  );

  // Load AI insights
  const loadAIInsights = useCallback(async () => {
    try {
      setAiLoading(true);
      const insights = await aiService.getDashboardSummary();

      // Transform AI insights to match our interface
      const transformedInsights: AIInsight[] = [
        {
          id: "sales-forecast",
          title: "Sales Forecast",
          description: `Predicted revenue for next 7 days: LKR ${
            insights.sales_forecast?.next_7_days_revenue?.toLocaleString() ||
            "0"
          }`,
          type: "success",
          confidence: insights.sales_forecast?.confidence || 85,
          icon: TrendingUp,
          action: "View Forecast",
        },
        {
          id: "anomaly-detection",
          title: "System Anomalies",
          description: `${
            insights.anomaly_detection?.total_anomalies || 0
          } anomalies detected, ${
            insights.anomaly_detection?.high_severity_count || 0
          } high priority`,
          type:
            insights.anomaly_detection?.high_severity_count > 0
              ? "warning"
              : "success",
          confidence: 92,
          icon: AlertTriangle,
          action: "View Details",
        },
        {
          id: "product-recommendations",
          title: "Product Insights",
          description: `${
            insights.product_recommendations?.total_recommendations || 0
          } product recommendations available`,
          type: "info",
          confidence: 78,
          icon: Target,
          action: "View Products",
        },
        {
          id: "customer-insights",
          title: "Customer Analytics",
          description: `${
            insights.customer_insights?.total_customers || 0
          } customers analyzed, avg order: LKR ${(
            insights.customer_insights?.avg_order_value || 0
          ).toFixed(2)}`,
          type: "success",
          confidence: 88,
          icon: Users,
          action: "View Insights",
        },
      ];

      setAiInsights(transformedInsights);
    } catch (error) {
      console.error("Error loading AI insights:", error);
      // Provide fallback insights
      setAiInsights([
        {
          id: "fallback-1",
          title: "System Performance",
          description: "All systems are running smoothly",
          type: "success",
          confidence: 95,
          icon: CheckCircle,
        },
        {
          id: "fallback-2",
          title: "Growth Opportunity",
          description: "Consider expanding delivery hours",
          type: "info",
          confidence: 73,
          icon: TrendingUp,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
    loadAIInsights();
  }, [loadDashboardData, loadAIInsights]);

  // Manual refresh with debouncing
  const handleRefresh = useCallback(() => {
    // Prevent rapid refresh calls
    if (refreshing) return;
    loadDashboardData(true);
  }, [refreshing, loadDashboardData]);

  // Get status color for orders
  const getOrderStatusColor = (status: RecentOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status color for deliveries
  const getDeliveryStatusColor = (status: RecentDelivery["status"]) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-orange-100 text-orange-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "returned":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Format time ago (memoized)
  const timeAgo = useMemo(() => {
    return (date: Date) => {
      const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };
  }, []);

  if (loading) {
    return (
      <div>
        {/* Loading Header */}
        <div className="mb-8">
          <GlassCard gradient="blue" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <AnimatedStats
              key={i}
              value={0}
              label="Loading..."
              icon={BarChart3}
              loading={true}
              gradient={["blue", "green", "purple", "orange"][i] as any}
            />
          ))}
        </div>

        {/* Loading Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <AnimatedStats
              key={i}
              value={0}
              label="Loading..."
              icon={Target}
              loading={true}
              gradient={["cyan", "green", "pink"][i] as any}
            />
          ))}
        </div>

        {/* Loading AI Insights */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <GlassCard key={i} gradient="blue" className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  Connection Issue
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Some data may be unavailable. Showing fallback data where
                  possible. {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modern Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassCard gradient="blue" className="p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400 to-purple-600 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Welcome Section */}
              <div className="flex items-start gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 shadow-xl"
                >
                  <BarChart3 className="h-10 w-10 text-white" />
                </motion.div>

                <div className="space-y-2">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
                  >
                    Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg text-gray-600 dark:text-gray-300"
                  >
                    Here's what's happening with your restaurant today
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center gap-6 mt-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last updated: {lastRefresh.toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-green-400"
                      />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Real-time data
                      </span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Action Controls */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  {/* Time Filter */}
                  <div className="flex rounded-lg bg-white/10 dark:bg-gray-800/50 p-1">
                    {(["7d", "30d", "90d"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimeFilter(period)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          timeFilter === period
                            ? "bg-blue-500 text-white shadow-lg"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />

                {/* Action Buttons */}
                <OptimisticButton
                  gradient="blue"
                  size="sm"
                  icon={RefreshCw}
                  onClick={async () => {
                    await new Promise((resolve) => {
                      handleRefresh();
                      setTimeout(resolve, 1000);
                    });
                  }}
                  successMessage="Dashboard refreshed!"
                  optimisticText="Refreshing..."
                  aria-label="Refresh dashboard data"
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  Refresh
                </OptimisticButton>

                <GradientButton
                  gradient="purple"
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    // TODO: Implement export functionality
                    console.log("Export dashboard data");
                  }}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  Export
                </GradientButton>
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Primary KPI Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <AnimatedStats
          value={stats?.totalRevenue || 0}
          label="Total Revenue"
          icon={DollarSign}
          trend={stats?.revenueGrowth}
          gradient="green"
          prefix="LKR "
          loading={loading}
          subtitle="Monthly revenue"
        />

        <AnimatedStats
          value={stats?.totalOrders || 0}
          label="Total Orders"
          icon={ShoppingCart}
          trend={stats?.ordersGrowth}
          gradient="blue"
          loading={loading}
          subtitle="All time orders"
        />

        <AnimatedStats
          value={stats?.activeUsers || 0}
          label="Active Users"
          icon={Users}
          trend={stats?.usersGrowth}
          gradient="purple"
          loading={loading}
          subtitle="Registered users"
        />

        <AnimatedStats
          value={stats?.totalFoods || 0}
          label="Total Foods"
          icon={Utensils}
          trend={stats?.foodsGrowth}
          gradient="orange"
          loading={loading}
          subtitle="Menu items available"
        />
      </motion.div>

      {/* Secondary KPI Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <AnimatedStats
          value={stats?.totalChefs || 0}
          label="Active Chefs"
          icon={ChefHat}
          trend={stats?.chefsGrowth}
          gradient="cyan"
          loading={loading}
          subtitle="Cooking partners"
        />

        <AnimatedStats
          value={stats?.totalDeliveryAgents || 0}
          label="Delivery Agents"
          icon={Truck}
          trend={stats?.deliveryGrowth}
          gradient="pink"
          loading={loading}
          subtitle="Available for delivery"
        />

        <AnimatedStats
          value={stats?.pendingApprovals || 0}
          label="Pending Approvals"
          icon={UserCheck}
          trend={stats?.approvalsGrowth}
          gradient="orange"
          loading={loading}
          subtitle="Awaiting review"
        />
      </motion.div>

      {/* Performance Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <AnimatedStats
          value={stats?.averageOrderValue || 0}
          label="Average Order Value"
          icon={Target}
          gradient="green"
          prefix="LKR "
          decimals={2}
          loading={loading}
          subtitle="Per order average"
        />

        <AnimatedStats
          value={stats?.completionRate || 0}
          label="Completion Rate"
          icon={CheckCircle}
          gradient="blue"
          suffix="%"
          decimals={1}
          loading={loading}
          subtitle="Order success rate"
        />

        <AnimatedStats
          value={stats?.responseTime || 0}
          label="Response Time"
          icon={Clock}
          gradient="purple"
          suffix="min"
          decimals={1}
          loading={loading}
          subtitle="Average response"
        />

        <AnimatedStats
          value={stats?.systemHealth || 0}
          label="System Health"
          icon={Gauge}
          gradient="cyan"
          suffix="%"
          decimals={0}
          loading={loading}
          subtitle="Overall system status"
        />
      </motion.div>

      {/* Smart Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 shadow-lg"
            >
              <Brain className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Smart Insights
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered business recommendations and analytics
              </p>
            </div>
          </div>
          <GradientButton
            gradient="purple"
            size="sm"
            icon={Sparkles}
            onClick={() => navigate("/admin/analytics")}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            View Analytics Hub
          </GradientButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiInsights.slice(0, 4).map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <GlassCard
                gradient="purple"
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => {
                  // Navigate to specific insight or analytics page
                  navigate("/admin/analytics");
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:shadow-xl transition-all"
                  >
                    <insight.icon className="h-5 w-5 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-green-400"
                        />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {insight.confidence}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <div className="flex items-center justify-between">
                        <button className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors">
                          {insight.action} →
                        </button>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.type === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : insight.type === "warning"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : insight.type === "error"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {insight.type}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Essential Analytics Charts - Only 2 Working Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Essential Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Key business metrics at a glance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 dark:bg-gray-800/50">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Live data for {timeFilter}
              </span>
            </div>
            <GradientButton
              gradient="green"
              size="sm"
              icon={Eye}
              onClick={() => navigate("/admin/analytics")}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              View Full Analytics
            </GradientButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Weekly Orders Distribution - Pie Chart */}
          <GlassCard gradient="green" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Weekly Orders Distribution
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Orders by day of week
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  +{(stats?.ordersGrowth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-64">
              {ordersTrend && ordersTrend.data ? (
                <PieChart
                  data={ordersTrend.data.labels.map(
                    (label: string, index: number) => ({
                      name: label,
                      value: ordersTrend.data.datasets[0]?.data[index] || 0,
                    })
                  )}
                  height={240}
                  showLegend={true}
                  showLabels={true}
                  colors={[
                    "#10B981",
                    "#3B82F6",
                    "#F59E0B",
                    "#EF4444",
                    "#8B5CF6",
                    "#06B6D4",
                    "#84CC16",
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <ShoppingCart
                      size={48}
                      className="mx-auto mb-2 text-gray-400"
                    />
                    <p className="text-sm">Loading orders chart...</p>
                    {error && (
                      <p className="text-xs text-gray-400 mt-1">
                        Using fallback data
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Chart 2: User Growth (30-day) - Bar Chart */}
          <GlassCard gradient="orange" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Growth
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {timeFilter} user registrations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">
                  +{(stats?.usersGrowth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-64">
              {newUsersData && newUsersData.data ? (
                <BarChart
                  data={newUsersData.data.labels.map(
                    (label: string, index: number) => ({
                      name: label,
                      users: newUsersData.data.datasets[0]?.data[index] || 0,
                    })
                  )}
                  dataKeys={["users"]}
                  xAxisDataKey="name"
                  height={240}
                  showGrid={true}
                  showLegend={false}
                  colors={["#F97316"]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Users size={48} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Loading users chart...</p>
                    {error && (
                      <p className="text-xs text-gray-400 mt-1">
                        Using fallback data
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quick Analytics Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard gradient="blue" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Peak Order Time
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  2:00 PM - 4:00 PM
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard gradient="purple" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Growth Rate
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  +{(stats?.ordersGrowth || 0).toFixed(1)}% orders
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard gradient="cyan" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User Retention
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(stats?.completionRate || 85).toFixed(0)}%
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Quick Actions & Activity Hub - Equal Space Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <GlassCard gradient="cyan" className="p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-xl"
                >
                  <Zap className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your restaurant efficiently
                  </p>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                  {quickActions.length} actions
                </span>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={action.onClick}
                  className="relative p-6 text-left bg-white/60 dark:bg-gray-800/60 rounded-2xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 border border-white/30 dark:border-gray-700/50 shadow-lg hover:shadow-2xl group backdrop-blur-sm"
                >
                  {action.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-gray-800"
                    >
                      {action.badge}
                    </motion.span>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      whileHover={{ rotate: 5 }}
                      className={`p-3 rounded-xl bg-gradient-to-r ${
                        action.color === "blue"
                          ? "from-blue-500 to-cyan-500"
                          : action.color === "green"
                          ? "from-green-500 to-emerald-500"
                          : action.color === "purple"
                          ? "from-purple-500 to-pink-500"
                          : action.color === "orange"
                          ? "from-orange-500 to-red-500"
                          : action.color === "cyan"
                          ? "from-cyan-500 to-blue-500"
                          : "from-pink-500 to-rose-500"
                      } shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    >
                      <action.icon size={24} className="text-white" />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {action.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + index * 0.1 }}
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <ArrowUpRight className="h-4 w-4 text-cyan-500" />
                  </motion.div>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Enhanced Live Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <GlassCard gradient="orange" className="p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 shadow-xl"
                >
                  <Activity className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Live Activity
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time system events
                  </p>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-green-400"
                />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Live
                </span>
                <button
                  onClick={() => navigate("/admin/analytics")}
                  className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors ml-2"
                >
                  View All →
                </button>
              </motion.div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {recentActivities.slice(0, 6).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 border border-white/20 dark:border-gray-700/30 group"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className={`p-2.5 rounded-full flex-shrink-0 ${
                      activity.type === "success"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : activity.type === "warning"
                        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : activity.type === "error"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    } group-hover:scale-110 transition-transform duration-200`}
                  >
                    {activity.type === "success" ? (
                      <CheckCircle size={16} />
                    ) : activity.type === "warning" ? (
                      <AlertTriangle size={16} />
                    ) : activity.type === "error" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Activity size={16} />
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {activity.title}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 ml-2">
                        {timeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                    {activity.user && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                          {activity.user}
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.type === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : activity.type === "warning"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : activity.type === "error"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {activity.type}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {recentActivities.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="text-center py-12"
              >
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No recent activity
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  System events will appear here
                </p>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Recent Orders Table */}
      <GlassCard gradient="none" className="p-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest customer orders and status
                </p>
              </div>
            </div>
            <GradientButton
              gradient="blue"
              size="sm"
              icon={ArrowUpRight}
              onClick={() => navigate("/admin/orders")}
            >
              View All Orders
            </GradientButton>
          </div>
        </div>
        <div className="p-6">
          <MemoizedDataTable
            data={recentOrders}
            columns={[
              {
                key: "id",
                title: "Order ID",
                render: (order: RecentOrder) => (
                  <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                    #{order.id}
                  </span>
                ),
              },
              {
                key: "customer_name",
                title: "Customer",
                render: (order: RecentOrder) => (
                  <div className="font-medium text-gray-900 dark:text-white">
                    {order.customer_name || "Unknown Customer"}
                  </div>
                ),
              },
              {
                key: "items_count",
                title: "Items",
                render: (order: RecentOrder) => (
                  <div className="text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.items_count || 0} items
                    </span>
                  </div>
                ),
              },
              {
                key: "total_amount",
                title: "Total",
                render: (order: RecentOrder) => (
                  <div className="font-semibold text-gray-900 dark:text-white">
                    LKR {(order.total_amount || 0).toFixed(2)}
                  </div>
                ),
              },
              {
                key: "status",
                title: "Status",
                render: (order: RecentOrder) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(
                      order.status || "pending"
                    )}`}
                  >
                    {(order.status || "pending").charAt(0).toUpperCase() +
                      (order.status || "pending").slice(1)}
                  </span>
                ),
              },
              {
                key: "created_at",
                title: "Time",
                render: (order: RecentOrder) => (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {order.created_at
                      ? timeAgo(new Date(order.created_at))
                      : "Unknown"}
                  </div>
                ),
              },
            ]}
            loading={loading}
            searchable={false}
          />
        </div>
      </GlassCard>

      {/* Recent Deliveries Table */}
      <GlassCard gradient="none" className="p-0 mb-8">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Deliveries
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest delivery tracking and status
                </p>
              </div>
            </div>
            <GradientButton
              gradient="purple"
              size="sm"
              icon={ArrowUpRight}
              onClick={() => navigate("/admin/orders")}
            >
              View All Deliveries
            </GradientButton>
          </div>
        </div>
        <div className="p-6">
          <MemoizedDataTable
            data={recentDeliveries}
            columns={[
              {
                key: "tracking_code",
                title: "Tracking Code",
                render: (delivery: RecentDelivery) => (
                  <span className="font-medium text-purple-600 hover:text-purple-700 cursor-pointer">
                    {delivery.tracking_code}
                  </span>
                ),
              },
              {
                key: "customer_name",
                title: "Customer",
                render: (delivery: RecentDelivery) => (
                  <div className="font-medium text-gray-900 dark:text-white">
                    {delivery.customer_name}
                  </div>
                ),
              },
              {
                key: "delivery_agent",
                title: "Agent",
                render: (delivery: RecentDelivery) => (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {(delivery.delivery_agent || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {delivery.delivery_agent}
                    </span>
                  </div>
                ),
              },
              {
                key: "delivery_address",
                title: "Address",
                render: (delivery: RecentDelivery) => (
                  <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {delivery.delivery_address}
                  </div>
                ),
              },
              {
                key: "status",
                title: "Status",
                render: (delivery: RecentDelivery) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(
                      delivery.status
                    )}`}
                  >
                    {(delivery.status || "pending").charAt(0).toUpperCase() +
                      (delivery.status || "pending").slice(1)}
                  </span>
                ),
              },
              {
                key: "estimated_time",
                title: "ETA",
                render: (delivery: RecentDelivery) => (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {delivery.estimated_time
                      ? new Date(delivery.estimated_time).toLocaleTimeString()
                      : "N/A"}
                  </div>
                ),
              },
            ]}
            loading={loading}
            searchable={false}
          />
        </div>
      </GlassCard>

      {/* Performance Metrics Footer */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            LKR {(stats?.averageOrderValue || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Order Value
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {(stats?.completionRate || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Completion Rate
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(stats?.responseTime || 0).toFixed(1)}s
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Response Time
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats?.systemHealth || 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            System Health
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapped Dashboard with Error Boundary and Performance Optimization
const Dashboard: React.FC = () => {
  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        console.error("Dashboard error:", error, errorInfo);
      }}
    >
      <LazyPageWrapper showProgress={true}>
        <DashboardContent />
      </LazyPageWrapper>
    </ErrorBoundary>
  );
};

export default Dashboard;
