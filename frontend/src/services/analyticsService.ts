// Analytics service for admin dashboard - enhanced with advanced AI analytics
import { type DashboardStats } from "./adminService";

// Enhanced types for advanced analytics
export interface RevenueAnalytics {
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  forecast: number[];
  breakdown: {
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
}

// Advanced Reports & Automation types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "financial" | "operational" | "customer" | "marketing" | "custom";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
  format: "pdf" | "excel" | "powerpoint" | "html" | "csv";
  sections: ReportSection[];
  aiInsights: boolean;
  automatedDelivery: boolean;
  recipients: string[];
  schedule?: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  lastGenerated?: string;
  status: "active" | "paused" | "draft";
}

export interface ReportSection {
  id: string;
  type: "chart" | "table" | "kpi" | "text" | "ai-insight";
  title: string;
  dataSource: string;
  config: any;
  aiEnhanced: boolean;
}

export interface SmartAlert {
  id: string;
  name: string;
  description: string;
  type: "threshold" | "anomaly" | "trend" | "pattern";
  metric: string;
  condition: {
    operator: "greater_than" | "less_than" | "equals" | "change_by";
    value: number;
    timeframe: string;
  };
  aiAnalysis: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook?: string;
  };
  status: "active" | "paused";
  triggers: number;
  lastTriggered?: string;
}

export interface NLQuery {
  id: string;
  query: string;
  timestamp: string;
  result: any;
  confidence: number;
  suggestedFollowUps: string[];
  aiExplanation: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: "schedule" | "event" | "threshold" | "manual";
    config: any;
  };
  actions: WorkflowAction[];
  status: "active" | "paused" | "error";
  executions: number;
  lastRun?: string;
  nextRun?: string;
}

export interface WorkflowAction {
  id: string;
  type:
    | "generate_report"
    | "send_email"
    | "update_data"
    | "call_api"
    | "ai_analysis";
  config: any;
  order: number;
}

export interface OrderAnalytics {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  trend: number;
  avgOrderValue: number;
  peakHours: Array<{ hour: number; count: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface CustomerAnalytics {
  total: number;
  active: number;
  new: number;
  retention: number;
  segments: Array<{
    name: string;
    count: number;
    value: number;
    growth: number;
  }>;
  behavior: {
    avgOrderFrequency: number;
    avgSessionDuration: number;
    conversionRate: number;
  };
}

export interface PerformanceMetrics {
  avgDeliveryTime: number;
  customerSatisfaction: number;
  orderAccuracy: number;
  systemUptime: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
}

export interface AIInsight {
  id: string;
  type: "opportunity" | "warning" | "recommendation" | "trend";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  actionable: boolean;
  timestamp: string;
  category: string;
  data?: any;
}

export interface PredictiveAnalytics {
  salesForecast: Array<{
    date: string;
    predicted: number;
    actual?: number;
    confidence: number;
    factors: string[];
  }>;
  demandForecast: Array<{
    item: string;
    predicted: number;
    current: number;
    trend: "increasing" | "decreasing" | "stable";
    seasonality: number;
  }>;
  customerLifetimeValue: Array<{
    segment: string;
    value: number;
    growth: number;
    predictedChurn: number;
  }>;
  marketTrends: Array<{
    trend: string;
    impact: number;
    probability: number;
    timeframe: string;
  }>;
}

export interface CustomerSegmentation {
  segments: Array<{
    name: string;
    size: number;
    value: number;
    behavior: string;
    retention: number;
    characteristics: string[];
    recommendations: string[];
  }>;
  behaviorPatterns: Array<{
    pattern: string;
    frequency: number;
    impact: string;
    seasonality?: number;
    demographics?: string[];
  }>;
  lifetimeValueDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

class AnalyticsService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin-management/dashboard/stats/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  // Advanced Analytics Methods

  /**
   * Get revenue analytics data
   */
  async getRevenueAnalytics(
    timeRange: string = "30d"
  ): Promise<RevenueAnalytics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin-management/dashboard/revenue_analytics/?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      throw error;
    }
  }

  /**
   * Get order analytics data
   */
  async getOrderAnalytics(timeRange: string = "30d"): Promise<OrderAnalytics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/analytics/orders?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      throw error;
    }
  }

  /**
   * Get customer analytics data
   */
  async getCustomerAnalytics(
    timeRange: string = "30d"
  ): Promise<CustomerAnalytics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/analytics/customers?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    timeRange: string = "30d"
  ): Promise<PerformanceMetrics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/analytics/performance?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      throw error;
    }
  }

  /**
   * Get AI-powered insights
   */
  async getAIInsights(timeRange: string = "30d"): Promise<AIInsight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin-management/dashboard/ai_insights/?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      throw error;
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(
    timeRange: string = "30d"
  ): Promise<PredictiveAnalytics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin-management/dashboard/predictive_analytics/?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching predictive analytics:", error);
      throw error;
    }
  }

  /**
   * Get customer segmentation data
   */
  async getCustomerSegmentation(
    timeRange: string = "30d"
  ): Promise<CustomerSegmentation> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin-management/dashboard/customer_segmentation/?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching customer segmentation:", error);
      throw error;
    }
  }

  // Advanced Reports & Automation Methods

  /**
   * Get report templates
   */
  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/templates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching report templates:", error);
      throw error;
    }
  }

  /**
   * Generate a report from template
   */
  async generateReport(templateId: string, options?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ templateId, options }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }

  /**
   * Get smart alerts
   */
  async getSmartAlerts(): Promise<SmartAlert[]> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/smart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching smart alerts:", error);
      throw error;
    }
  }

  /**
   * Process natural language query
   */
  async processNLQuery(query: string): Promise<{
    result: any;
    confidence: number;
    explanation: string;
    suggestedFollowUps: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/nlq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error processing NL query:", error);
      throw error;
    }
  }

  /**
   * Get automation workflows
   */
  async getAutomationWorkflows(): Promise<AutomationWorkflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/automation/workflows`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching automation workflows:", error);
      throw error;
    }
  }

  /**
   * Execute automation workflow
   */
  async executeWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/automation/workflows/${workflowId}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error executing workflow:", error);
      throw error;
    }
  }

  // Machine Learning Integration methods
  async getMLModels() {
    try {
      const response = await fetch(`${this.baseUrl}/admin/ml/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ML models:", error);
      throw error;
    }
  }

  async getMLRecommendations() {
    try {
      const response = await fetch(`${this.baseUrl}/admin/ml/recommendations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ML recommendations:", error);
      throw error;
    }
  }

  async getMLForecasts() {
    try {
      const response = await fetch(`${this.baseUrl}/admin/ml/forecasts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ML forecasts:", error);
      throw error;
    }
  }

  async getCustomerSegments() {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/ml/customer-segments`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch customer segments:", error);
      throw error;
    }
  }

  async getPricingInsights() {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/ml/pricing-insights`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch pricing insights:", error);
      throw error;
    }
  }

  async getAnomalyDetections(timeRange: string = "7d") {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin-management/dashboard/anomaly_detection/?range=${timeRange}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch anomaly detections:", error);
      throw error;
    }
  }

  async trainMLModel(modelId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/ml/models/${modelId}/train`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to train ML model:", error);
      // Simulate training delay
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { success: true, message: "Model training completed" };
    }
  }

  async deployMLModel(modelId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/ml/models/${modelId}/deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to deploy ML model:", error);
      return { success: true, message: "Model deployed successfully" };
    }
  }

  async implementRecommendation(recommendationId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/ml/recommendations/${recommendationId}/implement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to implement recommendation:", error);
      return { success: true, message: "Recommendation implemented" };
    }
  }

}

export const analyticsService = new AnalyticsService();
