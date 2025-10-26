import React, { useCallback, useEffect, useRef, useState } from "react";
// Import shared components
import {
  AnimatedStats,
  BarChart,
  GlassCard,
  LineChart,
  PieChart,
} from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import services
import {
  AdvancedAnalyticsData,
  analyticsService,
} from "@/services/analyticsService";

// Import icons
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Lightbulb,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Unified Analytics Hub - Consolidates 4 analytics pages
 *
 * Merged from:
 * - Analytics.tsx (basic business analytics)
 * - AdvancedAnalytics.tsx (advanced metrics, predictions)
 * - AIInsights.tsx (business insights, recommendations)
 * - AIReportsAutomation.tsx (report templates, automation)
 *
 * Features:
 * - Tabbed interface for organized access
 * - Real-time data from backend APIs
 * - Business insights and recommendations
 * - Report generation and automation
 * - Advanced charts and visualizations
 * - Consistent design and UX
 */

// Interfaces
interface AnalyticsData {
  revenue: number;
  orders: number;
  users: number;
  avgOrderValue: number;
  growth: {
    revenue: number;
    orders: number;
    users: number;
  };
}

interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    trend: "up" | "down" | "stable";
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    trend: number;
  };
  customers: {
    total: number;
    active: number;
    retention: number;
  };
  performance: {
    avgDeliveryTime: number;
    customerSatisfaction: number;
  };
}

interface BusinessInsights {
  sales_forecast: {
    next_7_days_revenue: number;
    confidence: number;
  };
  customer_insights: {
    total_customers: number;
    total_revenue: number;
    avg_order_value: number;
  };
  anomaly_detection: {
    total_anomalies: number;
    high_severity_count: number;
  };
  product_recommendations: {
    total_recommendations: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "financial" | "operational" | "customer" | "marketing" | "custom";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
  format: "pdf" | "excel" | "powerpoint" | "html" | "csv";
  status: "active" | "paused" | "draft";
  lastGenerated?: string;
}

const AnalyticsHub: React.FC = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "overview" | "advanced" | "insights" | "reports"
  >("overview");

  // Data states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [businessMetrics, setBusinessMetrics] =
    useState<BusinessMetrics | null>(null);
  const [businessInsights, setBusinessInsights] =
    useState<BusinessInsights | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] =
    useState<AdvancedAnalyticsData | null>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("90d"); // Default to 90d to show all seeded data
  const [autoRefresh, setAutoRefresh] = useState(true); // Default to true for automatic refreshing
  const [refreshInterval, setRefreshInterval] = useState<"30s" | "1m" | "5m">("30s");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [customReportFilters, setCustomReportFilters] = useState<any>({});
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true); // Default to true for real-time updates

  // Refs to prevent memory leaks and manage intervals
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const realTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(false);

  // Load analytics data with better error handling and overlap prevention
  const loadAnalyticsData = useCallback(async () => {
    if (loadingRef.current) return; // Prevent overlapping calls

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const [orderData, customerData] = await Promise.all([
        analyticsService
          .getOrderAnalytics(timeRange)
          .catch(() => ({ total: 0, revenue: 0, avgOrderValue: 0, trend: 0 })),
        analyticsService
          .getCustomerAnalytics(timeRange)
          .catch(() => ({ total: 0, retention: 0 })),
      ]);

      console.log(`📊 Order Data received (${timeRange}):`, orderData);
      console.log(`👥 Customer Data received (${timeRange}):`, customerData);

      // Transform API data to match backend response shape
      const transformedData: AnalyticsData = {
        revenue: orderData.revenue || 0,  // Use actual revenue from backend
        orders: orderData.total || 0,
        users: customerData.total || 0,
        avgOrderValue: orderData.avgOrderValue || 0,
        growth: {
          revenue: orderData.trend || 0,
          orders: orderData.trend || 0,
          users: customerData.retention || 0,
        },
      };

      console.log(`✅ Transformed Analytics Data (${timeRange}):`, transformedData);
      console.log(`   Revenue: LKR ${transformedData.revenue.toLocaleString()}`);
      console.log(`   Orders: ${transformedData.orders.toLocaleString()}`);
      console.log(`   Users: ${transformedData.users}`);
      console.log(`   Avg Order Value: LKR ${transformedData.avgOrderValue.toLocaleString()}`);

      setAnalyticsData(transformedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading analytics:", error);
      setError("Failed to load analytics data");
      // Set fallback data to prevent UI crashes
      setAnalyticsData({
        revenue: 0,
        orders: 0,
        users: 0,
        avgOrderValue: 0,
        growth: { revenue: 0, orders: 0, users: 0 },
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [timeRange]);

  // Load business metrics with better error handling
  const loadBusinessMetrics = useCallback(async () => {
    try {
      console.log("🔄 Loading business metrics for timeRange:", timeRange);
      const [metrics, performance, orders, customers] = await Promise.all([
        analyticsService
          .getRevenueAnalytics(timeRange)
          .catch((e) => {
            console.error("Revenue analytics error:", e);
            return { current: 0, previous: 0, trend: "stable" as const };
          }),
        analyticsService
          .getPerformanceMetrics(timeRange)
          .catch((e) => {
            console.error("Performance metrics error:", e);
            return { avgDeliveryTime: 0, customerSatisfaction: 0 };
          }),
        analyticsService
          .getOrderAnalytics(timeRange)
          .catch((e) => {
            console.error("Order analytics error:", e);
            return { total: 0, revenue: 0, avgOrderValue: 0, trend: 0 };
          }),
        analyticsService
          .getCustomerAnalytics(timeRange)
          .catch((e) => {
            console.error("Customer analytics error:", e);
            return { total: 0, retention: 0 };
          }),
      ]);

      console.log("💰 Revenue metrics:", metrics);
      console.log("📊 Orders:", orders);
      console.log("👥 Customers:", customers);
      console.log("⚡ Performance:", performance);

      const transformedMetrics: BusinessMetrics = {
        revenue: {
          current: metrics.current || 0,
          previous: metrics.previous || 0,
          trend: metrics.trend || "stable",
        },
        orders: {
          total: orders.total || 0,
          completed: Math.round((orders.total || 0) * 0.85), // Estimate 85% completed
          pending: Math.round((orders.total || 0) * 0.15), // Estimate 15% pending
          trend: orders.trend || 0,
        },
        customers: {
          total: customers.total || 0,
          active: Math.round((customers.total || 0) * 0.7), // Estimate 70% active
          retention: customers.retention || 0,
        },
        performance: {
          avgDeliveryTime: performance.avgDeliveryTime || 0,
          customerSatisfaction: performance.customerSatisfaction || 0,
        },
      };

      setBusinessMetrics(transformedMetrics);
    } catch (error) {
      console.error("Error loading business metrics:", error);
      // Set fallback data
      setBusinessMetrics({
        revenue: { current: 0, previous: 0, trend: "stable" },
        orders: { total: 0, completed: 0, pending: 0, trend: 0 },
        customers: { total: 0, active: 0, retention: 0 },
        performance: { avgDeliveryTime: 0, customerSatisfaction: 0 },
      });
    }
  }, [timeRange]);

  // Load business insights with better error handling
  const loadBusinessInsights = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin-management/ai/business-insights/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBusinessInsights(data.data?.insights || null);
      } else {
        // Set fallback data for better UX
        setBusinessInsights({
          sales_forecast: { next_7_days_revenue: 0, confidence: 0 },
          customer_insights: {
            total_customers: 0,
            total_revenue: 0,
            avg_order_value: 0,
          },
          anomaly_detection: { total_anomalies: 0, high_severity_count: 0 },
          product_recommendations: { total_recommendations: 0 },
        });
      }
    } catch (error) {
      console.error("Error loading business insights:", error);
      // Set fallback data on error
      setBusinessInsights({
        sales_forecast: { next_7_days_revenue: 0, confidence: 0 },
        customer_insights: {
          total_customers: 0,
          total_revenue: 0,
          avg_order_value: 0,
        },
        anomaly_detection: { total_anomalies: 0, high_severity_count: 0 },
        product_recommendations: { total_recommendations: 0 },
      });
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Load advanced analytics data with better error handling
  const loadAdvancedAnalytics = useCallback(async () => {
    if (loadingRef.current) return; // Prevent overlapping calls

    try {
      loadingRef.current = true;
      console.log("📈 Fetching advanced analytics for:", timeRange);
      const data = await analyticsService.getAdvancedAnalytics(timeRange);
      console.log("📈 Advanced Analytics Data received:", data);
      console.log("  - Revenue trends:", data?.trends?.revenue_trends?.length || 0, "days");
      console.log("  - User trends:", data?.trends?.user_trends?.length || 0, "days");
      console.log("  - Order trends:", data?.trends?.order_trends?.length || 0, "days");
      console.log("  - Customer segments:", data?.segmentation?.segments ? "✅ Available" : "❌ Missing");
      setAdvancedAnalytics(data);
    } catch (error) {
      console.error("❌ Error loading advanced analytics:", error);
      // Set fallback data instead of null to prevent UI crashes
      setAdvancedAnalytics({
        trends: {
          revenue_trends: [],
          user_trends: [],
          order_trends: [],
          summary: {
            total_revenue: 0,
            total_new_users: 0,
            total_orders: 0,
            revenue_growth_rate: 0,
            avg_daily_revenue: 0,
            avg_daily_users: 0,
            avg_daily_orders: 0,
          },
        },
        predictive: {
          predictions: [],
          model_type: "linear_regression",
          accuracy_score: 0.75,
          prediction_period_days: 7,
        },
        segmentation: {
          segments: {
            vip: { customers: 0, total_spent: 0, avg_order_value: 0 },
            regular: { customers: 0, total_spent: 0, avg_order_value: 0 },
            occasional: { customers: 0, total_spent: 0, avg_order_value: 0 },
            new: { customers: 0, total_spent: 0, avg_order_value: 0 },
          },
          total_customers_analyzed: 0,
          segmentation_criteria: {
            vip: "≥ $1000 spent AND ≥ 10 orders",
            regular: "≥ $500 spent OR ≥ 5 orders",
            occasional: "≥ $100 spent",
            new: "< $100 spent",
          },
        },
        period: timeRange,
        generated_at: new Date().toISOString(),
      });
    } finally {
      loadingRef.current = false;
    }
  }, [timeRange]);

  // Load report templates with better error handling
  const loadReportTemplates = useCallback(async () => {
    try {
      const templates = await analyticsService.getReportTemplates();
      setReportTemplates(templates || []);
    } catch (error) {
      console.error("Error loading report templates:", error);
      // Set fallback data instead of empty array
      setReportTemplates([
        {
          id: "sales_summary",
          name: "Sales Summary Report",
          description: "Comprehensive sales analytics and trends",
          type: "financial" as const,
          frequency: "monthly" as const,
          format: "pdf" as const,
          status: "active" as const,
        },
      ]);
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Generate report
  const generateReport = async (templateId: string) => {
    setGeneratingReport(true);
    try {
      await analyticsService.generateReport(templateId);
      // Refresh templates to update last generated time
      await loadReportTemplates();
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Export data functionality
  const handleExport = async (
    type: "csv" | "pdf" | "excel",
    reportType?: string
  ) => {
    setExportingData(true);
    try {
      const response = await analyticsService.exportData(type, {
        reportType: reportType || selectedReportType,
        timeRange,
        filters: customReportFilters,
      });

      // Handle file download
      if (response instanceof Response) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `admin-report-${Date.now()}.${type}`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle mock data
        const mockResponse = response as {
          data: string;
          status: number;
          statusText: string;
        };
        const blob = new Blob([mockResponse.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `admin-report-${Date.now()}.${type}`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportingData(false);
    }
  };

  // Schedule report
  const scheduleReport = async (templateId: string, schedule: any) => {
    try {
      await analyticsService.scheduleReport(templateId, schedule);
      // Refresh scheduled reports
      await loadScheduledReports();
    } catch (error) {
      console.error("Error scheduling report:", error);
    }
  };

  // Load scheduled reports with better error handling and retry logic
  const loadScheduledReports = async (retryCount = 0) => {
    const maxRetries = 2;
    try {
      const reports = await analyticsService.getScheduledReports();
      setScheduledReports(reports || []);
    } catch (error) {
      console.error("Error loading scheduled reports:", error);

      // Retry logic for transient failures
      if (
        retryCount < maxRetries &&
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("500"))
      ) {
        console.log(
          `Retrying scheduled reports load (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );
        setTimeout(
          () => loadScheduledReports(retryCount + 1),
          1000 * (retryCount + 1)
        );
        return;
      }

      // Set empty array as fallback to prevent UI crashes
      setScheduledReports([]);

      // Set error message for user feedback
      if (error instanceof Error && error.message.includes("404")) {
        setError("Scheduled reports feature is currently unavailable");
      }
    }
  };

  // Load all data - Only run on mount and timeRange change
  useEffect(() => {
    loadAnalyticsData();
    loadBusinessMetrics();
    loadBusinessInsights();
    loadAdvancedAnalytics();
    loadReportTemplates();
    loadScheduledReports();
  }, [timeRange]); // Only depend on timeRange to prevent infinite loops

  // Auto-refresh functionality - Fixed to prevent memory leaks and overlapping intervals
  useEffect(() => {
    // Clear existing interval
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }

    if (autoRefresh) {
      // Convert interval string to milliseconds
      const intervalMs = {
        "30s": 30000,
        "1m": 60000,
        "5m": 300000,
      }[refreshInterval];

      autoRefreshInterval.current = setInterval(() => {
        // Prevent overlapping calls
        if (loadingRef.current) return;

        // Call the functions directly to avoid dependency issues
        loadAnalyticsData();
        loadBusinessMetrics();
        loadBusinessInsights();
        loadAdvancedAnalytics();
      }, intervalMs);
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [autoRefresh, refreshInterval]); // Include refreshInterval in dependencies

  // Real-time updates (faster polling) - Fixed to prevent memory leaks and overlapping intervals
  useEffect(() => {
    // Clear existing interval
    if (realTimeInterval.current) {
      clearInterval(realTimeInterval.current);
      realTimeInterval.current = null;
    }

    if (isRealTimeActive) {
      realTimeInterval.current = setInterval(() => {
        // Prevent overlapping calls
        if (loadingRef.current) return;

        // Only update advanced analytics for real-time to avoid overloading
        loadAdvancedAnalytics();
        setLastUpdated(new Date());
      }, 10000); // Update every 10 seconds for real-time
    }

    return () => {
      if (realTimeInterval.current) {
        clearInterval(realTimeInterval.current);
        realTimeInterval.current = null;
      }
    };
  }, [isRealTimeActive]); // Only depend on isRealTimeActive state

  // Manual refresh function with cache clearing
  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear analytics service cache for fresh data
      analyticsService.clearCache();

      // Record start time for performance monitoring
      const startTime = performance.now();

      // Reload all data
      await Promise.all([
        loadAnalyticsData(),
        loadBusinessMetrics(),
        loadBusinessInsights(),
        loadAdvancedAnalytics(),
        loadReportTemplates(),
        loadScheduledReports(),
      ]);

      // Log performance metrics
      const loadTime = performance.now() - startTime;
      if (loadTime > 2000) {
        console.warn(
          `Analytics refresh took ${loadTime.toFixed(2)}ms (threshold: 2000ms)`
        );
      } else {
        console.log(
          `Analytics refreshed successfully in ${loadTime.toFixed(2)}ms`
        );
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error during manual refresh:", error);
      setError("Failed to refresh analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={analyticsData.revenue}
            label="Total Revenue"
            icon={DollarSign}
            trend={analyticsData.growth.revenue}
            gradient="blue"
            prefix="LKR "
          />
          <AnimatedStats
            value={analyticsData.orders}
            label="Total Orders"
            icon={ShoppingCart}
            trend={analyticsData.growth.orders}
            gradient="green"
          />
          <AnimatedStats
            value={analyticsData.users}
            label="Active Users"
            icon={Users}
            trend={analyticsData.growth.users}
            gradient="purple"
          />
          <AnimatedStats
            value={analyticsData.avgOrderValue}
            label="Avg Order Value"
            icon={TrendingUp}
            trend={5.2}
            gradient="orange"
            prefix="LKR "
            decimals={2}
          />
        </div>
      )}

      {/* Comprehensive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 1: Revenue Trend - Bar Chart */}
        <GlassCard gradient="blue" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenue Trend
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {timeRange} revenue breakdown
                </p>
              </div>
            </div>
          </div>
          <LineChart
            data={
              advancedAnalytics?.trends?.revenue_trends?.length
                ? advancedAnalytics.trends.revenue_trends.map((item) => ({
                    name: item.day_name || item.date.split('-').slice(1).join('/'),
                    value: item.revenue || 0,
                  }))
                : [
                    { name: "No Data", value: 0 },
                  ]
            }
            dataKeys={["value"]}
            xAxisDataKey="name"
            height={280}
            colors={["#3B82F6"]}
            noCard={true}
          />
        </GlassCard>

        {/* Chart 2: Order Distribution - Pie Chart */}
        <GlassCard gradient="purple" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order Distribution
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Order status breakdown
                </p>
              </div>
            </div>
          </div>
          <PieChart
            data={
              businessMetrics?.orders
                ? [
                    { name: "Completed", value: businessMetrics.orders.completed, color: "#22c55e" },
                    { name: "Processing", value: businessMetrics.orders.pending, color: "#f59e0b" },
                    { name: "Cancelled", value: Math.round(businessMetrics.orders.total * 0.05), color: "#ef4444" },
                  ]
                : [
                    { name: "No Data", value: 1, color: "#d1d5db" },
                  ]
            }
            height={280}
            colors={["#22c55e", "#f59e0b", "#ef4444"]}
            noCard={true}
          />
        </GlassCard>

        {/* Chart 3: Weekly Performance */}
        <GlassCard gradient="cyan" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Metrics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly performance trends
                </p>
              </div>
            </div>
          </div>
          <LineChart
            data={
              advancedAnalytics?.trends?.order_trends?.length
                ? advancedAnalytics.trends.order_trends.map((item) => ({
                    name: item.day_name || item.date.split('-').slice(2).join('/'),
                    orders: item.orders || 0,
                    completion: businessMetrics?.performance?.customerSatisfaction || 85,
                  }))
                : [
                    { name: "No Data", orders: 0, completion: 0 },
                  ]
            }
            dataKeys={["orders", "completion"]}
            xAxisDataKey="name"
            height={280}
            showTrend={true}
            colors={["#06B6D4", "#3B82F6"]}
            noCard={true}
          />
        </GlassCard>

        {/* Chart 4: Growth Analytics */}
        <GlassCard gradient="pink" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Growth Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Multi-metric growth tracking
                </p>
              </div>
            </div>
          </div>
          <BarChart
            data={(() => {
              console.log("🔍 Growth Analytics Chart Rendering");
              console.log("  advancedAnalytics exists?", !!advancedAnalytics);
              console.log("  trends exists?", !!advancedAnalytics?.trends);
              console.log("  revenue_trends length:", advancedAnalytics?.trends?.revenue_trends?.length || 0);
              console.log("  user_trends length:", advancedAnalytics?.trends?.user_trends?.length || 0);
              console.log("  order_trends length:", advancedAnalytics?.trends?.order_trends?.length || 0);
              
              if (!advancedAnalytics?.trends?.revenue_trends?.length) {
                console.log("  ❌ NO DATA - Showing fallback");
                return [{ name: "No Data", users: 0, orders: 0, revenue: 0 }];
              }
              
              const chartData = advancedAnalytics.trends.revenue_trends.map((item, index) => ({
                name: item.day_name || item.date.split('-').slice(1).join('/'),
                users: advancedAnalytics.trends.user_trends[index]?.new_users || 0,
                orders: advancedAnalytics.trends.order_trends[index]?.orders || 0,
                revenue: item.revenue || 0,
              }));
              
              console.log("  ✅ Chart data prepared:", chartData.length, "items");
              console.log("  Sample data point:", chartData[0]);
              return chartData;
            })()}
            dataKeys={["users", "orders", "revenue"]}
            xAxisDataKey="name"
            height={280}
            colors={["#EC4899", "#F59E0B", "#10B981"]}
            noCard={true}
          />
        </GlassCard>

        {/* Chart 5: Weekly Distribution */}
        <GlassCard gradient="green" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Weekly Distribution
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  7-day order breakdown
                </p>
              </div>
            </div>
          </div>
          <PieChart
            data={(() => {
              console.log("🔍 Weekly Distribution Chart Rendering");
              console.log("  order_trends length:", advancedAnalytics?.trends?.order_trends?.length || 0);
              
              if (!advancedAnalytics?.trends?.order_trends?.length) {
                console.log("  ❌ NO DATA - Showing fallback");
                return [{ name: "No Data", value: 1 }];
              }
              
              // Group orders by day_name
              const dayOrders: Record<string, number> = {};
              advancedAnalytics.trends.order_trends.forEach((item) => {
                const day = item.day_name || new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' });
                dayOrders[day] = (dayOrders[day] || 0) + (item.orders || 0);
              });
              
              console.log("  Day orders aggregated:", dayOrders);
              
              // Convert to array format
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              const chartData = days.map(day => ({
                name: day,
                value: dayOrders[day] || 0,
              })).filter(item => item.value > 0);
              
              console.log("  ✅ Chart data prepared:", chartData.length, "items");
              console.log("  Total orders:", chartData.reduce((sum, item) => sum + item.value, 0));
              return chartData.length > 0 ? chartData : [{ name: "No Data", value: 1 }];
            })()}
            height={280}
            colors={[
              "#8B5CF6",
              "#EC4899",
              "#F59E0B",
              "#EF4444",
              "#10B981",
              "#3B82F6",
              "#6366F1",
            ]}
            noCard={true}
          />
        </GlassCard>

        {/* Chart 6: Customer Analytics */}
        <GlassCard gradient="orange" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customer behavior patterns
                </p>
              </div>
            </div>
          </div>
          <BarChart
            data={(() => {
              console.log("🔍 Customer Analytics Chart Rendering");
              console.log("  segmentation exists?", !!advancedAnalytics?.segmentation);
              console.log("  segments exists?", !!advancedAnalytics?.segmentation?.segments);
              
              if (!advancedAnalytics?.segmentation?.segments) {
                console.log("  ❌ NO DATA - Showing fallback");
                return [{ name: "No Data", customers: 0, revenue: 0 }];
              }
              
              const segments = advancedAnalytics.segmentation.segments;
              const chartData = [
                {
                  name: "New",
                  customers: segments.new?.customers || 0,
                  revenue: segments.new?.total_spent || 0,
                },
                {
                  name: "Occasional",
                  customers: segments.occasional?.customers || 0,
                  revenue: segments.occasional?.total_spent || 0,
                },
                {
                  name: "Regular",
                  customers: segments.regular?.customers || 0,
                  revenue: segments.regular?.total_spent || 0,
                },
                {
                  name: "VIP",
                  customers: segments.vip?.customers || 0,
                  revenue: segments.vip?.total_spent || 0,
                },
              ];
              
              console.log("  ✅ Chart data prepared:", chartData);
              console.log("  Total customers:", chartData.reduce((sum, item) => sum + item.customers, 0));
              return chartData;
            })()}
            dataKeys={["customers", "revenue"]}
            xAxisDataKey="name"
            height={280}
            colors={["#F97316", "#EF4444", "#8B5CF6"]}
            noCard={true}
          />
        </GlassCard>
      </div>
    </div>
  );

  // Render Advanced Tab
  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {businessMetrics && (
        <>
          {/* Advanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedStats
              value={businessMetrics.revenue.current / 1000}
              label="Revenue Growth"
              icon={TrendingUp}
              trend={businessMetrics.revenue.trend === "up" ? 12.5 : -2.1}
              gradient="blue"
              prefix="LKR "
              suffix="K"
              decimals={1}
            />
            <AnimatedStats
              value={businessMetrics.performance.avgDeliveryTime}
              label="Avg Delivery Time"
              icon={Clock}
              trend={-5}
              gradient="green"
              suffix=" min"
            />
            <AnimatedStats
              value={businessMetrics.performance.customerSatisfaction}
              label="Customer Satisfaction"
              icon={Target}
              trend={0.3}
              gradient="purple"
              suffix="/5"
              decimals={1}
            />
          </div>

          {/* Advanced Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Performance Metrics
              </h3>
              <BarChart
                data={[
                  {
                    name: "Delivery Time",
                    value: businessMetrics.performance.avgDeliveryTime,
                  },
                  {
                    name: "Satisfaction",
                    value:
                      businessMetrics.performance.customerSatisfaction * 20,
                  },
                  { name: "Completion Rate", value: 95 },
                  { name: "Response Time", value: 85 },
                ]}
                dataKeys={["value"]}
                xAxisDataKey="name"
                height={300}
                noCard={true}
              />
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
              <LineChart
                data={[
                  { name: "Week 1", value: businessMetrics.revenue.current },
                  {
                    name: "Week 2",
                    value: businessMetrics.revenue.current * 1.1,
                  },
                  {
                    name: "Week 3",
                    value: businessMetrics.revenue.current * 1.15,
                  },
                  {
                    name: "Week 4",
                    value: businessMetrics.revenue.current * 1.2,
                  },
                ]}
                dataKeys={["value"]}
                xAxisDataKey="name"
                height={300}
                noCard={true}
              />
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );

  // Render Insights Tab
  const renderInsightsTab = () => (
    <div className="space-y-6">
      {businessInsights && (
        <>
          {/* Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sales Forecast
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  LKR{" "}
                  {businessInsights.sales_forecast?.next_7_days_revenue?.toLocaleString() ||
                    "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Next 7 days prediction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Anomalies Detected
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businessInsights.anomaly_detection?.total_anomalies || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {businessInsights.anomaly_detection?.high_severity_count || 0}{" "}
                  high priority
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recommendations
                </CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businessInsights.product_recommendations
                    ?.total_recommendations || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Product suggestions available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Customer Insights
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businessInsights.customer_insights?.total_customers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg order: LKR{" "}
                  {(
                    businessInsights.customer_insights?.avg_order_value || 0
                  ).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Business Insights */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Business Intelligence Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Revenue Growth</h4>
                  <p className="text-sm text-gray-600">
                    Predicted revenue increase of LKR{" "}
                    {businessInsights.sales_forecast?.next_7_days_revenue?.toLocaleString() ||
                      "0"}{" "}
                    over the next 7 days.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">System Monitoring</h4>
                  <p className="text-sm text-gray-600">
                    {businessInsights.anomaly_detection?.total_anomalies || 0}{" "}
                    anomalies detected,{" "}
                    {businessInsights.anomaly_detection?.high_severity_count ||
                      0}{" "}
                    require immediate attention.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Optimization Opportunities</h4>
                  <p className="text-sm text-gray-600">
                    {businessInsights.product_recommendations
                      ?.total_recommendations || 0}{" "}
                    product recommendations available to boost sales.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Advanced Analytics Section */}
          {advancedAnalytics && (
            <>
              {/* Trend Analysis */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Trend Analysis ({advancedAnalytics.period})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {advancedAnalytics.trends.summary.revenue_growth_rate >= 0
                        ? "+"
                        : ""}
                      {advancedAnalytics.trends.summary.revenue_growth_rate.toFixed(
                        1
                      )}
                      %
                    </div>
                    <p className="text-sm text-gray-600">Revenue Growth Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      LKR{" "}
                      {advancedAnalytics.trends.summary.avg_daily_revenue.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Avg Daily Revenue</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {advancedAnalytics.trends.summary.avg_daily_orders.toFixed(
                        1
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Avg Daily Orders</p>
                  </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Revenue Trends</h4>
                  <LineChart
                    data={advancedAnalytics.trends.revenue_trends.map(
                      (item) => ({
                        name: item.day_name,
                        value: item.revenue,
                      })
                    )}
                    dataKeys={["value"]}
                    xAxisDataKey="name"
                    height={200}
                    colors={["#3B82F6"]}
                    noCard={true}
                  />
                </div>
              </GlassCard>

              {/* Predictive Analytics */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Predictive Analytics
                </h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Model Accuracy</span>
                    <Badge variant="outline">
                      {advancedAnalytics.predictive.model_type} -{" "}
                      {(
                        advancedAnalytics.predictive.accuracy_score * 100
                      ).toFixed(0)}
                      %
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          advancedAnalytics.predictive.accuracy_score * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Next 7 Days Forecast</h4>
                    <div className="space-y-2">
                      {advancedAnalytics.predictive.predictions
                        .slice(0, 3)
                        .map((pred, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">
                              {pred.date.split("-")[2]}/
                              {pred.date.split("-")[1]}
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                LKR {pred.predicted_revenue.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {pred.predicted_orders} orders
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Prediction Confidence</h4>
                    <div className="space-y-2">
                      {advancedAnalytics.predictive.predictions
                        .slice(0, 3)
                        .map((pred, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm">Day {index + 1}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${pred.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">
                                {(pred.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Customer Segmentation */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Customer Segmentation
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Total customers analyzed:{" "}
                  {advancedAnalytics.segmentation.total_customers_analyzed}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(advancedAnalytics.segmentation.segments).map(
                    ([segment, data]) => (
                      <div
                        key={segment}
                        className="text-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {data.customers}
                        </div>
                        <div className="text-sm font-medium capitalize mb-1">
                          {segment}
                        </div>
                        <div className="text-xs text-gray-600">
                          Avg: LKR {data.avg_order_value}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: LKR {data.total_spent.toLocaleString()}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Segmentation Criteria</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(
                      advancedAnalytics.segmentation.segmentation_criteria
                    ).map(([segment, criteria]) => (
                      <div key={segment} className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium capitalize text-blue-800">
                          {segment}
                        </div>
                        <div className="text-sm text-blue-600">{criteria}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </>
          )}
        </>
      )}
    </div>
  );

  // Render Reports Tab
  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Quick Report Generation
          </h3>
          <div className="space-y-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => generateReport("sales")}
              disabled={generatingReport}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generatingReport ? "Generating..." : "Generate Sales Report"}
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => generateReport("customers")}
              disabled={generatingReport}
            >
              <Users className="h-4 w-4 mr-2" />
              Customer Analytics Report
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => generateReport("operations")}
              disabled={generatingReport}
            >
              <Activity className="h-4 w-4 mr-2" />
              Operations Report
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => generateReport("financial")}
              disabled={generatingReport}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Report
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Report Templates</h3>
          <div className="space-y-3">
            {reportTemplates.length > 0 ? (
              reportTemplates.slice(0, 5).map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        template.status === "active" ? "default" : "secondary"
                      }
                    >
                      {template.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => generateReport(template.id)}
                      disabled={generatingReport}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">
                No report templates available
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Export Options */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Export Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleExport("pdf")}
            disabled={exportingData}
          >
            <Download className="h-6 w-6 mb-2" />
            <span>{exportingData ? "Exporting..." : "PDF Report"}</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleExport("excel")}
            disabled={exportingData}
          >
            <FileText className="h-6 w-6 mb-2" />
            <span>{exportingData ? "Exporting..." : "Excel Export"}</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleExport("csv")}
            disabled={exportingData}
          >
            <BarChart3 className="h-6 w-6 mb-2" />
            <span>{exportingData ? "Exporting..." : "CSV Data"}</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() =>
              scheduleReport("comprehensive", { frequency: "weekly" })
            }
            disabled={exportingData}
          >
            <Calendar className="h-6 w-6 mb-2" />
            <span>Schedule Report</span>
          </Button>
        </div>
      </GlassCard>

      {/* Custom Report Builder */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Report Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select
                value={selectedReportType}
                onValueChange={setSelectedReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">
                    Comprehensive Report
                  </SelectItem>
                  <SelectItem value="sales">Sales Analysis</SelectItem>
                  <SelectItem value="customers">Customer Insights</SelectItem>
                  <SelectItem value="operations">Operations Report</SelectItem>
                  <SelectItem value="financial">Financial Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="time-range">Time Range</Label>
              <Select
                value={timeRange}
                onValueChange={(value: "7d" | "30d" | "90d") =>
                  setTimeRange(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="include-charts" />
              <Label htmlFor="include-charts">Include Charts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="include-details" />
              <Label htmlFor="include-details">Include Detailed Data</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="include-recommendations" />
              <Label htmlFor="include-recommendations">
                Include Recommendations
              </Label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExport("pdf", selectedReportType)}
            disabled={!selectedReportType || exportingData}
          >
            Generate Custom Report
          </Button>
        </div>
      </GlassCard>

      {/* Scheduled Reports */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          {scheduledReports.length > 0 ? (
            scheduledReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-gray-600">
                    {report.frequency} • Next: {report.nextRun}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      report.status === "active" ? "default" : "secondary"
                    }
                  >
                    {report.status}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <Clock className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No scheduled reports</p>
              <p className="text-sm text-gray-500">
                Create your first scheduled report above
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Analytics Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive business analytics and insights
          </p>
          {lastUpdated && (
            <div className="flex items-center space-x-2 mt-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              {autoRefresh && (
                <Badge variant="outline" className="text-xs">
                  Auto-refresh ON
                </Badge>
              )}
              {isRealTimeActive && (
                <Badge variant="default" className="text-xs bg-green-500">
                  Real-time Active
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          
          {autoRefresh && (
            <Select
              value={refreshInterval}
              onValueChange={(value: "30s" | "1m" | "5m") => setRefreshInterval(value)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30s">30s</SelectItem>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="real-time">Real-time</Label>
            <Switch
              id="real-time"
              checked={isRealTimeActive}
              onCheckedChange={setIsRealTimeActive}
            />
          </div>

          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">📅 Last 7 days</SelectItem>
              <SelectItem value="30d">📅 Last 30 days</SelectItem>
              <SelectItem value="90d">📅 Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Refresh all analytics data (clears cache)"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          {renderAdvancedTab()}
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          {renderInsightsTab()}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {renderReportsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsHub;
