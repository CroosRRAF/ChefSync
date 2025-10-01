/**
 * AI Insights Page
 * Admin interface for AI/ML features and insights
 */

import React, { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  aiService,
  type SalesForecastResponse,
  type AnomalyDetectionResponse,
  type ProductRecommendationsResponse,
  type CustomerInsightsResponse,
  type AIDashboardSummary,
} from "@/services/aiService";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Calendar,
  DollarSign,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Target,
  Star,
  ShoppingCart,
} from "lucide-react";

/**
 * AI Insights Component
 */
const AIInsights: React.FC = () => {
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [dashboardSummary, setDashboardSummary] = useState<AIDashboardSummary | null>(null);
  const [salesForecast, setSalesForecast] = useState<SalesForecastResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyDetectionResponse | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendationsResponse | null>(null);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsightsResponse | null>(null);

  // Filters
  const [forecastDays, setForecastDays] = useState(30);
  const [anomalyDays, setAnomalyDays] = useState(30);
  const [recommendationLimit, setRecommendationLimit] = useState(10);

  // Dialog states
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [isAnomalyDialogOpen, setIsAnomalyDialogOpen] = useState(false);

  /**
   * Load AI dashboard summary
   */
  const loadDashboardSummary = useCallback(async () => {
    try {
      const summary = await aiService.getDashboardSummary();
      setDashboardSummary(summary);
    } catch (error) {
      console.error("Error loading dashboard summary:", error);
    }
  }, []);

  /**
   * Load sales forecast
   */
  const loadSalesForecast = useCallback(async (days: number = 30) => {
    try {
      const forecast = await aiService.getSalesForecast(days);
      setSalesForecast(forecast);
    } catch (error) {
      console.error("Error loading sales forecast:", error);
      toast({
        title: "Error",
        description: "Failed to load sales forecast",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Load anomaly detection
   */
  const loadAnomalyDetection = useCallback(async (days: number = 30) => {
    try {
      const anomalies = await aiService.detectAnomalies(days);
      setAnomalyData(anomalies);
    } catch (error) {
      console.error("Error loading anomaly detection:", error);
      toast({
        title: "Error",
        description: "Failed to load anomaly detection",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Load product recommendations
   */
  const loadProductRecommendations = useCallback(async (limit: number = 10) => {
    try {
      const recs = await aiService.getProductRecommendations(limit);
      setRecommendations(recs);
    } catch (error) {
      console.error("Error loading product recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load product recommendations",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Load customer insights
   */
  const loadCustomerInsights = useCallback(async () => {
    try {
      const insights = await aiService.getCustomerInsights();
      setCustomerInsights(insights);
    } catch (error) {
      console.error("Error loading customer insights:", error);
      toast({
        title: "Error",
        description: "Failed to load customer insights",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Refresh all data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadDashboardSummary(),
        loadSalesForecast(forecastDays),
        loadAnomalyDetection(anomalyDays),
        loadProductRecommendations(recommendationLimit),
        loadCustomerInsights(),
      ]);
      toast({
        title: "Refreshed",
        description: "AI insights updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh some data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * View anomaly details
   */
  const handleViewAnomaly = (anomaly: any) => {
    setSelectedAnomaly(anomaly);
    setIsAnomalyDialogOpen(true);
  };

  /**
   * Get severity badge variant
   */
  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "outline";
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return aiService.formatCurrency(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        loadDashboardSummary(),
        loadSalesForecast(forecastDays),
        loadAnomalyDetection(anomalyDays),
        loadProductRecommendations(recommendationLimit),
        loadCustomerInsights(),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [loadDashboardSummary, loadSalesForecast, loadAnomalyDetection, loadProductRecommendations, loadCustomerInsights, forecastDays, anomalyDays, recommendationLimit]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Intelligent analytics, predictions, and recommendations
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* AI Status Banner */}
      {dashboardSummary && (
        <Card className={dashboardSummary.ai_service_status ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${dashboardSummary.ai_service_status ? "text-green-600" : "text-yellow-600"}`} />
              <span className="font-medium">
                AI Service: {dashboardSummary.ai_service_status ? "Active" : "Limited Mode"}
              </span>
              {!dashboardSummary.ai_service_status && (
                <span className="text-sm text-muted-foreground">
                  (Basic features available, advanced AI features require configuration)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="forecast">Sales Forecast</TabsTrigger>
          <TabsTrigger value="anomalies">
            Anomalies
            {anomalyData && anomalyData.total_anomalies > 0 && (
              <Badge variant="destructive" className="ml-2">
                {anomalyData.total_anomalies}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dashboardSummary ? (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Next 7 Days Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dashboardSummary.sales_forecast.next_7_days_revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {aiService.formatPercentage(dashboardSummary.sales_forecast.confidence)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardSummary.anomaly_detection.total_anomalies}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardSummary.anomaly_detection.high_severity_count} high severity
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Products</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardSummary.product_recommendations.total_recommendations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommendations available
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardSummary.customer_insights.total_customers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(dashboardSummary.customer_insights.total_revenue)} total revenue
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Alerts */}
              {dashboardSummary.anomaly_detection.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Recent Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardSummary.anomaly_detection.alerts.slice(0, 3).map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityVariant(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-sm">{alert.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Products Preview */}
              {dashboardSummary.product_recommendations.top_products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Top Recommended Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardSummary.product_recommendations.top_products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{aiService.getRecommendationTypeIcon(product.type)}</span>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">by {product.cook_name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(product.total_revenue)}</div>
                            <div className="text-sm text-muted-foreground">{product.total_orders} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No AI data available</p>
            </div>
          )}
        </TabsContent>

        {/* Sales Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div>
                  <Label htmlFor="forecast-days">Forecast Days</Label>
                  <Select value={forecastDays.toString()} onValueChange={(value) => setForecastDays(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => loadSalesForecast(forecastDays)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Forecast
                </Button>
              </div>

              {salesForecast ? (
                <div className="space-y-4">
                  {/* Forecast Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(salesForecast.total_forecast)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Forecasted Revenue</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {formatCurrency(salesForecast.avg_daily_forecast)}
                        </div>
                        <p className="text-sm text-muted-foreground">Average Daily Revenue</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {aiService.formatPercentage(salesForecast.confidence)}
                        </div>
                        <p className="text-sm text-muted-foreground">Confidence Level</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Forecast Chart Placeholder */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-gray-500">Forecast chart visualization</p>
                          <p className="text-sm text-gray-400">(Chart component to be implemented)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Forecast Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {salesForecast.insights.map((insight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No forecast data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div>
                  <Label htmlFor="anomaly-days">Analysis Period</Label>
                  <Select value={anomalyDays.toString()} onValueChange={(value) => setAnomalyDays(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => loadAnomalyDetection(anomalyDays)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Analyze
                </Button>
              </div>

              {anomalyData ? (
                <div className="space-y-4">
                  {/* Anomaly Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {anomalyData.total_anomalies}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Anomalies</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">
                          {anomalyData.high_severity_count}
                        </div>
                        <p className="text-sm text-muted-foreground">High Severity</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {anomalyDays - anomalyData.total_anomalies}
                        </div>
                        <p className="text-sm text-muted-foreground">Normal Days</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Anomalies List */}
                  {anomalyData.anomalies.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Detected Anomalies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {anomalyData.anomalies.map((anomaly, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <Badge variant={getSeverityVariant(anomaly.severity)}>
                                  {anomaly.severity}
                                </Badge>
                                <div>
                                  <div className="font-medium">{anomaly.type.replace('_', ' ').toUpperCase()}</div>
                                  <div className="text-sm text-muted-foreground">{formatDate(anomaly.date)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(anomaly.value)}</div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewAnomaly(anomaly)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold text-green-600">No Anomalies Detected</h3>
                        <p className="text-muted-foreground">Your system is operating normally</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {anomalyData.insights.map((insight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-blue-500" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No anomaly data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Product Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div>
                  <Label htmlFor="recommendation-limit">Number of Recommendations</Label>
                  <Select value={recommendationLimit.toString()} onValueChange={(value) => setRecommendationLimit(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => loadProductRecommendations(recommendationLimit)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Recommendations
                </Button>
              </div>

              {recommendations ? (
                <div className="space-y-4">
                  {/* Recommendations List */}
                  <div className="grid gap-4">
                    {recommendations.recommendations.map((product, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">
                                {aiService.getRecommendationTypeIcon(product.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{product.name}</h3>
                                  <Badge className={aiService.getRecommendationTypeColor(product.type)}>
                                    {product.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">by {product.cook_name}</p>
                                <p className="text-sm text-muted-foreground">{product.reason}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{formatCurrency(product.total_revenue)}</div>
                              <div className="text-sm text-muted-foreground">{product.total_orders} orders</div>
                              <div className="text-sm text-muted-foreground">Score: {product.recommendation_score}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendation Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.insights.map((insight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No recommendations available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Insights Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerInsights ? (
                <div className="space-y-4">
                  {/* Customer Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {customerInsights.total_customers}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Customers</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(customerInsights.total_revenue)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {formatCurrency(customerInsights.avg_order_value)}
                        </div>
                        <p className="text-sm text-muted-foreground">Average Order Value</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Customer Segments */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {customerInsights.segments.map((segment, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{segment.name}</h3>
                              <Badge variant="outline">{segment.count} customers</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">{segment.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {customerInsights.insights.map((insight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No customer insights available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Anomaly Details Dialog */}
      <Dialog open={isAnomalyDialogOpen} onOpenChange={setIsAnomalyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Anomaly Details</DialogTitle>
            <DialogDescription>
              Detailed information about this anomaly
            </DialogDescription>
          </DialogHeader>
          {selectedAnomaly && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedAnomaly.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p>{formatDate(selectedAnomaly.date)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Value</Label>
                  <p className="text-lg font-bold">{formatCurrency(selectedAnomaly.value)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Threshold</Label>
                  <p>{formatCurrency(selectedAnomaly.threshold)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Severity</Label>
                  <Badge variant={getSeverityVariant(selectedAnomaly.severity)}>
                    {selectedAnomaly.severity}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p>{selectedAnomaly.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIInsights;
