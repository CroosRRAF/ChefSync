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

// AI Reports & Automation types
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
      const response = await fetch(`${this.baseUrl}/dashboard/stats/`, {
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
      // Return mock data for development if admin service fails
      return this.getMockDashboardStats();
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
        `${this.baseUrl}/analytics/revenue?range=${timeRange}`,
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
      return this.getMockRevenueAnalytics(timeRange);
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
      return this.getMockOrderAnalytics(timeRange);
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
      return this.getMockCustomerAnalytics(timeRange);
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
      return this.getMockPerformanceMetrics();
    }
  }

  /**
   * Get AI-powered insights
   */
  async getAIInsights(timeRange: string = "30d"): Promise<AIInsight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/analytics/ai-insights?range=${timeRange}`,
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
      return this.getMockAIInsights();
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
        `${this.baseUrl}/analytics/predictions?range=${timeRange}`,
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
      return this.getMockPredictiveAnalytics();
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
        `${this.baseUrl}/analytics/segmentation?range=${timeRange}`,
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
      return this.getMockCustomerSegmentation();
    }
  }

  // AI Reports & Automation Methods

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
      return this.getMockReportTemplates();
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
      return this.getMockSmartAlerts();
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
      return this.getMockNLQueryResponse(query);
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
      return this.getMockAutomationWorkflows();
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

  // Mock data generators for development
  private getMockDashboardStats(): DashboardStats {
    return {
      total_users: 1247,
      active_users: 892,
      new_users_today: 12,
      new_users_this_week: 45,
      new_users_this_month: 156,
      user_growth: 12.5,

      total_chefs: 45,
      active_chefs: 38,
      pending_chef_approvals: 7,
      pending_user_approvals: 12,
      chef_growth: 8.2,

      total_orders: 2341,
      orders_today: 24,
      orders_this_week: 156,
      orders_this_month: 567,
      order_growth: 15.3,

      total_revenue: 45678.9,
      revenue_today: 1247.5,
      revenue_this_week: 8765.4,
      revenue_this_month: 23456.7,
      revenue_growth: 18.7,

      total_foods: 234,
      active_foods: 198,
      pending_food_approvals: 12,

      system_health_score: 85.5,
      active_sessions: 23,
      unread_notifications: 5,
      pending_backups: 0,
    };
  }

  private getMockRevenueAnalytics(timeRange: string): RevenueAnalytics {
    const baseRevenue = 145750;
    const previousRevenue = 132800;

    return {
      current: baseRevenue,
      previous: previousRevenue,
      trend: baseRevenue > previousRevenue ? "up" : "down",
      forecast: [150000, 155000, 162000, 158000, 165000, 172000],
      breakdown: {
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          amount: Math.floor(Math.random() * 8000) + 3000,
        })),
        weekly: Array.from({ length: 12 }, (_, i) => ({
          week: `Week ${i + 1}`,
          amount: Math.floor(Math.random() * 50000) + 25000,
        })),
        monthly: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleString("default", {
            month: "short",
          }),
          amount: Math.floor(Math.random() * 200000) + 100000,
        })),
      },
    };
  }

  private getMockOrderAnalytics(timeRange: string): OrderAnalytics {
    return {
      total: 2847,
      completed: 2654,
      pending: 156,
      cancelled: 37,
      trend: 12.5,
      avgOrderValue: 47.8,
      peakHours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 150) + 10,
      })),
      statusDistribution: [
        { status: "Completed", count: 2654, percentage: 93.2 },
        { status: "Pending", count: 156, percentage: 5.5 },
        { status: "Cancelled", count: 37, percentage: 1.3 },
      ],
    };
  }

  private getMockCustomerAnalytics(timeRange: string): CustomerAnalytics {
    return {
      total: 18493,
      active: 12847,
      new: 423,
      retention: 87.3,
      segments: [
        { name: "VIP Customers", count: 1245, value: 589000, growth: 15.3 },
        { name: "Regular Customers", count: 4876, value: 1240000, growth: 8.7 },
        { name: "New Customers", count: 2156, value: 340000, growth: 23.1 },
        { name: "Casual Customers", count: 4570, value: 290000, growth: -2.4 },
      ],
      behavior: {
        avgOrderFrequency: 2.3,
        avgSessionDuration: 8.5,
        conversionRate: 3.2,
      },
    };
  }

  private getMockPerformanceMetrics(): PerformanceMetrics {
    return {
      avgDeliveryTime: 32,
      customerSatisfaction: 4.7,
      orderAccuracy: 96.8,
      systemUptime: 99.9,
      errorRate: 0.02,
      responseTime: 245,
      throughput: 1847,
    };
  }

  private getMockAIInsights(): AIInsight[] {
    return [
      {
        id: "1",
        type: "opportunity",
        title: "Peak Ordering Pattern Detected",
        description:
          "AI analysis shows 23% increase in orders between 7-9 PM on weekends. Consider increasing kitchen capacity during these hours to capture additional revenue.",
        impact: "high",
        confidence: 0.94,
        actionable: true,
        timestamp: new Date().toISOString(),
        category: "Operations",
        data: {
          peakHours: ["19:00", "20:00", "21:00"],
          increasePercentage: 23,
          potentialRevenue: 15600,
        },
      },
      {
        id: "2",
        type: "warning",
        title: "Customer Churn Risk Alert",
        description:
          "147 customers show signs of reduced engagement. Targeted retention campaigns could prevent 78% churn probability.",
        impact: "medium",
        confidence: 0.87,
        actionable: true,
        timestamp: new Date().toISOString(),
        category: "Customer Retention",
        data: {
          riskCustomers: 147,
          churnProbability: 0.78,
          recommendedActions: [
            "Email campaign",
            "Loyalty rewards",
            "Personal outreach",
          ],
        },
      },
      {
        id: "3",
        type: "recommendation",
        title: "Menu Optimization Opportunity",
        description:
          "Items with <15% order frequency could be replaced with trending alternatives to increase revenue by 8-12%.",
        impact: "medium",
        confidence: 0.91,
        actionable: true,
        timestamp: new Date().toISOString(),
        category: "Menu Management",
        data: {
          lowPerformingItems: 8,
          potentialIncrease: { min: 8, max: 12 },
          suggestedReplacements: [
            "Plant-based options",
            "Healthy bowls",
            "Fusion dishes",
          ],
        },
      },
      {
        id: "4",
        type: "trend",
        title: "Seasonal Demand Shift",
        description:
          "Healthy options showing 34% growth trend. Consider expanding vegetarian and low-calorie menu items.",
        impact: "high",
        confidence: 0.89,
        actionable: true,
        timestamp: new Date().toISOString(),
        category: "Market Trends",
        data: {
          growthRate: 34,
          categories: ["Vegetarian", "Vegan", "Low-calorie", "Gluten-free"],
          marketDemand: "increasing",
        },
      },
    ];
  }

  private getMockPredictiveAnalytics(): PredictiveAnalytics {
    return {
      salesForecast: Array.from({ length: 8 }, (_, i) => ({
        date: `Week ${i + 1}`,
        predicted: Math.floor(Math.random() * 10000) + 35000 + i * 1000,
        actual: i < 4 ? Math.floor(Math.random() * 8000) + 34000 : undefined,
        confidence: 0.95 - i * 0.02,
        factors: ["seasonality", "marketing_campaigns", "weather", "events"],
      })),
      demandForecast: [
        {
          item: "Margherita Pizza",
          predicted: 156,
          current: 142,
          trend: "increasing",
          seasonality: 1.2,
        },
        {
          item: "Chicken Burger",
          predicted: 134,
          current: 156,
          trend: "decreasing",
          seasonality: 0.9,
        },
        {
          item: "Caesar Salad",
          predicted: 89,
          current: 67,
          trend: "increasing",
          seasonality: 1.4,
        },
        {
          item: "Pasta Carbonara",
          predicted: 98,
          current: 102,
          trend: "stable",
          seasonality: 1.0,
        },
        {
          item: "Veggie Bowl",
          predicted: 76,
          current: 54,
          trend: "increasing",
          seasonality: 1.6,
        },
      ],
      customerLifetimeValue: [
        {
          segment: "VIP Customers",
          value: 485,
          growth: 15.3,
          predictedChurn: 0.05,
        },
        {
          segment: "Regular Customers",
          value: 236,
          growth: 8.7,
          predictedChurn: 0.12,
        },
        {
          segment: "New Customers",
          value: 89,
          growth: 23.1,
          predictedChurn: 0.25,
        },
        {
          segment: "Casual Customers",
          value: 45,
          growth: -2.4,
          predictedChurn: 0.45,
        },
      ],
      marketTrends: [
        {
          trend: "Plant-based dining",
          impact: 0.15,
          probability: 0.92,
          timeframe: "6 months",
        },
        {
          trend: "Quick delivery preference",
          impact: 0.08,
          probability: 0.87,
          timeframe: "3 months",
        },
        {
          trend: "Premium ingredient demand",
          impact: 0.12,
          probability: 0.76,
          timeframe: "9 months",
        },
        {
          trend: "Contactless dining",
          impact: 0.06,
          probability: 0.69,
          timeframe: "12 months",
        },
      ],
    };
  }

  private getMockCustomerSegmentation(): CustomerSegmentation {
    return {
      segments: [
        {
          name: "Food Enthusiasts",
          size: 4200,
          value: 892000,
          behavior: "High frequency, premium orders",
          retention: 95.2,
          characteristics: [
            "High spending",
            "Frequent orders",
            "Premium preferences",
            "Early adopters",
          ],
          recommendations: [
            "Exclusive menu previews",
            "VIP events",
            "Premium tier benefits",
          ],
        },
        {
          name: "Family Diners",
          size: 7800,
          value: 1240000,
          behavior: "Large orders, weekend focused",
          retention: 87.8,
          characteristics: [
            "Large order sizes",
            "Weekend ordering",
            "Value conscious",
            "Consistent",
          ],
          recommendations: [
            "Family meal deals",
            "Kids menu expansion",
            "Weekend promotions",
          ],
        },
        {
          name: "Quick Lunch",
          size: 3900,
          value: 580000,
          behavior: "Weekday orders, fast delivery",
          retention: 82.4,
          characteristics: [
            "Time sensitive",
            "Weekday focus",
            "Speed priority",
            "Routine orders",
          ],
          recommendations: [
            "Express menu",
            "Pre-order options",
            "Lunch hour specials",
          ],
        },
        {
          name: "Occasional Visitors",
          size: 2600,
          value: 290000,
          behavior: "Infrequent, price sensitive",
          retention: 68.9,
          characteristics: [
            "Price sensitive",
            "Infrequent orders",
            "Promotion driven",
            "Low engagement",
          ],
          recommendations: [
            "Discount campaigns",
            "Loyalty incentives",
            "Re-engagement emails",
          ],
        },
      ],
      behaviorPatterns: [
        {
          pattern: "Weekend Family Orders",
          frequency: 72,
          impact: "High revenue per order",
          seasonality: 1.3,
          demographics: ["Families", "Age 30-45", "Suburban"],
        },
        {
          pattern: "Lunch Rush (11-2 PM)",
          frequency: 89,
          impact: "Volume driver",
          seasonality: 1.1,
          demographics: ["Working professionals", "Age 25-40", "Urban"],
        },
        {
          pattern: "Late Night Cravings",
          frequency: 34,
          impact: "Premium pricing opportunity",
          seasonality: 0.8,
          demographics: ["Young adults", "Age 18-30", "Urban"],
        },
        {
          pattern: "Holiday Celebrations",
          frequency: 12,
          impact: "Seasonal revenue spike",
          seasonality: 3.2,
          demographics: ["All segments", "Mixed demographics"],
        },
      ],
      lifetimeValueDistribution: [
        { range: "$0-$100", count: 8456, percentage: 45.7 },
        { range: "$100-$300", count: 6234, percentage: 33.7 },
        { range: "$300-$500", count: 2456, percentage: 13.3 },
        { range: "$500+", count: 1347, percentage: 7.3 },
      ],
    };
  }

  // Mock data for AI Reports & Automation
  private getMockReportTemplates(): ReportTemplate[] {
    return [
      {
        id: "1",
        name: "Daily Operations Report",
        description:
          "Comprehensive daily performance overview with AI insights",
        type: "operational",
        frequency: "daily",
        format: "pdf",
        sections: [
          {
            id: "1",
            type: "kpi",
            title: "Key Metrics",
            dataSource: "dashboard",
            config: {},
            aiEnhanced: true,
          },
          {
            id: "2",
            type: "chart",
            title: "Order Trends",
            dataSource: "orders",
            config: {},
            aiEnhanced: true,
          },
          {
            id: "3",
            type: "ai-insight",
            title: "AI Recommendations",
            dataSource: "ai",
            config: {},
            aiEnhanced: true,
          },
        ],
        aiInsights: true,
        automatedDelivery: true,
        recipients: ["admin@fooddelivery.com", "manager@fooddelivery.com"],
        schedule: { time: "09:00" },
        lastGenerated: new Date().toISOString(),
        status: "active",
      },
      {
        id: "2",
        name: "Weekly Financial Summary",
        description: "Financial performance analysis with predictive insights",
        type: "financial",
        frequency: "weekly",
        format: "excel",
        sections: [
          {
            id: "1",
            type: "chart",
            title: "Revenue Analysis",
            dataSource: "revenue",
            config: {},
            aiEnhanced: true,
          },
          {
            id: "2",
            type: "table",
            title: "Cost Breakdown",
            dataSource: "costs",
            config: {},
            aiEnhanced: false,
          },
          {
            id: "3",
            type: "ai-insight",
            title: "Financial Recommendations",
            dataSource: "ai",
            config: {},
            aiEnhanced: true,
          },
        ],
        aiInsights: true,
        automatedDelivery: true,
        recipients: ["finance@fooddelivery.com"],
        schedule: { time: "10:00", dayOfWeek: 1 },
        lastGenerated: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "active",
      },
    ];
  }

  private getMockSmartAlerts(): SmartAlert[] {
    return [
      {
        id: "1",
        name: "Revenue Drop Alert",
        description: "Alert when daily revenue drops below expected threshold",
        type: "threshold",
        metric: "daily_revenue",
        condition: { operator: "less_than", value: 5000, timeframe: "1d" },
        aiAnalysis: true,
        notifications: { email: true, sms: true, push: true },
        status: "active",
        triggers: 3,
        lastTriggered: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "2",
        name: "Order Spike Detection",
        description: "Detect unusual order volume increases",
        type: "anomaly",
        metric: "order_volume",
        condition: { operator: "change_by", value: 50, timeframe: "1h" },
        aiAnalysis: true,
        notifications: { email: true, sms: false, push: true },
        status: "active",
        triggers: 12,
        lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  private getMockNLQueryResponse(query: string): {
    result: any;
    confidence: number;
    explanation: string;
    suggestedFollowUps: string[];
  } {
    return {
      result: {
        type: "chart_data",
        data: [
          { name: "Mon", value: 4200 },
          { name: "Tue", value: 3800 },
          { name: "Wed", value: 4600 },
          { name: "Thu", value: 4100 },
          { name: "Fri", value: 5200 },
          { name: "Sat", value: 6100 },
          { name: "Sun", value: 5800 },
        ],
        chartType: "bar",
      },
      confidence: 0.92,
      explanation: `Based on your query "${query}", I found that revenue patterns show strong weekend performance with Friday-Sunday generating 65% higher revenue than weekdays.`,
      suggestedFollowUps: [
        "What caused the Friday spike?",
        "How can we improve weekday performance?",
        "Show me hourly patterns for weekends",
      ],
    };
  }

  private getMockAutomationWorkflows(): AutomationWorkflow[] {
    return [
      {
        id: "1",
        name: "Daily Performance Workflow",
        description: "Generate and distribute daily performance reports",
        trigger: { type: "schedule", config: { time: "09:00", daily: true } },
        actions: [
          {
            id: "1",
            type: "generate_report",
            config: { templateId: "1" },
            order: 1,
          },
          {
            id: "2",
            type: "ai_analysis",
            config: { analysisType: "performance" },
            order: 2,
          },
          {
            id: "3",
            type: "send_email",
            config: { recipients: ["team@company.com"] },
            order: 3,
          },
        ],
        status: "active",
        executions: 45,
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        name: "Alert Response Automation",
        description: "Automatically respond to critical business alerts",
        trigger: { type: "event", config: { eventType: "critical_alert" } },
        actions: [
          {
            id: "1",
            type: "ai_analysis",
            config: { analysisType: "root_cause" },
            order: 1,
          },
          {
            id: "2",
            type: "generate_report",
            config: { templateId: "incident" },
            order: 2,
          },
          {
            id: "3",
            type: "call_api",
            config: { endpoint: "/notify-managers" },
            order: 3,
          },
        ],
        status: "active",
        executions: 8,
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
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
      return this.getMockMLModels();
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
      return this.getMockMLRecommendations();
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
      return this.getMockMLForecasts();
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
      return this.getMockCustomerSegments();
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
      return this.getMockPricingInsights();
    }
  }

  async getAnomalyDetections() {
    try {
      const response = await fetch(`${this.baseUrl}/admin/ml/anomalies`, {
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
      console.error("Failed to fetch anomaly detections:", error);
      return this.getMockAnomalyDetections();
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

  // Mock data methods for Machine Learning Integration
  private getMockMLModels() {
    return [
      {
        id: "ml-1",
        name: "Product Recommendation Engine",
        type: "recommendation",
        status: "ready",
        accuracy: 94.2,
        lastTrained: "2024-01-15T08:00:00Z",
        description:
          "AI model for personalized food recommendations based on customer preferences and order history",
        features: [
          "order_history",
          "preferences",
          "demographics",
          "time_patterns",
        ],
        performance: {
          precision: 91.5,
          recall: 89.3,
          f1Score: 0.904,
          trainingTime: "2h 15m",
        },
      },
      {
        id: "ml-2",
        name: "Demand Forecasting Model",
        type: "forecasting",
        status: "ready",
        accuracy: 87.8,
        lastTrained: "2024-01-14T14:30:00Z",
        description:
          "Predicts customer demand patterns for inventory optimization and staff planning",
        features: ["historical_sales", "weather", "events", "seasonality"],
        performance: {
          precision: 85.2,
          recall: 88.1,
          f1Score: 0.866,
          trainingTime: "3h 45m",
        },
      },
      {
        id: "ml-3",
        name: "Customer Behavior Classifier",
        type: "classification",
        status: "training",
        accuracy: 0,
        lastTrained: "2024-01-16T09:00:00Z",
        description:
          "Classifies customers into behavioral segments for targeted marketing campaigns",
        features: [
          "order_frequency",
          "avg_spend",
          "visit_patterns",
          "feedback",
        ],
        performance: {
          precision: 0,
          recall: 0,
          f1Score: 0,
          trainingTime: "In progress",
        },
      },
      {
        id: "ml-4",
        name: "Price Optimization Engine",
        type: "optimization",
        status: "ready",
        accuracy: 92.1,
        lastTrained: "2024-01-13T16:20:00Z",
        description:
          "Optimizes pricing strategies based on demand elasticity and competitor analysis",
        features: [
          "demand_data",
          "competitor_prices",
          "cost_structure",
          "seasonality",
        ],
        performance: {
          precision: 90.8,
          recall: 93.2,
          f1Score: 0.92,
          trainingTime: "1h 55m",
        },
      },
      {
        id: "ml-5",
        name: "Anomaly Detection System",
        type: "anomaly",
        status: "ready",
        accuracy: 96.7,
        lastTrained: "2024-01-15T11:45:00Z",
        description:
          "Detects unusual patterns in sales, orders, and customer behavior",
        features: [
          "sales_patterns",
          "order_anomalies",
          "customer_behavior",
          "operational_metrics",
        ],
        performance: {
          precision: 95.3,
          recall: 97.8,
          f1Score: 0.965,
          trainingTime: "45m",
        },
      },
    ];
  }

  private getMockMLRecommendations() {
    return [
      {
        id: "rec-1",
        type: "product",
        title: "Introduce Weekend Brunch Menu",
        description:
          "AI analysis suggests high demand for brunch items on weekends. Customer behavior patterns show 35% increased interest in breakfast-style dishes during 10AM-2PM weekend slots.",
        confidence: 87,
        impact: "high",
        category: "Menu Optimization",
        data: {
          projected_revenue: "+$12,500/month",
          customer_interest: "89%",
          implementation_cost: "$3,200",
        },
        actions: [
          "Design brunch menu with popular breakfast items",
          "Test market with limited weekend availability",
          "Train kitchen staff on new preparation techniques",
          "Update POS system with new menu categories",
        ],
      },
      {
        id: "rec-2",
        type: "pricing",
        title: "Optimize Peak Hour Pricing",
        description:
          "Dynamic pricing during 7-9PM dinner rush could increase revenue by 18% while maintaining customer satisfaction levels above 85%.",
        confidence: 92,
        impact: "high",
        category: "Revenue Optimization",
        data: {
          revenue_increase: "+18%",
          customer_retention: "91%",
          optimal_markup: "12-15%",
        },
        actions: [
          "Implement graduated pricing tiers for peak hours",
          "Communicate value proposition to customers",
          "Monitor customer feedback and satisfaction",
          "Adjust pricing based on demand patterns",
        ],
      },
      {
        id: "rec-3",
        type: "marketing",
        title: "Targeted Loyalty Program",
        description:
          "Personalized loyalty rewards based on individual customer preferences could increase repeat visits by 28% and average order value by 15%.",
        confidence: 84,
        impact: "medium",
        category: "Customer Retention",
        data: {
          repeat_visit_increase: "+28%",
          avg_order_increase: "+15%",
          customer_lifetime_value: "+42%",
        },
        actions: [
          "Segment customers based on ordering patterns",
          "Create personalized reward structures",
          "Develop mobile app loyalty features",
          "A/B test different reward mechanisms",
        ],
      },
      {
        id: "rec-4",
        type: "customer",
        title: "Proactive Churn Prevention",
        description:
          "Identify at-risk customers 30 days before likely churn using predictive models. Early intervention campaigns show 67% success rate in retention.",
        confidence: 79,
        impact: "medium",
        category: "Customer Retention",
        data: {
          churn_reduction: "-34%",
          intervention_success: "67%",
          revenue_saved: "$8,900/month",
        },
        actions: [
          "Deploy churn prediction model",
          "Create automated intervention campaigns",
          "Offer personalized incentives to at-risk customers",
          "Monitor customer engagement metrics",
        ],
      },
    ];
  }

  private getMockMLForecasts() {
    return [
      {
        id: "forecast-1",
        metric: "Daily Orders",
        timeframe: "Next 30 Days",
        predicted: 450,
        confidence: 89,
        trend: "increasing",
        factors: [
          "Weather Patterns",
          "Seasonal Demand",
          "Marketing Campaigns",
          "Local Events",
        ],
        historical: [
          { date: "2024-01-01", value: 380 },
          { date: "2024-01-02", value: 395 },
          { date: "2024-01-03", value: 410 },
          { date: "2024-01-04", value: 425 },
          { date: "2024-01-05", value: 435 },
        ],
        predicted_values: [
          { date: "2024-01-16", value: 445 },
          { date: "2024-01-17", value: 450 },
          { date: "2024-01-18", value: 455 },
          { date: "2024-01-19", value: 465 },
          { date: "2024-01-20", value: 470 },
        ],
      },
      {
        id: "forecast-2",
        metric: "Weekly Revenue",
        timeframe: "Next 8 Weeks",
        predicted: 28500,
        confidence: 85,
        trend: "increasing",
        factors: [
          "Order Volume",
          "Average Order Value",
          "Promotional Activities",
          "Customer Growth",
        ],
        historical: [
          { date: "Week 1", value: 24000 },
          { date: "Week 2", value: 25200 },
          { date: "Week 3", value: 26100 },
          { date: "Week 4", value: 27300 },
          { date: "Week 5", value: 27800 },
        ],
        predicted_values: [
          { date: "Week 6", value: 28200 },
          { date: "Week 7", value: 28500 },
          { date: "Week 8", value: 28900 },
          { date: "Week 9", value: 29400 },
          { date: "Week 10", value: 29800 },
        ],
      },
      {
        id: "forecast-3",
        metric: "Customer Acquisition",
        timeframe: "Next Quarter",
        predicted: 1250,
        confidence: 78,
        trend: "stable",
        factors: [
          "Marketing Spend",
          "Referral Programs",
          "Online Reviews",
          "Competitive Landscape",
        ],
        historical: [
          { date: "Q4 2023", value: 980 },
          { date: "Q1 2024", value: 1100 },
          { date: "Q2 2024", value: 1180 },
          { date: "Q3 2024", value: 1220 },
          { date: "Q4 2024", value: 1240 },
        ],
        predicted_values: [
          { date: "Q1 2025", value: 1250 },
          { date: "Q2 2025", value: 1280 },
          { date: "Q3 2025", value: 1320 },
          { date: "Q4 2025", value: 1350 },
        ],
      },
    ];
  }

  private getMockCustomerSegments() {
    return [
      {
        id: "segment-1",
        name: "Premium Frequent Diners",
        size: 324,
        characteristics: [
          "High AOV",
          "Weekly visits",
          "Premium menu items",
          "Lunch & Dinner",
        ],
        value: 87500,
        behavior: {
          avgOrderValue: 45.5,
          frequency: 3.2,
          churnRate: 8.5,
          satisfaction: 4.7,
        },
        recommendations: [
          "VIP loyalty program with exclusive menu items",
          "Priority reservations and table preferences",
          "Personal chef consultations for special events",
        ],
      },
      {
        id: "segment-2",
        name: "Budget-Conscious Families",
        size: 567,
        characteristics: [
          "Price sensitive",
          "Weekend visits",
          "Large orders",
          "Family deals",
        ],
        value: 42300,
        behavior: {
          avgOrderValue: 32.8,
          frequency: 1.8,
          churnRate: 15.2,
          satisfaction: 4.2,
        },
        recommendations: [
          "Family meal packages and combo deals",
          "Kids eat free promotions on weekends",
          "Birthday party packages and group discounts",
        ],
      },
      {
        id: "segment-3",
        name: "Office Lunch Crowd",
        size: 892,
        characteristics: [
          "Weekday lunch",
          "Quick service",
          "Healthy options",
          "Repeat orders",
        ],
        value: 38900,
        behavior: {
          avgOrderValue: 18.5,
          frequency: 4.1,
          churnRate: 12.8,
          satisfaction: 4.4,
        },
        recommendations: [
          "Express lunch menu with 15-minute guarantee",
          "Corporate catering and bulk order discounts",
          "Healthy meal prep options for weekly orders",
        ],
      },
      {
        id: "segment-4",
        name: "Special Occasion Diners",
        size: 203,
        characteristics: [
          "Infrequent visits",
          "High spend",
          "Celebrations",
          "Wine pairings",
        ],
        value: 35600,
        behavior: {
          avgOrderValue: 78.3,
          frequency: 0.7,
          churnRate: 25.4,
          satisfaction: 4.6,
        },
        recommendations: [
          "Anniversary and birthday reminder system",
          "Customizable celebration packages",
          "Wine tasting events and sommelier recommendations",
        ],
      },
    ];
  }

  private getMockPricingInsights() {
    return [
      {
        id: "pricing-1",
        product: "Signature Burger Deluxe",
        currentPrice: 16.95,
        suggestedPrice: 18.5,
        confidence: 87,
        reasoning:
          "High demand with low price elasticity. Competitor analysis shows room for 9% price increase while maintaining market competitiveness.",
        expectedImpact: {
          revenueChange: +12.3,
          demandChange: -3.2,
          competitiveness: "Strong",
        },
        competitors: [
          { name: "Burger Palace", price: 19.5 },
          { name: "Grill House", price: 17.25 },
          { name: "Premium Burgers", price: 21.0 },
        ],
      },
      {
        id: "pricing-2",
        product: "Caesar Salad",
        currentPrice: 12.5,
        suggestedPrice: 11.95,
        confidence: 74,
        reasoning:
          "Below-average sales volume suggests price sensitivity. Small reduction could increase demand by 18% with minimal revenue impact.",
        expectedImpact: {
          revenueChange: +2.8,
          demandChange: +18.4,
          competitiveness: "Improved",
        },
        competitors: [
          { name: "Fresh Garden", price: 11.5 },
          { name: "Salad Station", price: 10.95 },
          { name: "Green Leaf", price: 13.25 },
        ],
      },
      {
        id: "pricing-3",
        product: "Craft Beer Selection",
        currentPrice: 6.5,
        suggestedPrice: 7.25,
        confidence: 91,
        reasoning:
          "Premium positioning opportunity with loyal customer base. High-quality craft beers justify premium pricing in local market.",
        expectedImpact: {
          revenueChange: +18.7,
          demandChange: -2.1,
          competitiveness: "Premium",
        },
        competitors: [
          { name: "Brew House", price: 7.5 },
          { name: "Craft Corner", price: 6.95 },
          { name: "Local Tap", price: 8.0 },
        ],
      },
    ];
  }

  private getMockAnomalyDetections() {
    return [
      {
        id: "anomaly-1",
        type: "revenue",
        severity: "high",
        description:
          "Unexpected 23% drop in evening revenue over the past 3 days",
        detected: "2024-01-16T14:30:00Z",
        pattern: "Consistent decline in 6-9PM time slot across all days",
        suggestion:
          "Review kitchen capacity, staff scheduling, and competitor activities in the area",
        data: {
          expected: 3200,
          actual: 2464,
          deviation: -23.0,
        },
      },
      {
        id: "anomaly-2",
        type: "orders",
        severity: "medium",
        description: "Unusual spike in vegetarian orders during lunch hours",
        detected: "2024-01-16T12:15:00Z",
        pattern: "45% increase in vegetarian menu items between 11AM-2PM",
        suggestion:
          "Investigate local events, dietary trends, or marketing campaign impacts",
        data: {
          expected: 28,
          actual: 41,
          deviation: +46.4,
        },
      },
      {
        id: "anomaly-3",
        type: "customers",
        severity: "low",
        description: "Higher than expected new customer registrations",
        detected: "2024-01-16T10:45:00Z",
        pattern: "67% increase in new customer sign-ups via mobile app",
        suggestion:
          "Monitor onboarding experience and capitalize on increased interest",
        data: {
          expected: 15,
          actual: 25,
          deviation: +66.7,
        },
      },
      {
        id: "anomaly-4",
        type: "inventory",
        severity: "critical",
        description: "Rapid depletion of premium ingredients ahead of forecast",
        detected: "2024-01-16T16:20:00Z",
        pattern:
          "Truffle oil and wagyu beef consuming 3x faster than predicted",
        suggestion:
          "Emergency procurement needed. Review portion sizes and menu popularity",
        data: {
          expected: 75,
          actual: 23,
          deviation: -69.3,
        },
      },
    ];
  }
}

export const analyticsService = new AnalyticsService();
