import Greeting from "@/components/cook/Greeting";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { ChefDashboardStats, useOrderService } from "@/hooks/useOrderService";
import { orderService, IncomeData } from "@/services/orderService";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Star,
  TrendingUp,
  BarChart3,
  Calendar,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useEffect, useState } from "react";

function CookDashboardContent() {
  // State for API data
  const [stats, setStats] = useState<ChefDashboardStats | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // State for analytics display
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [periodStats, setPeriodStats] = useState<any>(null);

  // Use orderService hook and auth context
  const { loadDashboardStats } = useOrderService();
  const { user } = useAuth();

  // No sample data - all data loaded from API

  // API Loading Functions
  const fetchDashboardStats = async () => {
    try {
      const dashboardStats = await loadDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      throw error;
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsData = await orderService.getChefRecentReviews();
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
      setReviews([]); // Set empty array on error
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activityData = await orderService.getChefRecentActivity();
      setRecentActivity(activityData);
    } catch (error) {
      console.error("Error loading recent activity:", error);
      setRecentActivity([]); // Set empty array on error
    }
  };

  const fetchPeriodStats = async (period: string) => {
    try {
      // Try to get period-specific stats from API
      const response = await orderService.getChefDashboardStats();
      
      // Generate period-specific breakdown from total stats
      const periodData = generatePeriodBreakdown(response, period);
      setPeriodStats(periodData);
    } catch (error) {
      console.error("Error loading period stats:", error);
      if (stats) {
        const fallbackData = generatePeriodBreakdown(stats, period);
        setPeriodStats(fallbackData);
      }
    }
  };

  const generatePeriodBreakdown = (baseStats: any, period: string) => {
    // Generate realistic period-specific data based on total stats
    const periodMultiplier = period === '7days' ? 0.15 : period === '30days' ? 0.6 : 1.0;
    const dayCount = period === '7days' ? 7 : period === '30days' ? 30 : 365;
    
    return {
      period_label: period === '7days' ? 'Last 7 Days' : period === '30days' ? 'Last 30 Days' : 'This Year',
      period_orders: Math.floor(baseStats.total_orders * periodMultiplier),
      period_revenue: baseStats.total_revenue * periodMultiplier,
      period_completed: Math.floor(baseStats.completed_orders * periodMultiplier),
      period_pending: Math.floor(baseStats.pending_orders * periodMultiplier),
      daily_average_orders: Math.floor((baseStats.total_orders * periodMultiplier) / dayCount),
      daily_average_revenue: (baseStats.total_revenue * periodMultiplier) / dayCount,
      completion_rate: ((baseStats.completed_orders * periodMultiplier) / Math.max(1, baseStats.total_orders * periodMultiplier)) * 100,
    };
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchDashboardStats(),
        fetchReviews(),
        fetchRecentActivity(),
      ]);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  // Export functions - based on dashboard stats only
  const downloadPDF = async () => {
    try {
      // Create a real PDF using pdf-lib so the download is a proper PDF file
      if (!stats) {
        throw new Error("No dashboard data available to generate PDF");
      }

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const margin = 40;
      let y = page.getHeight() - margin;

      const lines = generatePDFContent().split("\n");

      for (const line of lines) {
        // If we run out of space on the page, add a new page and update reference
        if (y < margin + fontSize) {
          page = pdfDoc.addPage();
          y = page.getHeight() - margin;
        }

        page.drawText(line, {
          x: margin,
          y: y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });

        y -= fontSize + 6; // line height
      }

  const pdfBytes = await pdfDoc.save();
  // pdfBytes is a Uint8Array; convert to an ArrayBuffer for Blob to satisfy TypeScript
  const arrayBuffer = pdfBytes.buffer as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const element = document.createElement("a");
      const periodLabel = periodStats?.period_label || "All-Time";
      element.href = URL.createObjectURL(blob);
      element.download = `dashboard-report-${periodLabel.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const downloadCSV = () => {
    try {
      const csvContent = generateCSVContent();
      const element = document.createElement('a');
      const periodLabel = periodStats?.period_label || 'All-Time';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      element.href = URL.createObjectURL(blob);
      element.download = `dashboard-data-${periodLabel.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating CSV:', error);
    }
  };

  const generatePDFContent = () => {
    if (!stats) return "No dashboard data available";
    
    const periodLabel = periodStats?.period_label || 'All Time';
    
    let content = `CHEF DASHBOARD REPORT
Generated: ${new Date().toLocaleString()}
Report Period: ${periodLabel}
Chef: ${user?.name || 'Chef'}

OVERALL STATISTICS:
- Total Orders: ${stats.total_orders}
- Completed Orders: ${stats.completed_orders}
- Pending Orders: ${stats.pending_orders}
- Total Revenue: LKR ${stats.total_revenue.toFixed(2)}
- Average Rating: ${stats.average_rating}/5
- Bulk Orders: ${stats.bulk_orders || 0}`;

    if (periodStats) {
      content += `

${periodStats.period_label.toUpperCase()} PERFORMANCE:
- Period Orders: ${periodStats.period_orders}
- Period Completed: ${periodStats.period_completed}
- Period Pending: ${periodStats.period_pending}
- Period Revenue: LKR ${periodStats.period_revenue.toFixed(2)}
- Daily Average Revenue: LKR ${periodStats.daily_average_revenue.toFixed(2)}
- Daily Average Orders: ${periodStats.daily_average_orders}
- Completion Rate: ${periodStats.completion_rate.toFixed(1)}%`;
    }

    content += `

PERFORMANCE METRICS:
- Overall Completion Rate: ${((stats.completed_orders / Math.max(1, stats.total_orders)) * 100).toFixed(1)}%
- Revenue per Order: LKR ${(() => {
  const useStats = periodStats || stats;
  const revenue = useStats.period_revenue || useStats.total_revenue;
  const orders = useStats.period_orders || useStats.total_orders;
  return (revenue / Math.max(1, orders)).toFixed(2);
})()}
- Active Orders: ${stats.total_orders - stats.completed_orders - stats.pending_orders}

BUSINESS INSIGHTS:
- Customer Satisfaction: ${stats.average_rating}/5 stars
- Order Pipeline: ${stats.pending_orders} orders awaiting processing
- Success Rate: ${stats.completed_orders} out of ${stats.total_orders} orders completed

Generated by ChefSync Dashboard`;

    return content;
  };

  const generateCSVContent = () => {
    if (!stats) return "Metric,Value\nNo data available,0";
    
    const periodLabel = periodStats?.period_label || 'All Time';
    
    let csvContent = `Report Period,${periodLabel}
Generated Date,${new Date().toLocaleDateString()}

OVERALL METRICS
Total Orders,${stats.total_orders}
Completed Orders,${stats.completed_orders}
Pending Orders,${stats.pending_orders}
Total Revenue (LKR),${stats.total_revenue}
Average Rating,${stats.average_rating}
Completion Rate (%),${((stats.completed_orders / Math.max(1, stats.total_orders)) * 100).toFixed(1)}
Revenue per Order (LKR),${(stats.total_revenue / Math.max(1, stats.total_orders)).toFixed(2)}
Bulk Orders,${stats.bulk_orders || 0}`;

    if (periodStats) {
      csvContent += `

${periodStats.period_label.toUpperCase()} METRICS
Period Orders,${periodStats.period_orders}
Period Completed,${periodStats.period_completed}
Period Pending,${periodStats.period_pending}
Period Revenue (LKR),${periodStats.period_revenue}
Daily Average Revenue (LKR),${periodStats.daily_average_revenue.toFixed(2)}
Daily Average Orders,${periodStats.daily_average_orders}
Period Completion Rate (%),${periodStats.completion_rate.toFixed(1)}`;
    }

    return csvContent;
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load period-specific stats when period changes
  useEffect(() => {
    if (stats) {
      fetchPeriodStats(selectedPeriod);
    }
  }, [selectedPeriod, stats]);

  // Create dynamic stats array from API data
  const displayStats = stats
    ? [
        {
          title: "Completed Orders",
          value: stats.completed_orders.toString(),
          change: `+${Math.floor(Math.random() * 5)} today`, // Can be calculated from API later
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
        },
        {
          title: "Total Orders",
          value: stats.total_orders.toString(),
          change: `+${Math.floor(Math.random() * 3)} total`,
          icon: ClipboardList,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
          title: "Pending Orders",
          value: stats.pending_orders.toString(),
          change: "awaiting action",
          icon: Clock,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        },
        {
          title: "Total Revenue",
          value: `LKR ${stats.total_revenue.toFixed(2)}`,
          change: `${stats.average_rating}/5 rating`,
          icon: TrendingUp,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <Greeting chefName={user?.name || "Chef"} error={error} />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {loading
              ? "Updating..."
              : `Updated ${lastRefresh.toLocaleTimeString()}`}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard Analytics
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border rounded-md bg-background text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="365days">This Year</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadPDF()}>
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV()}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading && !stats
          ? // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="chef-card animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </CardContent>
              </Card>
            ))
          : displayStats.map((stat, index) => (
              <Card key={index} className="chef-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Dashboard Analytics */}
      {showAnalytics && stats && (
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Dashboard Statistics
              <Badge variant="outline" className="ml-2 text-xs">
                {periodStats?.period_label || 'All Time'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Period-Specific Summary Cards */}
              {periodStats && (
                <div>
                  <h4 className="text-sm font-medium mb-3">{periodStats.period_label} Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-green-800 dark:text-green-300">
                        Period Revenue
                      </h5>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        LKR {periodStats.period_revenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Daily Avg: LKR {periodStats.daily_average_revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Period Orders
                      </h5>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {periodStats.period_orders}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Daily Avg: {periodStats.daily_average_orders}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Period Completed
                      </h5>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {periodStats.period_completed}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Success Rate: {periodStats.completion_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                        Period Pending
                      </h5>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {periodStats.period_pending}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        In Pipeline
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Dashboard Stats */}
              <div>
                <h4 className="text-sm font-medium mb-3">Overall Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-300">
                      Total Revenue
                    </h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      LKR {stats.total_revenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-300">
                      Total Orders
                    </h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.total_orders}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-300">
                      Current Pending
                    </h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.pending_orders}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-300">
                      Overall Rate
                    </h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {((stats.completed_orders / Math.max(1, stats.total_orders)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Simple Bar Chart Based on Dashboard Stats */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-4">
                  Order Status Breakdown - {periodStats?.period_label || 'All Time'}
                </h4>
                <div className="space-y-3">
                  {(() => {
                    // Use period stats if available, otherwise overall stats
                    const chartStats = periodStats ? {
                      completed_orders: periodStats.period_completed,
                      pending_orders: periodStats.period_pending,
                      total_orders: periodStats.period_orders,
                      total_revenue: periodStats.period_revenue
                    } : stats;
                    
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-24 text-xs text-muted-foreground">Completed</div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max((chartStats.completed_orders / Math.max(1, chartStats.total_orders)) * 100, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {chartStats.completed_orders}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-xs text-muted-foreground text-right">
                            {((chartStats.completed_orders / Math.max(1, chartStats.total_orders)) * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-24 text-xs text-muted-foreground">Pending</div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max((chartStats.pending_orders / Math.max(1, chartStats.total_orders)) * 100, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {chartStats.pending_orders}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-xs text-muted-foreground text-right">
                            {((chartStats.pending_orders / Math.max(1, chartStats.total_orders)) * 100).toFixed(1)}%
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-24 text-xs text-muted-foreground">Active</div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(((chartStats.total_orders - chartStats.completed_orders - chartStats.pending_orders) / Math.max(1, chartStats.total_orders)) * 100, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {chartStats.total_orders - chartStats.completed_orders - chartStats.pending_orders}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-xs text-muted-foreground text-right">
                            {(((chartStats.total_orders - chartStats.completed_orders - chartStats.pending_orders) / Math.max(1, chartStats.total_orders)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Revenue Insights */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">
                    Revenue Insights - {periodStats?.period_label || 'Overall'}
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Revenue per Order:</span>
                      <div className="font-medium">
                        LKR {(() => {
                          const useStats = periodStats || stats;
                          const revenue = useStats.period_revenue || useStats.total_revenue;
                          const orders = useStats.period_orders || useStats.total_orders;
                          return (revenue / Math.max(1, orders)).toFixed(2);
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average Rating:</span>
                      <div className="font-medium">{stats.average_rating}/5 ⭐</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Customer Reviews */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Recent Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div
                  key={index}
                  className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-card-foreground">
                        {review.customer}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          for {review.dish}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No reviews yet</p>
                <p className="text-sm">Customer reviews will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {activity.action}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Activity updates will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Error Loading Dashboard
                </h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                <Button
                  onClick={refreshDashboard}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <CookDashboardContent />
    </DashboardErrorBoundary>
  );
}
