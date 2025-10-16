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
  OptimisticButton,
  PieChart,
} from "@/components/admin/shared";
import OrderDetailsModal from "@/components/admin/shared/modals/OrderDetailsModal";
import HelpTooltip from "@/components/ui/HelpTooltip";

import { useAuth } from "@/context/AuthContext";
import {
  adminService,
  type DashboardStats as ApiDashboardStats,
} from "@/services/adminService";
import { aiService } from "@/services/aiService";
import { type ChartData } from "@/types/admin";
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
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Gauge,
  MapPin,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Settings,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  User,
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
  color?: string;
}

interface OrderHoverPreviewProps {
  order: RecentOrder;
  isVisible: boolean;
  position: { x: number; y: number };
}

interface DeliveryHoverPreviewProps {
  delivery: RecentDelivery;
  isVisible: boolean;
  position: { x: number; y: number };
}

const DeliveryHoverPreview: React.FC<DeliveryHoverPreviewProps> = ({
  delivery,
  isVisible,
  position,
}) => {
  if (!isVisible) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "picked_up":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "in_transit":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "returned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Tracking #{delivery.tracking_code}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Order #{delivery.order_id}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                delivery.status
              )}`}
            >
              {delivery.status}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Customer:
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {delivery.customer_name}
            </span>
          </div>
        </div>

        {/* Delivery Agent */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {(delivery.delivery_agent || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Agent:
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {delivery.delivery_agent}
            </span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Address:
              </span>
              <p className="text-xs text-gray-900 dark:text-white mt-1 leading-relaxed">
                {delivery.delivery_address}
              </p>
            </div>
          </div>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              ETA
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {delivery.estimated_time
                ? new Date(delivery.estimated_time).toLocaleTimeString()
                : "N/A"}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Actual
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {delivery.actual_time
                ? new Date(delivery.actual_time).toLocaleTimeString()
                : "Pending"}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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

  // Real-time activity updates
  const [activityPollingEnabled, setActivityPollingEnabled] = useState(true);
  const [activityPollingInterval, setActivityPollingInterval] = useState(30000); // 30 seconds
  const [lastActivityUpdate, setLastActivityUpdate] = useState<Date>(
    new Date()
  );
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const [activityAutoScroll, setActivityAutoScroll] = useState(true);

  // Activity filtering
  const [activityFilters, setActivityFilters] = useState({
    type: "all" as "all" | "success" | "warning" | "error" | "info",
    timeRange: "all" as "all" | "1h" | "6h" | "24h" | "7d",
    user: "all" as string,
    search: "" as string,
  });
  const [showActivityFilters, setShowActivityFilters] = useState(false);

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
  const [exporting, setExporting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
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

  // Hover preview states
  const [hoveredOrder, setHoveredOrder] = useState<RecentOrder | null>(null);
  const [orderTooltipPosition, setOrderTooltipPosition] = useState({
    x: 0,
    y: 0,
  });
  const [hoveredDelivery, setHoveredDelivery] = useState<RecentDelivery | null>(
    null
  );
  const [deliveryTooltipPosition, setDeliveryTooltipPosition] = useState({
    x: 0,
    y: 0,
  });

  // Activity detail modal
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null
  );
  const [showActivityModal, setShowActivityModal] = useState(false);

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
        // Fetch data based on timeFilter

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
          adminService.getOrdersTrend(days),
          adminService.getWeeklyPerformance(days),
          adminService.getGrowthAnalytics(days),
          adminService.getWeeklyOrdersDistribution(),
          adminService.getNewUsersData(days),
        ]);

        // Transform API response data

        // Transform API data to match component state
        const transformedStats: DashboardStats = {
          totalRevenue: dashboardStats.total_revenue || 0,
          totalOrders: dashboardStats.total_orders || 0,
          activeUsers: dashboardStats.active_users || 0,
          totalFoods: dashboardStats.total_foods || 0,
          totalChefs: dashboardStats.total_chefs || 0,
          totalDeliveryAgents:
            (dashboardStats as any).total_delivery_agents || 0,
          // Use backend's pending_user_approvals; keep name aligned with UI card
          pendingApprovals: dashboardStats.pending_user_approvals || 0,
          revenueGrowth: dashboardStats.revenue_growth || 0,
          ordersGrowth: dashboardStats.order_growth || 0,
          usersGrowth: dashboardStats.user_growth || 0,
          foodsGrowth: (dashboardStats as any).foods_growth || 0,
          chefsGrowth: dashboardStats.chef_growth || 0,
          deliveryGrowth: (dashboardStats as any).delivery_growth || 0,
          // Calculate approvals growth from pending vs previous period
          approvalsGrowth: (dashboardStats as any).approvals_growth || 0,
          averageOrderValue:
            dashboardStats.total_orders > 0
              ? dashboardStats.total_revenue / dashboardStats.total_orders
              : 0, // Calculate from available data
          completionRate: (dashboardStats as any).completion_rate || 85.0, // Use backend data if available
          responseTime: (dashboardStats as any).response_time || 1.2, // Use backend data if available
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

        // Orders transformed successfully

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

        // Deliveries transformed successfully

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
        setOrdersTrend(ordersDistributionRes || createFallbackPieData());
        setWeeklyPerformance(
          weeklyPerformanceRes || createFallbackChartData("Performance", days)
        );
        setGrowthAnalytics(
          growthAnalyticsRes || createFallbackChartData("Growth", days)
        );
        setOrdersDistribution(weeklyOrdersRes || createFallbackPieData());
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

        // Don't set fallback data for tables - let them be empty if API fails
        setRecentOrders([]);
        setRecentDeliveries([]);
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
      // Provide fallback insights with real-time data context
      setAiInsights([
        {
          id: "system-status",
          title: "System Status",
          description: `System health at ${Math.round(
            stats?.systemHealth || 85
          )}% - All core services operational`,
          type: "success",
          confidence: 95,
          icon: CheckCircle,
          action: "View Details",
        },
        {
          id: "revenue-trend",
          title: "Revenue Growth",
          description: `Revenue growth at ${
            stats?.revenueGrowth?.toFixed(1) || "0.0"
          }% this period - ${
            stats?.revenueGrowth && stats.revenueGrowth > 0
              ? "Positive trend detected"
              : "Monitor closely"
          }`,
          type:
            stats?.revenueGrowth && stats.revenueGrowth > 0
              ? "success"
              : "warning",
          confidence: 87,
          icon: TrendingUp,
          action: "View Analytics",
        },
        {
          id: "order-volume",
          title: "Order Volume",
          description: `${stats?.totalOrders || 0} total orders, growth: ${
            stats?.ordersGrowth?.toFixed(1) || "0.0"
          }%`,
          type: "info",
          confidence: 82,
          icon: ShoppingCart,
          action: "View Orders",
        },
        {
          id: "user-engagement",
          title: "User Engagement",
          description: `${stats?.activeUsers || 0} active users, ${
            stats?.pendingApprovals || 0
          } pending approvals`,
          type:
            stats?.pendingApprovals && stats.pendingApprovals > 10
              ? "warning"
              : "success",
          confidence: 79,
          icon: Users,
          action: "Manage Users",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  }, [stats]);

  // Load data on mount and when timeFilter changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Reload data when timeFilter changes
  useEffect(() => {
    if (!loading) {
      loadDashboardData();
    }
  }, [timeFilter]);

  // Load AI insights on mount
  useEffect(() => {
    loadAIInsights();
  }, [loadAIInsights]);

  // Real-time activity polling
  useEffect(() => {
    if (!activityPollingEnabled) return;

    const pollActivities = async () => {
      try {
        const activitiesData = await adminService.getRecentActivities(10);
        const transformedActivities: ActivityItem[] = activitiesData.map(
          (activity) => ({
            id: activity.id.toString(),
            title: activity.action,
            description: activity.description,
            timestamp: new Date(activity.timestamp),
            type: determineActivityType(activity.action),
            user: activity.admin_name,
          })
        );

        // Check for new activities
        const currentLatestId = recentActivities[0]?.id;
        const newLatestId = transformedActivities[0]?.id;

        if (currentLatestId && newLatestId && currentLatestId !== newLatestId) {
          // Count new activities
          const newCount = transformedActivities.findIndex(
            (activity) => activity.id === currentLatestId
          );
          if (newCount > 0) {
            setNewActivitiesCount(newCount);
          }
        }

        setRecentActivities(transformedActivities);
        setLastActivityUpdate(new Date());
      } catch (error) {
        console.error("Error polling activities:", error);
      }
    };

    // Initial poll
    pollActivities();

    // Set up polling interval
    const interval = setInterval(pollActivities, activityPollingInterval);

    return () => clearInterval(interval);
  }, [activityPollingEnabled, activityPollingInterval, recentActivities]);

  // Reset new activities count when user views them
  const handleActivityViewed = useCallback(() => {
    setNewActivitiesCount(0);
  }, []);

  // Filter activities based on current filters
  const filteredActivities = useMemo(() => {
    return recentActivities.filter((activity) => {
      // Type filter
      if (
        activityFilters.type !== "all" &&
        activity.type !== activityFilters.type
      ) {
        return false;
      }

      // Time range filter
      if (activityFilters.timeRange !== "all") {
        const now = new Date();
        const activityTime = activity.timestamp;
        const diffMs = now.getTime() - activityTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        switch (activityFilters.timeRange) {
          case "1h":
            if (diffHours > 1) return false;
            break;
          case "6h":
            if (diffHours > 6) return false;
            break;
          case "24h":
            if (diffHours > 24) return false;
            break;
          case "7d":
            if (diffHours > 168) return false; // 7 * 24 = 168 hours
            break;
        }
      }

      // User filter
      if (
        activityFilters.user !== "all" &&
        activity.user !== activityFilters.user
      ) {
        return false;
      }

      // Search filter
      if (activityFilters.search) {
        const searchLower = activityFilters.search.toLowerCase();
        const titleMatch = activity.title.toLowerCase().includes(searchLower);
        const descriptionMatch = activity.description
          .toLowerCase()
          .includes(searchLower);
        const userMatch = activity.user?.toLowerCase().includes(searchLower);

        if (!titleMatch && !descriptionMatch && !userMatch) {
          return false;
        }
      }

      return true;
    });
  }, [recentActivities, activityFilters]);

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = new Set(
      recentActivities.map((activity) => activity.user).filter(Boolean)
    );
    return Array.from(users);
  }, [recentActivities]);

  // Manual refresh with debouncing
  const handleRefresh = useCallback(() => {
    // Prevent rapid refresh calls
    if (refreshing) return;
    loadDashboardData(true);
  }, [refreshing, loadDashboardData]);

  // Export dashboard data
  const handleExport = useCallback(async () => {
    if (exporting) return;

    try {
      setExporting(true);

      // Export dashboard summary data (users, orders, activity logs)
      const [usersBlob, ordersBlob, activityBlob] = await Promise.all([
        adminService.exportData("users", "csv"),
        adminService.exportData("orders", "csv"),
        adminService.exportData("activity_logs", "csv"),
      ]);

      // Create download links for each export
      const downloads = [
        {
          blob: usersBlob,
          filename: `dashboard-users-${
            new Date().toISOString().split("T")[0]
          }.csv`,
        },
        {
          blob: ordersBlob,
          filename: `dashboard-orders-${
            new Date().toISOString().split("T")[0]
          }.csv`,
        },
        {
          blob: activityBlob,
          filename: `dashboard-activity-${
            new Date().toISOString().split("T")[0]
          }.csv`,
        },
      ];

      // Download each file
      downloads.forEach(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });

      // Show success notification
      console.log("Dashboard data exported successfully");
    } catch (error) {
      console.error("Error exporting dashboard data:", error);
      // For advanced exports, redirect to analytics hub
      navigate("/admin/analytics");
    } finally {
      setExporting(false);
    }
  }, [exporting, navigate]);

  // Handle order row click
  const handleOrderClick = useCallback((order: RecentOrder) => {
    setSelectedOrderId(order.id);
    setShowOrderModal(true);
  }, []);

  // Close order modal
  const handleCloseOrderModal = useCallback(() => {
    setShowOrderModal(false);
    setSelectedOrderId(null);
  }, []);

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

  // Order Hover Preview Component
  interface OrderHoverPreviewProps {
    order: RecentOrder;
    isVisible: boolean;
    position: { x: number; y: number };
  }

  const OrderHoverPreview: React.FC<OrderHoverPreviewProps> = ({
    order,
    isVisible,
    position,
  }) => {
    if (!isVisible) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "confirmed":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "preparing":
          return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        case "ready":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case "delivered":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "cancelled":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      }
    };

    const getPaymentStatusColor = (status: string) => {
      switch (status) {
        case "paid":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "failed":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-80 max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Order #{order.id}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {order.order_number}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Customer:
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {order.customer_name}
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Items
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {order.items_count}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Total Amount
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                LKR {order.total_amount?.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Payment:
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(
                  order.payment_status
                )}`}
              >
                {order.payment_status}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString()
                : "Unknown"}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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

                <div className="space-y-2 flex-1 min-w-0">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
                  >
                    Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg text-gray-600 dark:text-gray-300"
                  >
                    Here's what's happening with your restaurant today
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4"
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
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  {/* Time Filter */}
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-white/10 dark:bg-gray-800/50 p-1 overflow-x-auto">
                      {(["7d", "30d", "90d"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setTimeFilter(period)}
                          className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                            timeFilter === period
                              ? "bg-blue-500 text-white shadow-lg"
                              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                    <HelpTooltip
                      content="Filter dashboard data by time period. 7d shows last 7 days, 30d shows last 30 days, 90d shows last 90 days of data."
                      title="Time Filter"
                      position="bottom"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-px h-px sm:h-8 bg-gray-300 dark:bg-gray-600" />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                    className="shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                  >
                    Refresh
                  </OptimisticButton>

                  <OptimisticButton
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    loading={exporting}
                    className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? "Exporting..." : "Export Dashboard"}
                  </OptimisticButton>
                </div>
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
              <HelpTooltip
                content="AI-powered insights provide automated analysis of your business data, including sales forecasting, anomaly detection, and personalized recommendations."
                title="Smart Insights"
                position="right"
                className="ml-2"
              />
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
                  // Navigate based on insight type
                  if (insight.id === "sales-forecast") {
                    navigate("/admin/analytics?tab=forecast");
                  } else if (insight.id === "anomaly-detection") {
                    navigate("/admin/analytics?tab=anomalies");
                  } else if (insight.id === "product-recommendations") {
                    navigate("/admin/content");
                  } else if (insight.id === "customer-insights") {
                    navigate("/admin/analytics?tab=customers");
                  } else {
                    navigate("/admin/analytics");
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`p-3 rounded-xl bg-gradient-to-r ${
                      insight.color || "from-purple-500 to-pink-500"
                    } shadow-lg group-hover:shadow-xl transition-all duration-300`}
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
                  noCard={true}
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
                  noCard={true}
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
                    Real-time system events and admin actions
                  </p>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="flex items-center gap-3"
              >
                {/* Real-time Status */}
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: activityPollingEnabled ? [1, 1.2, 1] : 1,
                      opacity: activityPollingEnabled ? 1 : 0.5,
                    }}
                    transition={{
                      duration: activityPollingEnabled ? 2 : 0,
                      repeat: activityPollingEnabled ? Infinity : 0,
                    }}
                    className={`w-3 h-3 rounded-full ${
                      activityPollingEnabled
                        ? "bg-green-400 shadow-lg"
                        : "bg-gray-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      activityPollingEnabled
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {activityPollingEnabled ? "Live" : "Paused"}
                  </span>
                </div>

                {/* New Activities Indicator */}
                {newActivitiesCount > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ⚡
                    </motion.div>
                    {newActivitiesCount} new
                  </motion.div>
                )}

                {/* Polling Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setActivityPollingEnabled(!activityPollingEnabled)
                    }
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      activityPollingEnabled
                        ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                    title={
                      activityPollingEnabled
                        ? "Pause live updates"
                        : "Enable live updates"
                    }
                  >
                    {activityPollingEnabled ? (
                      <Pause size={14} />
                    ) : (
                      <Play size={14} />
                    )}
                  </button>

                  <button
                    onClick={() => setShowActivityFilters(!showActivityFilters)}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      showActivityFilters
                        ? "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                    title={
                      showActivityFilters ? "Hide filters" : "Show filters"
                    }
                  >
                    <Settings size={14} />
                  </button>

                  <select
                    value={activityPollingInterval}
                    onChange={(e) =>
                      setActivityPollingInterval(Number(e.target.value))
                    }
                    className="text-xs bg-white/10 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300"
                  >
                    <option value={10000}>10s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>1m</option>
                    <option value={300000}>5m</option>
                  </select>

                  <HelpTooltip
                    content="Control live activity updates: toggle real-time polling on/off, adjust refresh intervals, and access advanced filtering options."
                    title="Activity Controls"
                    position="bottom"
                  />
                </div>
              </motion.div>
            </div>

            {/* Activity Filters */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: showActivityFilters ? 1 : 0,
                height: showActivityFilters ? "auto" : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200/50 dark:border-orange-700/30 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Activity Type
                    </label>
                    <select
                      value={activityFilters.type}
                      onChange={(e) =>
                        setActivityFilters((prev) => ({
                          ...prev,
                          type: e.target.value as any,
                        }))
                      }
                      className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="info">Info</option>
                    </select>
                  </div>

                  {/* Time Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Range
                    </label>
                    <select
                      value={activityFilters.timeRange}
                      onChange={(e) =>
                        setActivityFilters((prev) => ({
                          ...prev,
                          timeRange: e.target.value as any,
                        }))
                      }
                      className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Time</option>
                      <option value="1h">Last Hour</option>
                      <option value="6h">Last 6 Hours</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                    </select>
                  </div>

                  {/* User Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User
                    </label>
                    <select
                      value={activityFilters.user}
                      onChange={(e) =>
                        setActivityFilters((prev) => ({
                          ...prev,
                          user: e.target.value,
                        }))
                      }
                      className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Users</option>
                      {uniqueUsers.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      value={activityFilters.search}
                      onChange={(e) =>
                        setActivityFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      placeholder="Search activities..."
                      className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-orange-200/50 dark:border-orange-700/30">
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      Showing {filteredActivities.length} of{" "}
                      {recentActivities.length} activities
                    </span>
                    {Object.values(activityFilters).some(
                      (value) => value !== "all" && value !== ""
                    ) && (
                      <button
                        onClick={() =>
                          setActivityFilters({
                            type: "all",
                            timeRange: "all",
                            user: "all",
                            search: "",
                          })
                        }
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Activity Feed with Enhanced Design */}
            <div
              className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-600 scrollbar-track-transparent"
              onScroll={handleActivityViewed}
              onClick={handleActivityViewed}
            >
              {filteredActivities.slice(0, 8).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 1.1 + index * 0.08,
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2 },
                  }}
                  className="group relative p-5 rounded-2xl bg-gradient-to-r from-white/80 to-orange-50/50 dark:from-gray-800/80 dark:to-orange-900/20 hover:from-white/90 hover:to-orange-100/60 dark:hover:from-gray-700/90 dark:hover:to-orange-800/30 transition-all duration-300 border border-orange-200/50 dark:border-orange-700/30 shadow-lg hover:shadow-xl backdrop-blur-sm cursor-pointer"
                  onClick={() => {
                    setSelectedActivity(activity);
                    setShowActivityModal(true);
                    handleActivityViewed();
                  }}
                >
                  {/* Activity Type Indicator */}
                  <div className="absolute top-4 left-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className={`p-2.5 rounded-xl flex-shrink-0 shadow-lg ${
                        activity.type === "success"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          : activity.type === "warning"
                          ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
                          : activity.type === "error"
                          ? "bg-gradient-to-r from-red-500 to-pink-600 text-white"
                          : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                      } group-hover:scale-110 transition-transform duration-200`}
                    >
                      {activity.type === "success" ? (
                        <CheckCircle size={18} />
                      ) : activity.type === "warning" ? (
                        <AlertTriangle size={18} />
                      ) : activity.type === "error" ? (
                        <X size={18} />
                      ) : (
                        <Activity size={18} />
                      )}
                    </motion.div>
                  </div>

                  {/* Activity Content */}
                  <div className="ml-16 flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <motion.h4
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 + index * 0.1 }}
                        className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1"
                      >
                        {activity.title}
                      </motion.h4>
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 + index * 0.1 }}
                        className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                      >
                        {timeAgo(activity.timestamp)}
                      </motion.span>
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 + index * 0.1 }}
                      className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors"
                    >
                      {activity.description}
                    </motion.p>

                    {/* Activity Metadata */}
                    <div className="flex items-center justify-between">
                      {activity.user && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.6 + index * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {activity.user.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                            {activity.user}
                          </span>
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.7 + index * 0.1 }}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          activity.type === "success"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : activity.type === "warning"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : activity.type === "error"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {activity.type.toUpperCase()}
                      </motion.div>
                    </div>
                  </div>

                  {/* Hover Indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8 + index * 0.1 }}
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Eye className="h-4 w-4 text-orange-500" />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Empty State with Enhanced Design */}
            {filteredActivities.length === 0 && recentActivities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-block p-6 rounded-3xl bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 shadow-xl mb-6"
                >
                  <Settings className="h-16 w-16 text-orange-500 dark:text-orange-400 mx-auto" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  No Matching Activities
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto"
                >
                  Try adjusting your filters to see more activities
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="mt-6"
                >
                  <button
                    onClick={() =>
                      setActivityFilters({
                        type: "all",
                        timeRange: "all",
                        user: "all",
                        search: "",
                      })
                    }
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Empty State with Enhanced Design */}
            {recentActivities.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-block p-6 rounded-3xl bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 shadow-xl mb-6"
                >
                  <Activity className="h-16 w-16 text-orange-500 dark:text-orange-400 mx-auto" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  No Recent Activity
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto"
                >
                  System events and admin actions will appear here in real-time
                  as they happen
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="mt-6 flex justify-center"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-orange-400"
                    />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      Waiting for activity...
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Activity Summary Footer */}
            {filteredActivities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0 }}
                className="mt-6 pt-4 border-t border-orange-200/50 dark:border-orange-700/30"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Showing {Math.min(filteredActivities.length, 8)} of{" "}
                      {filteredActivities.length} activities
                      {filteredActivities.length !==
                        recentActivities.length && (
                        <span className="text-orange-600 dark:text-orange-400 ml-1">
                          (filtered from {recentActivities.length} total)
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Live updates active
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/admin/analytics?tab=activity")}
                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium hover:underline transition-colors"
                  >
                    View full activity log →
                  </button>
                </div>
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
          {/* Custom Orders Table with Hover Preview */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Customer
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white hidden md:table-cell">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden lg:table-cell">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden xl:table-cell">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden lg:table-cell">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative"
                    onMouseEnter={(e) => {
                      setHoveredOrder(order);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setOrderTooltipPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredOrder(null);
                    }}
                  >
                    <td className="py-3 px-4">
                      <span
                        className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        #{order.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.customer_name || "Unknown Customer"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.items_count || 0} items
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        LKR {(order.total_amount || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(
                          order.status || "pending"
                        )}`}
                      >
                        {(order.status || "pending").charAt(0).toUpperCase() +
                          (order.status || "pending").slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.created_at
                          ? timeAgo(new Date(order.created_at))
                          : "Unknown"}
                      </div>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      No recent orders available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Order Hover Preview */}
          <OrderHoverPreview
            order={hoveredOrder!}
            isVisible={hoveredOrder !== null}
            position={orderTooltipPosition}
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
          {/* Custom Deliveries Table with Hover Preview */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Tracking Code
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden md:table-cell">
                    Agent
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden lg:table-cell">
                    Address
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden xl:table-cell">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white hidden lg:table-cell">
                    ETA
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map((delivery, index) => (
                  <tr
                    key={delivery.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative"
                    onMouseEnter={(e) => {
                      setHoveredDelivery(delivery);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDeliveryTooltipPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredDelivery(null);
                    }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-purple-600 hover:text-purple-700 cursor-pointer">
                        {delivery.tracking_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {delivery.customer_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
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
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {delivery.delivery_address}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(
                          delivery.status
                        )}`}
                      >
                        {(delivery.status || "pending")
                          .charAt(0)
                          .toUpperCase() +
                          (delivery.status || "pending").slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {delivery.estimated_time
                          ? new Date(
                              delivery.estimated_time
                            ).toLocaleTimeString()
                          : "N/A"}
                      </div>
                    </td>
                  </tr>
                ))}
                {recentDeliveries.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      No recent deliveries available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Delivery Hover Preview */}
          <DeliveryHoverPreview
            delivery={hoveredDelivery!}
            isVisible={hoveredDelivery !== null}
            position={deliveryTooltipPosition}
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderModal}
        onClose={handleCloseOrderModal}
        orderId={selectedOrderId}
      />

      {/* Activity Detail Modal */}
      {showActivityModal && selectedActivity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowActivityModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`p-3 rounded-xl ${
                    selectedActivity.type === "success"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : selectedActivity.type === "warning"
                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : selectedActivity.type === "error"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {selectedActivity.type === "success" ? (
                    <CheckCircle size={24} />
                  ) : selectedActivity.type === "warning" ? (
                    <AlertTriangle size={24} />
                  ) : selectedActivity.type === "error" ? (
                    <X size={24} />
                  ) : (
                    <Activity size={24} />
                  )}
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Activity Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedActivity.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Activity Title & Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedActivity.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedActivity.description}
                </p>
              </div>

              {/* Activity Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type & Status */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Activity Type
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedActivity.type === "success"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : selectedActivity.type === "warning"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : selectedActivity.type === "error"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {selectedActivity.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timestamp
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {selectedActivity.timestamp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {timeAgo(selectedActivity.timestamp)}
                    </div>
                  </div>
                </div>

                {/* User & Additional Info */}
                <div className="space-y-4">
                  {selectedActivity.user && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Performed By
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {selectedActivity.user.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedActivity.user}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Administrator
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Activity ID
                    </label>
                    <div className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {selectedActivity.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Context/Additional Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Additional Context
                </label>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Category:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {selectedActivity.type === "success"
                          ? "System Operations"
                          : selectedActivity.type === "warning"
                          ? "System Warnings"
                          : selectedActivity.type === "error"
                          ? "System Errors"
                          : "General Activities"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Priority:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {selectedActivity.type === "error"
                          ? "High"
                          : selectedActivity.type === "warning"
                          ? "Medium"
                          : "Low"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Source:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        Admin Dashboard
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Environment:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        Production
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Activity logged on{" "}
                {selectedActivity.timestamp.toLocaleDateString()}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate("/admin/analytics?tab=activity");
                    setShowActivityModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  View All Activities
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Wrapped Dashboard with Error Boundary and Performance Optimization
const Dashboard: React.FC = () => {
  return (
    <ErrorBoundary
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
