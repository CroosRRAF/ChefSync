import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { analyticsService } from "@/services/analyticsService";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  DollarSign,
  Download,
  Eye,
  Lightbulb,
  Play,
  RefreshCw,
  Rocket,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface MLModel {
  id: string;
  name: string;
  type:
    | "recommendation"
    | "forecasting"
    | "classification"
    | "clustering"
    | "anomaly";
  status: "training" | "ready" | "deploying" | "error";
  accuracy: number;
  lastTrained: string;
  description: string;
  features: string[];
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
    trainingTime: string;
  };
}

interface Recommendation {
  id: string;
  type: "product" | "customer" | "pricing" | "marketing";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  category: string;
  data: any;
  actions: string[];
}

interface Forecast {
  id: string;
  metric: string;
  timeframe: string;
  predicted: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: string[];
  historical: Array<{ date: string; value: number }>;
  predicted_values: Array<{ date: string; value: number }>;
}

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  characteristics: string[];
  value: number;
  behavior: {
    avgOrderValue: number;
    frequency: number;
    churnRate: number;
    satisfaction: number;
  };
  recommendations: string[];
}

interface PricingInsight {
  id: string;
  product: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  expectedImpact: {
    revenueChange: number;
    demandChange: number;
    competitiveness: string;
  };
  competitors: Array<{ name: string; price: number }>;
}

interface AnomalyDetection {
  id: string;
  type: "revenue" | "orders" | "customers" | "inventory";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detected: string;
  pattern: string;
  suggestion: string;
  data: {
    expected: number;
    actual: number;
    deviation: number;
  };
}

const MachineLearningIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [mlModels, setMlModels] = useState<MLModel[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>(
    []
  );
  const [pricingInsights, setPricingInsights] = useState<PricingInsight[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    loadData();
    if (autoRefresh) {
      const interval = setInterval(loadData, 300000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        modelsData,
        recommendationsData,
        forecastsData,
        segmentsData,
        pricingData,
        anomaliesData,
      ] = await Promise.all([
        analyticsService.getMLModels(),
        analyticsService.getMLRecommendations(),
        analyticsService.getMLForecasts(),
        analyticsService.getCustomerSegments(),
        analyticsService.getPricingInsights(),
        analyticsService.getAnomalyDetections(),
      ]);

      setMlModels(modelsData);
      setRecommendations(recommendationsData);
      setForecasts(forecastsData);
      setCustomerSegments(segmentsData);
      setPricingInsights(pricingData);
      setAnomalies(anomaliesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load ML data. Using cached data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trainModel = async (modelId: string) => {
    setIsLoading(true);
    setTrainingProgress(0);

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      await analyticsService.trainMLModel(modelId);

      toast({
        title: "Model Training",
        description: "Model training completed successfully.",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Training Error",
        description: "Failed to train model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTrainingProgress(0);
    }
  };

  const deployModel = async (modelId: string) => {
    try {
      await analyticsService.deployMLModel(modelId);
      toast({
        title: "Model Deployed",
        description: "Model has been deployed successfully.",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: "Failed to deploy model.",
        variant: "destructive",
      });
    }
  };

  const implementRecommendation = async (recommendationId: string) => {
    try {
      await analyticsService.implementRecommendation(recommendationId);
      toast({
        title: "Recommendation Implemented",
        description: "The recommendation has been implemented successfully.",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Implementation Error",
        description: "Failed to implement recommendation.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "training":
        return "bg-yellow-500";
      case "deploying":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Machine Learning Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Advanced AI models for intelligent business insights and automation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ML Models Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Models
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mlModels.filter((m) => m.status === "ready").length}
                </p>
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Accuracy
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(
                    mlModels.reduce((acc, m) => acc + m.accuracy, 0) /
                      mlModels.length || 0
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recommendations
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {recommendations.length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Anomalies
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    anomalies.filter(
                      (a) => a.severity === "high" || a.severity === "critical"
                    ).length
                  }
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger
            value="customer-behavior"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Customer Behavior
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing Intelligence
          </TabsTrigger>
          <TabsTrigger value="anomaly" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Anomaly Detection
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ML Models
          </TabsTrigger>
        </TabsList>

        {/* Recommendation Engine */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {rec.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {rec.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(rec.impact)}>
                            {rec.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {rec.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {rec.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <Label className="text-sm font-medium">
                          Suggested Actions:
                        </Label>
                        <ul className="list-disc list-inside space-y-1">
                          {rec.actions.map((action, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400"
                            >
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Progress value={rec.confidence} className="w-20" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {rec.confidence}%
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => implementRecommendation(rec.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Implement
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demand Forecasting */}
        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Demand Forecasting & Predictive Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {forecasts.map((forecast) => (
                  <Card
                    key={forecast.id}
                    className="border-l-4 border-l-purple-500"
                  >
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {forecast.metric}
                            </h3>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <TrendingUp className="h-3 w-3" />
                              {forecast.trend}
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">
                                Predicted Value
                              </Label>
                              <p className="text-2xl font-bold text-purple-600">
                                {forecast.predicted.toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">
                                Confidence Level
                              </Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress
                                  value={forecast.confidence}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium">
                                  {forecast.confidence}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">
                                Key Factors
                              </Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {forecast.factors.map((factor, index) => (
                                  <Badge key={index} variant="secondary">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Trend Analysis
                          </Label>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="space-y-2">
                              {forecast.predicted_values
                                .slice(-5)
                                .map((point, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {point.date}
                                    </span>
                                    <span className="text-sm font-medium">
                                      {point.value.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Behavior Prediction */}
        <TabsContent value="customer-behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Behavior Analysis & Segmentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {customerSegments.map((segment) => (
                  <Card
                    key={segment.id}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {segment.name}
                        </h3>
                        <Badge variant="outline">
                          {segment.size.toLocaleString()} customers
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            ${segment.behavior.avgOrderValue}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Avg Order Value
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {segment.behavior.frequency}x
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Monthly Frequency
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {segment.behavior.churnRate}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Churn Rate
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {segment.behavior.satisfaction}/5
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Satisfaction
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">
                            Characteristics
                          </Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {segment.characteristics.map((char, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            AI Recommendations
                          </Label>
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            {segment.recommendations.map((rec, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 dark:text-gray-400"
                              >
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Intelligence */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                AI-Powered Pricing Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pricingInsights.map((insight) => (
                  <Card
                    key={insight.id}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {insight.product}
                          </h3>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Current Price
                              </span>
                              <span className="text-lg font-semibold">
                                ${insight.currentPrice}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Suggested Price
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                ${insight.suggestedPrice}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Confidence
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={insight.confidence}
                                  className="w-16"
                                />
                                <span className="text-sm font-medium">
                                  {insight.confidence}%
                                </span>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <Label className="text-sm font-medium">
                                AI Reasoning
                              </Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {insight.reasoning}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            Expected Impact
                          </Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Revenue Change
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  insight.expectedImpact.revenueChange > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {insight.expectedImpact.revenueChange > 0
                                  ? "+"
                                  : ""}
                                {insight.expectedImpact.revenueChange}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Demand Change
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  insight.expectedImpact.demandChange > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {insight.expectedImpact.demandChange > 0
                                  ? "+"
                                  : ""}
                                {insight.expectedImpact.demandChange}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Competitiveness
                              </span>
                              <Badge variant="outline">
                                {insight.expectedImpact.competitiveness}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label className="text-sm font-medium mb-2 block">
                              Competitor Analysis
                            </Label>
                            <div className="space-y-2">
                              {insight.competitors.map((comp, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {comp.name}
                                  </span>
                                  <span className="text-sm font-medium">
                                    ${comp.price}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Detection */}
        <TabsContent value="anomaly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Real-time Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <Card
                    key={anomaly.id}
                    className={`border-l-4 ${
                      anomaly.severity === "critical"
                        ? "border-l-red-500"
                        : anomaly.severity === "high"
                        ? "border-l-orange-500"
                        : anomaly.severity === "medium"
                        ? "border-l-yellow-500"
                        : "border-l-blue-500"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {anomaly.type.toUpperCase()} Anomaly Detected
                            </h3>
                            <div
                              className={`w-3 h-3 rounded-full ${getSeverityColor(
                                anomaly.severity
                              )}`}
                            />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Detected: {anomaly.detected}
                          </p>
                        </div>
                        <Badge
                          className={`${
                            anomaly.severity === "critical"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : anomaly.severity === "high"
                              ? "bg-orange-100 text-orange-800 border-orange-200"
                              : anomaly.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                        >
                          {anomaly.severity} severity
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {anomaly.description}
                          </p>

                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm font-medium">
                                Pattern Detected
                              </Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {anomaly.pattern}
                              </p>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">
                                AI Suggestion
                              </Label>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {anomaly.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            Data Analysis
                          </Label>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Expected
                              </span>
                              <span className="text-sm font-medium">
                                {anomaly.data.expected.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Actual
                              </span>
                              <span className="text-sm font-medium text-red-600">
                                {anomaly.data.actual.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Deviation
                              </span>
                              <span className="text-sm font-bold text-red-600">
                                {anomaly.data.deviation > 0 ? "+" : ""}
                                {anomaly.data.deviation}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ML Models Management */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Machine Learning Models
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mlModels.map((model) => (
                      <Card key={model.id} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {model.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {model.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${getStatusColor(
                                  model.status
                                )}`}
                              />
                              <Badge variant="outline">{model.status}</Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">
                                {model.accuracy}%
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Accuracy
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">
                                {model.performance.precision}%
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Precision
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-purple-600">
                                {model.performance.recall}%
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Recall
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-orange-600">
                                {model.performance.f1Score}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                F1 Score
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Last trained: {model.lastTrained}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => trainModel(model.id)}
                                disabled={model.status === "training"}
                              >
                                {model.status === "training" ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    Training...
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Retrain
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deployModel(model.id)}
                                disabled={model.status !== "ready"}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Rocket className="h-4 w-4 mr-2" />
                                Deploy
                              </Button>
                            </div>
                          </div>

                          {model.status === "training" &&
                            trainingProgress > 0 && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm">
                                    Training Progress
                                  </Label>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {Math.round(trainingProgress)}%
                                  </span>
                                </div>
                                <Progress value={trainingProgress} />
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Model Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="model-select">Select Model</Label>
                      <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {mlModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="training-data">
                        Training Data Source
                      </Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="orders">Order History</SelectItem>
                          <SelectItem value="customers">
                            Customer Data
                          </SelectItem>
                          <SelectItem value="products">
                            Product Catalog
                          </SelectItem>
                          <SelectItem value="reviews">
                            Reviews & Ratings
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="validation-split">Validation Split</Label>
                      <Input
                        id="validation-split"
                        type="number"
                        placeholder="0.2"
                        min="0.1"
                        max="0.5"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="epochs">Training Epochs</Label>
                      <Input
                        id="epochs"
                        type="number"
                        placeholder="100"
                        min="10"
                        max="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Auto-Deploy</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="auto-deploy" />
                        <Label htmlFor="auto-deploy" className="text-sm">
                          Deploy automatically after training
                        </Label>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create New Model
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">94.2%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Overall Accuracy
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">2.3s</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Avg Response Time
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">1.2M</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Predictions Today
                      </p>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Metrics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MachineLearningIntegration;
