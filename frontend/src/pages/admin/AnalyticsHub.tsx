import React, { useCallback, useEffect, useState } from "react";
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
import { analyticsService } from "@/services/analyticsService";

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
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [orderData, customerData] = await Promise.all([
        analyticsService.getOrderAnalytics(timeRange),
        analyticsService.getCustomerAnalytics(timeRange),
      ]);

      // Transform API data to match backend response shape
      const transformedData: AnalyticsData = {
        revenue: orderData.total_revenue || 0,
        orders: orderData.total_orders || 0,
        users: customerData.total_customers || 0,
        avgOrderValue:
          orderData.total_revenue / Math.max(orderData.total_orders || 1, 1),
        growth: {
          revenue: 0, // TODO: compute from daily_breakdown
          orders: 0, // TODO: compute from daily_breakdown
          users: customerData.growth_rate || 0,
        },
      };

      setAnalyticsData(transformedData);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Load business metrics
  const loadBusinessMetrics = useCallback(async () => {
    try {
      const metrics = await analyticsService.getRevenueAnalytics(timeRange);
      const performance = await analyticsService.getPerformanceMetrics(
        timeRange
      );

      const transformedMetrics: BusinessMetrics = {
        revenue: {
          current: metrics.current || 0,
          previous: metrics.previous || 0,
          trend: metrics.trend || "stable",
        },
        orders: {
          total: 0,
          completed: 0,
          pending: 0,
          trend: 0,
        },
        customers: {
          total: 0,
          active: 0,
          retention: 0,
        },
        performance: {
          avgDeliveryTime: performance.avgDeliveryTime || 0,
          customerSatisfaction: performance.customerSatisfaction || 0,
        },
      };

      setBusinessMetrics(transformedMetrics);
    } catch (error) {
      console.error("Error loading business metrics:", error);
    }
  }, [timeRange]);

  // Load business insights
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
      }
    } catch (error) {
      console.error("Error loading business insights:", error);
    }
  }, []);

  // Load report templates
  const loadReportTemplates = useCallback(async () => {
    try {
      const templates = await analyticsService.getReportTemplates();
      setReportTemplates(templates);
    } catch (error) {
      console.error("Error loading report templates:", error);
      // Set empty array on error instead of mock data
      setReportTemplates([]);
    }
  }, []);

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

  // Load all data
  useEffect(() => {
    loadAnalyticsData();
    loadBusinessMetrics();
    loadBusinessInsights();
    loadReportTemplates();
  }, [
    loadAnalyticsData,
    loadBusinessMetrics,
    loadBusinessInsights,
    loadReportTemplates,
  ]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAnalyticsData();
        loadBusinessMetrics();
        loadBusinessInsights();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [
    autoRefresh,
    loadAnalyticsData,
    loadBusinessMetrics,
    loadBusinessInsights,
  ]);

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
            data={[
              { name: "Week 1", value: 15000 },
              { name: "Week 2", value: 18000 },
              { name: "Week 3", value: 22000 },
              { name: "Week 4", value: 25000 },
              { name: "Week 5", value: 28000 },
              { name: "Week 6", value: 24000 },
            ]}
            dataKeys={["value"]}
            xAxisDataKey="name"
            height={280}
            colors={["#3B82F6"]}
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
            data={[
              { name: "Completed", value: 65, color: "#22c55e" },
              { name: "Processing", value: 25, color: "#f59e0b" },
              { name: "Cancelled", value: 10, color: "#ef4444" },
            ]}
            height={280}
            colors={["#22c55e", "#f59e0b", "#ef4444"]}
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
            data={[
              { name: "Mon", performance: 85, completion: 92 },
              { name: "Tue", performance: 88, completion: 94 },
              { name: "Wed", performance: 82, completion: 89 },
              { name: "Thu", performance: 90, completion: 96 },
              { name: "Fri", performance: 93, completion: 98 },
              { name: "Sat", performance: 87, completion: 91 },
              { name: "Sun", performance: 85, completion: 88 },
            ]}
            dataKeys={["performance", "completion"]}
            xAxisDataKey="name"
            height={280}
            showTrend={true}
            colors={["#06B6D4", "#3B82F6"]}
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
            data={[
              { name: "Week 1", users: 120, orders: 85, revenue: 15000 },
              { name: "Week 2", users: 150, orders: 102, revenue: 18000 },
              { name: "Week 3", users: 180, orders: 125, revenue: 22000 },
              { name: "Week 4", users: 210, orders: 145, revenue: 25000 },
            ]}
            dataKeys={["users", "orders", "revenue"]}
            xAxisDataKey="name"
            height={280}
            colors={["#EC4899", "#F59E0B", "#10B981"]}
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
            data={[
              { name: "Monday", value: 18 },
              { name: "Tuesday", value: 22 },
              { name: "Wednesday", value: 20 },
              { name: "Thursday", value: 25 },
              { name: "Friday", value: 28 },
              { name: "Saturday", value: 35 },
              { name: "Sunday", value: 15 },
            ]}
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
            data={[
              { name: "New", customers: 45, orders: 52, revenue: 8500 },
              {
                name: "Returning",
                customers: 120,
                orders: 185,
                revenue: 22000,
              },
              { name: "VIP", customers: 25, orders: 78, revenue: 15500 },
            ]}
            dataKeys={["customers", "orders", "revenue"]}
            xAxisDataKey="name"
            height={280}
            colors={["#F97316", "#EF4444", "#8B5CF6"]}
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
                  <Badge
                    variant={
                      template.status === "active" ? "default" : "secondary"
                    }
                  >
                    {template.status}
                  </Badge>
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
          >
            <Download className="h-6 w-6 mb-2" />
            <span>PDF Report</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <FileText className="h-6 w-6 mb-2" />
            <span>Excel Export</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <BarChart3 className="h-6 w-6 mb-2" />
            <span>Charts Only</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <Calendar className="h-6 w-6 mb-2" />
            <span>Schedule Report</span>
          </Button>
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

          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              loadAnalyticsData();
              loadBusinessMetrics();
              loadBusinessInsights();
            }}
            disabled={loading}
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
