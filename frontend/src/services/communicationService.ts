import { toast } from "@/components/ui/use-toast";
import axios, { AxiosError } from "axios";

// Use Vite dev proxy by default to avoid protocol mismatches in development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const MOCK_SERVER_URL = "http://localhost:3001/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Failover to mock server if main server is down
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the main server is down (network error or 404), try the mock server
    if (
      (error.message === "Network Error" || error.response?.status === 404) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Switch to mock server
      originalRequest.baseURL = `${MOCK_SERVER_URL}/communications`;

      try {
        return await axios(originalRequest);
      } catch (mockError) {
        return Promise.reject(error); // If mock fails too, return original error
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;

    let message = "An unexpected error occurred";
    if (data?.message || data?.detail) {
      message = data.message || data.detail;
    } else if (status === 401) {
      message = "Authentication required. Please log in.";
    } else if (status === 403) {
      message = "You do not have permission to perform this action.";
    } else if (status === 404) {
      message = "The requested resource was not found.";
    } else if (status === 422) {
      message = "Invalid data provided.";
    }

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });

    return Promise.reject(error);
  }
);

export interface Communication {
  id: number;
  reference_number: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  communication_type:
    | "feedback"
    | "complaint"
    | "suggestion"
    | "inquiry"
    | "other";
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  rating?: number; // Only for feedback type
  order_id?: number; // Only for complaint type
  attachments?: string[];
  created_at: string;
  updated_at: string;
  responses?: CommunicationResponse[];
  metadata?: Record<string, any>;
}

export interface CommunicationResponse {
  id: number;
  communication_id: number;
  responder: {
    id: number;
    name: string;
  };
  response: string;
  created_at: string;
  updated_at: string;
  is_resolution: boolean;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: "welcome" | "order" | "alert" | "feedback" | "promotional";
  variables: string[];
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export interface SystemAlert {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  target_users: "all" | "customers" | "chefs" | "admins";
  status: "draft" | "scheduled" | "sent";
  created_by: string;
  metadata: Record<string, any>;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface CommunicationStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
  average_rating?: number;
  by_type: {
    feedback: number;
    complaint: number;
    suggestion: number;
    inquiry: number;
    other: number;
  };
}

class CommunicationService {
  private handleError<T>(error: any, context: string): Promise<T> {
    console.error(`Error in ${context}:`, error);
    return Promise.reject(error);
  }

  // Base communication methods
  async getCommunications(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      type?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Communication>> {
    try {
      const response = await apiClient.get("/communications/", { params });
      return response.data;
    } catch (error) {
      return this.handleError(error, "getCommunications");
    }
  }

  async getCommunicationById(id: number): Promise<Communication> {
    try {
      const response = await apiClient.get(`/communications/${id}/`);
      return response.data;
    } catch (error) {
      return this.handleError(error, "getCommunicationById");
    }
  }

  async createCommunication(
    data: Omit<
      Communication,
      "id" | "reference_number" | "created_at" | "updated_at"
    >
  ): Promise<Communication> {
    try {
      const response = await apiClient.post("/communications/", data);
      toast({
        title: "Success",
        description: `${data.communication_type} created successfully`,
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "createCommunication");
    }
  }

  async addResponse(
    communicationId: number,
    data: { response: string; is_resolution?: boolean }
  ): Promise<CommunicationResponse> {
    try {
      const response = await apiClient.post(
        `/communications/${communicationId}/responses/`,
        data
      );
      toast({
        title: "Success",
        description: "Response submitted successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "addResponse");
    }
  }

  async updateStatus(
    communicationId: number,
    status: string
  ): Promise<Communication> {
    try {
      const response = await apiClient.patch(
        `/communications/${communicationId}/`,
        { status }
      );
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "updateStatus");
    }
  }

  // Helper methods for specific communication types
  async getFeedbacks(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Communication>> {
    return this.getCommunications({ ...params, type: "feedback" });
  }

  async getComplaints(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Communication>> {
    return this.getCommunications({ ...params, type: "complaint" });
  }

  // Email Templates
  async getEmailTemplates(
    params: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<EmailTemplate>> {
    try {
      const response = await apiClient.get("/communications/templates/", {
        params,
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "getEmailTemplates");
    }
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate> {
    try {
      const response = await apiClient.get(`/communications/templates/${id}/`);
      return response.data;
    } catch (error) {
      return this.handleError(error, "getEmailTemplateById");
    }
  }

  async createEmailTemplate(
    data: Omit<EmailTemplate, "id" | "created_at" | "updated_at">
  ): Promise<EmailTemplate> {
    try {
      const response = await apiClient.post("/communications/templates/", data);
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "createEmailTemplate");
    }
  }

  async updateEmailTemplate(
    id: number,
    data: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    try {
      const response = await apiClient.patch(
        `/communications/templates/${id}/`,
        data
      );
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "updateEmailTemplate");
    }
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    try {
      await apiClient.delete(`/communications/templates/${id}/`);
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      });
    } catch (error) {
      return this.handleError(error, "deleteEmailTemplate");
    }
  }

  // Email Sending
  async sendCustomEmail(data: {
    template_id?: number;
    subject: string;
    body: string;
    recipients: string[];
    attachments?: File[];
  }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("body", data.body);
      formData.append("recipients", JSON.stringify(data.recipients));
      if (data.template_id) {
        formData.append("template_id", data.template_id.toString());
      }
      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const response = await apiClient.post(
        "/communications/send-email/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "sendCustomEmail");
    }
  }

  // System Alerts
  async getSystemAlerts(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
      target_users?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<SystemAlert>> {
    try {
      const response = await apiClient.get("/communications/", {
        params: { ...params, type: "system_alert" },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "getSystemAlerts");
    }
  }

  async createSystemAlert(
    data: Omit<SystemAlert, "id" | "created_at" | "updated_at">
  ): Promise<SystemAlert> {
    try {
      const response = await apiClient.post("/communications/", data);
      toast({
        title: "Success",
        description: "System alert created successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "createSystemAlert");
    }
  }

  async updateSystemAlert(
    id: number,
    data: Partial<SystemAlert>
  ): Promise<SystemAlert> {
    try {
      const response = await apiClient.patch(`/communications/${id}/`, data);
      toast({
        title: "Success",
        description: "System alert updated successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "updateSystemAlert");
    }
  }

  async deleteSystemAlert(id: number): Promise<void> {
    try {
      await apiClient.delete(`/communications/${id}/`);
      toast({
        title: "Success",
        description: "System alert deleted successfully",
      });
    } catch (error) {
      return this.handleError(error, "deleteSystemAlert");
    }
  }

  async sendSystemAlert(id: number): Promise<SystemAlert> {
    try {
      const response = await apiClient.post(`/communications/${id}/send/`);
      toast({
        title: "Success",
        description: "System alert sent successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "sendSystemAlert");
    }
  }

  // Rate Limiting and Retry Logic
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        if (error.response?.status === 429) {
          // Too Many Requests
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  // Statistics and Analytics Methods
  async getCommunicationStats(): Promise<CommunicationStats> {
    try {
      const response = await apiClient.get("/communications/stats/");
      return response.data;
    } catch (error) {
      return this.handleError(error, "getCommunicationStats");
    }
  }

  async getSentimentAnalysis(period: string = "30d"): Promise<{
    positive: number;
    negative: number;
    neutral: number;
    trending_topics: string[];
  }> {
    try {
      const response = await apiClient.get(
        "/communications/sentiment-analysis/",
        {
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error, "getSentimentAnalysis");
    }
  }

  // Feedback-specific methods
  async updateFeedbackStatus(
    feedbackId: number,
    status: string
  ): Promise<Communication> {
    return this.updateStatus(feedbackId, status);
  }

  async updateFeedbackPriority(
    feedbackId: number,
    priority: string
  ): Promise<Communication> {
    try {
      const response = await apiClient.patch(`/communications/${feedbackId}/`, {
        priority,
      });
      toast({
        title: "Success",
        description: "Priority updated successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "updateFeedbackPriority");
    }
  }

  async deleteFeedback(feedbackId: number): Promise<void> {
    try {
      await apiClient.delete(`/communications/${feedbackId}/`);
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
      });
    } catch (error) {
      return this.handleError(error, "deleteFeedback");
    }
  }

  async bulkUpdateStatus(feedbackIds: number[], status: string): Promise<void> {
    try {
      await apiClient.patch("/communications/bulk-update/", {
        ids: feedbackIds,
        status,
      });
      toast({
        title: "Success",
        description: `${feedbackIds.length} items updated successfully`,
      });
    } catch (error) {
      return this.handleError(error, "bulkUpdateStatus");
    }
  }

  // Additional methods for BackendIntegration
  async getHourlyDeliveryStats(): Promise<any> {
    try {
      // Mock implementation for now
      return {
        hourly: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          delivered: Math.floor(Math.random() * 100),
          failed: Math.floor(Math.random() * 10),
        })),
      };
    } catch (error) {
      return this.handleError(error, "getHourlyDeliveryStats");
    }
  }

  async getChannelPerformance(): Promise<any> {
    try {
      // Mock implementation for now
      return {
        email: { sent: 1500, delivered: 1420, opened: 850, clicked: 230 },
        sms: { sent: 800, delivered: 790, opened: 0, clicked: 0 },
        push: { sent: 2200, delivered: 2100, opened: 1200, clicked: 180 },
      };
    } catch (error) {
      return this.handleError(error, "getChannelPerformance");
    }
  }

  async getEngagementTrends(period: string): Promise<any> {
    try {
      // Mock implementation for now
      return {
        engagementTrends: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          opens: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 200),
          conversions: Math.floor(Math.random() * 50),
        })),
      };
    } catch (error) {
      return this.handleError(error, "getEngagementTrends");
    }
  }

  // Additional methods for Communication page
  async getNotifications(): Promise<any[]> {
    try {
      // Mock implementation for now
      return [
        {
          id: 1,
          title: "New Order Alert",
          message: "You have 5 new orders pending approval",
          type: "info",
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: "System Maintenance",
          message: "Scheduled maintenance tonight at 2 AM",
          type: "warning",
          read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    } catch (error) {
      return this.handleError(error, "getNotifications");
    }
  }

  async getCampaignStats(): Promise<any> {
    try {
      // Mock implementation for now
      return {
        total_campaigns: 45,
        active_campaigns: 8,
        total_sent: 15000,
        delivered: 14250,
        opened: 8550,
        clicked: 1710,
        conversion_rate: 11.4,
      };
    } catch (error) {
      return this.handleError(error, "getCampaignStats");
    }
  }

  async getDeliveryStats(period: string): Promise<any> {
    try {
      // Mock implementation for now
      return {
        total_sent: 5000,
        delivered: 4800,
        failed: 200,
        opened: 2880,
        clicked: 576,
        deliveryRate: 96.0,
        openRate: 60.0,
        clickRate: 12.0,
      };
    } catch (error) {
      return this.handleError(error, "getDeliveryStats");
    }
  }

  async duplicateCommunication(id: number): Promise<any> {
    try {
      const response = await apiClient.post(`/communications/${id}/duplicate/`);
      toast({
        title: "Success",
        description: "Communication duplicated successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "duplicateCommunication");
    }
  }

  async deleteCommunication(id: number): Promise<void> {
    try {
      await apiClient.delete(`/communications/${id}/`);
      toast({
        title: "Success",
        description: "Communication deleted successfully",
      });
    } catch (error) {
      return this.handleError(error, "deleteCommunication");
    }
  }

  async sendCommunication(payload: any): Promise<any> {
    try {
      const response = await apiClient.post("/communications/send/", payload);
      toast({
        title: "Success",
        description: "Communication sent successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "sendCommunication");
    }
  }
}

export const communicationService = new CommunicationService();
