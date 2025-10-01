/**
 * AI Service
 * Handles all AI/ML related API calls for Phase 3 features
 */

import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// TypeScript Interfaces

export interface SalesForecast {
  date: string;
  predicted_amount: number;
  confidence: number;
  day_of_week: string;
}

export interface SalesForecastResponse {
  forecast: SalesForecast[];
  confidence: number;
  insights: string[];
  total_forecast: number;
  avg_daily_forecast: number;
}

export interface Anomaly {
  type: string;
  date: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AnomalyAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnomalyDetectionResponse {
  anomalies: Anomaly[];
  alerts: AnomalyAlert[];
  insights: string[];
  total_anomalies: number;
  high_severity_count: number;
}

export interface ProductRecommendation {
  food_id: number;
  name: string;
  cook_name: string;
  recommendation_score: number;
  type: 'top_performer' | 'popular_choice' | 'revenue_driver' | 'customer_favorite' | 'emerging';
  reason: string;
  total_orders: number;
  total_revenue: number;
  avg_rating: number;
  price: number;
  image_url?: string;
}

export interface ProductRecommendationsResponse {
  recommendations: ProductRecommendation[];
  insights: string[];
  total_recommendations: number;
}

export interface CustomerSegment {
  name: string;
  count: number;
  avg_spending?: number;
  avg_orders?: number;
  description: string;
  recommendation: string;
}

export interface CustomerInsightsResponse {
  segments: CustomerSegment[];
  insights: string[];
  total_customers: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface AIStatusResponse {
  ai_service_available: boolean;
  features: {
    sales_forecast: boolean;
    anomaly_detection: boolean;
    product_recommendations: boolean;
    customer_insights: boolean;
    sentiment_analysis: boolean;
    report_generation: boolean;
  };
}

export interface AIDashboardSummary {
  sales_forecast: {
    next_7_days_revenue: number;
    avg_daily_forecast: number;
    confidence: number;
  };
  anomaly_detection: {
    total_anomalies: number;
    high_severity_count: number;
    alerts: AnomalyAlert[];
  };
  product_recommendations: {
    total_recommendations: number;
    top_products: ProductRecommendation[];
  };
  customer_insights: {
    total_customers: number;
    total_revenue: number;
    avg_order_value: number;
    segments: CustomerSegment[];
  };
  ai_service_status: boolean;
}

/**
 * AI Service Class
 */
class AIService {
  /**
   * Get sales forecast for the next N days
   */
  async getSalesForecast(daysAhead: number = 30): Promise<SalesForecastResponse> {
    try {
      const response = await apiClient.get(`/admin-management/ai/sales-forecast/`, {
        params: { days_ahead: daysAhead }
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching sales forecast:", error);
      throw error;
    }
  }

  /**
   * Detect anomalies in orders, revenue, and user behavior
   */
  async detectAnomalies(daysBack: number = 30): Promise<AnomalyDetectionResponse> {
    try {
      const response = await apiClient.get(`/admin-management/ai/anomaly-detection/`, {
        params: { days_back: daysBack }
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error detecting anomalies:", error);
      throw error;
    }
  }

  /**
   * Get product recommendations based on sales data
   */
  async getProductRecommendations(limit: number = 10): Promise<ProductRecommendationsResponse> {
    try {
      const response = await apiClient.get(`/admin-management/ai/product-recommendations/`, {
        params: { limit: limit }
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching product recommendations:", error);
      throw error;
    }
  }

  /**
   * Get customer insights and segmentation
   */
  async getCustomerInsights(): Promise<CustomerInsightsResponse> {
    try {
      const response = await apiClient.get(`/admin-management/ai/customer-insights/`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching customer insights:", error);
      throw error;
    }
  }

  /**
   * Check AI service status and availability
   */
  async getAIStatus(): Promise<AIStatusResponse> {
    try {
      const response = await apiClient.get(`/admin-management/ai/status/`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching AI status:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive AI dashboard summary
   */
  async getDashboardSummary(): Promise<AIDashboardSummary> {
    try {
      const response = await apiClient.get(`/admin-management/ai/dashboard-summary/`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching AI dashboard summary:", error);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Get severity color for anomalies
   */
  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Get recommendation type color
   */
  getRecommendationTypeColor(type: string): string {
    switch (type) {
      case 'top_performer':
        return 'text-green-600 bg-green-50';
      case 'popular_choice':
        return 'text-blue-600 bg-blue-50';
      case 'revenue_driver':
        return 'text-purple-600 bg-purple-50';
      case 'customer_favorite':
        return 'text-pink-600 bg-pink-50';
      case 'emerging':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Get recommendation type icon
   */
  getRecommendationTypeIcon(type: string): string {
    switch (type) {
      case 'top_performer':
        return '🏆';
      case 'popular_choice':
        return '🔥';
      case 'revenue_driver':
        return '💰';
      case 'customer_favorite':
        return '❤️';
      case 'emerging':
        return '📈';
      default:
        return '📊';
    }
  }

  /**
   * Validate forecast parameters
   */
  validateForecastParams(daysAhead: number): { isValid: boolean; error?: string } {
    if (daysAhead < 1 || daysAhead > 365) {
      return {
        isValid: false,
        error: 'Days ahead must be between 1 and 365'
      };
    }
    return { isValid: true };
  }

  /**
   * Validate anomaly detection parameters
   */
  validateAnomalyParams(daysBack: number): { isValid: boolean; error?: string } {
    if (daysBack < 1 || daysBack > 365) {
      return {
        isValid: false,
        error: 'Days back must be between 1 and 365'
      };
    }
    return { isValid: true };
  }

  /**
   * Validate recommendation parameters
   */
  validateRecommendationParams(limit: number): { isValid: boolean; error?: string } {
    if (limit < 1 || limit > 50) {
      return {
        isValid: false,
        error: 'Limit must be between 1 and 50'
      };
    }
    return { isValid: true };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for testing
export default AIService;
