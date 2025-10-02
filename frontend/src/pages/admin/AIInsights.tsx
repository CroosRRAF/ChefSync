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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface AIServiceStatus {
  ai_model_available: boolean;
  pandas_available: boolean;
  google_ai_configured: boolean;
  service_ready: boolean;
  features: {
    sales_forecasting: boolean;
    anomaly_detection: boolean;
    product_recommendations: boolean;
    customer_insights: boolean;
    sentiment_analysis: boolean;
  };
}

interface BusinessInsights {
  sales_forecast: {
    forecast: Array<{
      date: string;
      predicted_revenue: number;
      confidence: number;
    }>;
    total_forecast: number;
    avg_daily_forecast: number;
    confidence: number;
  };
  anomalies: {
    anomalies: Array<{
      type: string;
      severity: string;
      description: string;
      date: string;
    }>;
    total_anomalies: number;
    high_severity_count: number;
  };
  product_recommendations: {
    recommendations: Array<{
      name: string;
      score: number;
      reason: string;
    }>;
    total_recommendations: number;
  };
  customer_insights: {
    segments: Array<{
      name: string;
      size: number;
      characteristics: string[];
    }>;
    total_customers: number;
    total_revenue: number;
    avg_order_value: number;
  };
  ai_summary: string;
}

interface AIRecommendations {
  recommendations: Array<{
    category: string;
    priority: string;
    title: string;
    description: string;
    action: string;
    impact: string;
  }>;
  total_count: number;
  filters: {
    category: string;
    priority: string;
  };
}

const AIInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "business" | "recommendations" | "status"
  >("overview");
  
  const [aiStatus, setAiStatus] = useState<AIServiceStatus | null>(null);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsights | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [includeForecast, setIncludeForecast] = useState(true);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCustomers, setIncludeCustomers] = useState(true);
  const [recommendationCategory, setRecommendationCategory] = useState("all");
  const [recommendationPriority, setRecommendationPriority] = useState("all");

  // Load AI Service Status
  const loadAIStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin-management/ai/service-status/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAiStatus(data.data);
    } catch (error) {
      console.error('Error loading AI status:', error);
      setError('Failed to load AI service status');
    }
  }, []);

  // Load Business Insights
  const loadBusinessInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        include_forecast: includeForecast.toString(),
        include_anomalies: includeAnomalies.toString(),
        include_products: includeProducts.toString(),
        include_customers: includeCustomers.toString(),
      });

      const response = await fetch(`/api/admin-management/ai/business-insights/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBusinessInsights(data.data.insights);
    } catch (error) {
      console.error('Error loading business insights:', error);
      setError('Failed to load business insights');
    } finally {
      setLoading(false);
    }
  }, [includeForecast, includeAnomalies, includeProducts, includeCustomers]);

  // Load AI Recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        category: recommendationCategory,
        priority: recommendationPriority,
      });

      const response = await fetch(`/api/admin-management/ai/recommendations/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Failed to load AI recommendations');
    }
  }, [recommendationCategory, recommendationPriority]);

  // Load data on component mount
  useEffect(() => {
    loadAIStatus();
  }, [loadAIStatus]);

  useEffect(() => {
    if (activeTab === 'business') {
      loadBusinessInsights();
    } else if (activeTab === 'recommendations') {
      loadRecommendations();
    }
  }, [activeTab, loadBusinessInsights, loadRecommendations]);

  // Render AI Status Tab
  const renderStatusTab = () => {
    if (!aiStatus) {
      return (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Service Status</h3>
          <p className="text-gray-500 mb-4">Loading AI service status...</p>
          <Button onClick={loadAIStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Service Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Service Ready</p>
                  <p className="text-sm text-gray-500">Overall AI service status</p>
                </div>
                <Badge variant={aiStatus.service_ready ? "default" : "destructive"}>
                  {aiStatus.service_ready ? "Ready" : "Not Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">AI Model</p>
                  <p className="text-sm text-gray-500">Google Gemini integration</p>
                </div>
                <Badge variant={aiStatus.ai_model_available ? "default" : "destructive"}>
                  {aiStatus.ai_model_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Data Analysis</p>
                  <p className="text-sm text-gray-500">Pandas & NumPy support</p>
                </div>
                <Badge variant={aiStatus.pandas_available ? "default" : "destructive"}>
                  {aiStatus.pandas_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">API Configuration</p>
                  <p className="text-sm text-gray-500">Google AI API key</p>
                </div>
                <Badge variant={aiStatus.google_ai_configured ? "default" : "destructive"}>
                  {aiStatus.google_ai_configured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Status */}
        <Card>
          <CardHeader>
            <CardTitle>Available Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(aiStatus.features).map(([feature, available]) => (
                <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium capitalize">
                      {feature.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge variant={available ? "default" : "secondary"}>
                    {available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Business Insights Tab
  const renderBusinessTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-600">Loading business insights...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Insights</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadBusinessInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    if (!businessInsights) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Business Insights</h3>
          <p className="text-gray-500 mb-4">No business insights available</p>
          <Button onClick={loadBusinessInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Insights
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="forecast"
                checked={includeForecast}
                onChange={(e) => setIncludeForecast(e.target.checked)}
              />
              <Label htmlFor="forecast">Sales Forecast</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anomalies"
                checked={includeAnomalies}
                onChange={(e) => setIncludeAnomalies(e.target.checked)}
              />
              <Label htmlFor="anomalies">Anomaly Detection</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="products"
                checked={includeProducts}
                onChange={(e) => setIncludeProducts(e.target.checked)}
              />
              <Label htmlFor="products">Product Recommendations</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customers"
                checked={includeCustomers}
                onChange={(e) => setIncludeCustomers(e.target.checked)}
              />
              <Label htmlFor="customers">Customer Insights</Label>
            </div>
          </div>
          <Button onClick={loadBusinessInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* AI Summary */}
        {businessInsights.ai_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {businessInsights.ai_summary}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales Forecast */}
        {includeForecast && businessInsights.sales_forecast && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    ${businessInsights.sales_forecast.total_forecast.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Forecast</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    ${businessInsights.sales_forecast.avg_daily_forecast.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Daily Average</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(businessInsights.sales_forecast.confidence * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomaly Detection */}
        {includeAnomalies && businessInsights.anomalies && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {businessInsights.anomalies.total_anomalies}
                  </p>
                  <p className="text-sm text-gray-600">Total Anomalies</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {businessInsights.anomalies.high_severity_count}
                  </p>
                  <p className="text-sm text-gray-600">High Severity</p>
                </div>
              </div>
              {businessInsights.anomalies.anomalies.length > 0 && (
                <div className="space-y-2">
                  {businessInsights.anomalies.anomalies.slice(0, 5).map((anomaly, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{anomaly.description}</p>
                        <p className="text-sm text-gray-500">{anomaly.type} • {anomaly.date}</p>
                      </div>
                      <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Product Recommendations */}
        {includeProducts && businessInsights.product_recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Product Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {businessInsights.product_recommendations.recommendations.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.reason}</p>
                    </div>
                    <Badge variant="outline">Score: {product.score}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Insights */}
        {includeCustomers && businessInsights.customer_insights && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {businessInsights.customer_insights.total_customers}
                  </p>
                  <p className="text-sm text-gray-600">Total Customers</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    ${businessInsights.customer_insights.total_revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    ${businessInsights.customer_insights.avg_order_value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
              </div>
              <div className="space-y-3">
                {businessInsights.customer_insights.segments.map((segment, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{segment.name}</h4>
                      <Badge variant="outline">{segment.size} customers</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {segment.characteristics.map((char, charIndex) => (
                        <Badge key={charIndex} variant="secondary" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render Recommendations Tab
  const renderRecommendationsTab = () => {
    if (!recommendations) {
      return (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Recommendations</h3>
          <p className="text-gray-500 mb-4">Loading AI recommendations...</p>
          <Button onClick={loadRecommendations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Recommendations
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={recommendationCategory} onValueChange={setRecommendationCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={recommendationPriority} onValueChange={setRecommendationPriority}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadRecommendations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          {recommendations.recommendations.map((rec, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">{rec.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm text-blue-600 font-medium">{rec.action}</p>
                    <p className="text-xs text-gray-500 mt-1">Impact: {rec.impact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600">AI-powered business intelligence and recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={aiStatus?.service_ready ? "default" : "destructive"}>
            {aiStatus?.service_ready ? "AI Ready" : "AI Unavailable"}
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="status">Service Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Service</p>
                    <p className="text-2xl font-bold">
                      {aiStatus?.service_ready ? "Ready" : "Offline"}
                    </p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Features</p>
                    <p className="text-2xl font-bold">
                      {aiStatus ? Object.values(aiStatus.features).filter(Boolean).length : 0}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recommendations</p>
                    <p className="text-2xl font-bold">
                      {recommendations?.total_count || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-sm font-bold">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business">
          {renderBusinessTab()}
        </TabsContent>

        <TabsContent value="recommendations">
          {renderRecommendationsTab()}
        </TabsContent>

        <TabsContent value="status">
          {renderStatusTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsights;