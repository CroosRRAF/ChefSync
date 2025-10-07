import { toast } from "@/components/ui/use-toast";
import axios, { AxiosError } from "axios";

// Use Vite dev proxy by default to avoid protocol mismatches in development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// No mock failover; ensure real backend errors surface

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
    const url = error.config?.url || "";

    // Don't show toast for stats/analytics endpoints that might not exist yet
    const isFallbackEndpoint =
      url.includes("/stats") ||
      url.includes("/sentiment-analysis") ||
      url.includes("/notifications") ||
      url.includes("/campaign-stats") ||
      url.includes("/delivery-stats");

    if (status === 404 && isFallbackEndpoint) {
      // Silently handle 404s for optional endpoints
      return Promise.reject(error);
    }

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
  content: string;
  template_type: "feedback" | "complaint" | "inquiry" | "general" | "resolution" | "acknowledgment";
  variables: any;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
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

export interface CommunicationCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTag {
  id: number;
  name: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
      communication_type?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Communication>> {
    try {
      const response = await apiClient.get("/communications/communications/", {
        params,
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "getCommunications");
    }
  }

  async getCommunicationById(id: number): Promise<Communication> {
    try {
      const response = await apiClient.get(
        `/communications/communications/${id}/`
      );
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
      const response = await apiClient.post(
        "/communications/communications/",
        data
      );
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
        `/communications/communications/${communicationId}/responses/`,
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
        `/communications/communications/${communicationId}/`,
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
    return this.getCommunications({ ...params, communication_type: "feedback" });
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
    return this.getCommunications({ ...params, communication_type: "complaint" });
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
        "/communications/communications/send-email/",
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
      const response = await apiClient.get("/communications/communications/", {
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
      const response = await apiClient.post("/communications/communications/", data);
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
      const response = await apiClient.patch(`/communications/communications/${id}/`, data);
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
      await apiClient.delete(`/communications/communications/${id}/`);
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
      const response = await apiClient.post(`/communications/communications/${id}/send/`);
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
      const response = await apiClient.get(
        "/communications/communications/stats/"
      );
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
        "/communications/communications/sentiment_analysis/",
        {
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error, "getSentimentAnalysis");
    }
  }

  // Priority update method
  async updatePriority(
    communicationId: number,
    priority: string
  ): Promise<Communication> {
    try {
      const response = await apiClient.patch(`/communications/communications/${communicationId}/`, {
        priority,
      });
      toast({
        title: "Success",
        description: "Priority updated successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "updatePriority");
    }
  }

  async bulkUpdateStatus(communicationIds: number[], status: string): Promise<void> {
    try {
      await apiClient.patch("/communications/communications/bulk-update/", {
        ids: communicationIds,
        status,
      });
      toast({
        title: "Success",
        description: `${communicationIds.length} items updated successfully`,
      });
    } catch (error) {
      return this.handleError(error, "bulkUpdateStatus");
    }
  }

  // Additional methods for BackendIntegration
  async getHourlyDeliveryStats(): Promise<any> {
    return this.handleError(
      new Error("Not implemented"),
      "getHourlyDeliveryStats"
    );
  }

  async getChannelPerformance(): Promise<any> {
    return this.handleError(
      new Error("Not implemented"),
      "getChannelPerformance"
    );
  }

  async getEngagementTrends(period: string): Promise<any> {
    return this.handleError(
      new Error("Not implemented"),
      "getEngagementTrends"
    );
  }

  // Additional methods for Communication page
  async getNotifications(): Promise<any[]> {
    try {
      const response = await apiClient.get(
        "/communications/communications/notifications/"
      );
      return response.data.results || [];
    } catch (error) {
      console.error("Error in getNotifications:", error);
      return [];
    }
  }

  async getCampaignStats(): Promise<any> {
    try {
      const response = await apiClient.get(
        "/communications/communications/campaign_stats/"
      );
      return response.data;
    } catch (error) {
      console.error("Error in getCampaignStats:", error);
      return null;
    }
  }

  async getDeliveryStats(period: string): Promise<any> {
    try {
      const response = await apiClient.get(
        "/communications/communications/delivery_stats/",
        {
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error in getDeliveryStats:", error);
      return null;
    }
  }

  async duplicateCommunication(id: number): Promise<any> {
    try {
      const response = await apiClient.post(
        `/communications/communications/${id}/duplicate/`
      );
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
      await apiClient.delete(`/communications/communications/${id}/`);
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
      // Try the send endpoint which might have different validation
      const response = await apiClient.post(
        "/communications/communications/send/",
        payload
      );
      toast({
        title: "Success",
        description: "Communication sent successfully",
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, "sendCommunication");
    }
  }

  async getCategories(): Promise<CommunicationCategory[]> {
    try {
      const response = await apiClient.get("/communications/categories/");
      return response.data.results || response.data || [];
    } catch (error) {
      console.error("Error in getCategories:", error);
      return [];
    }
  }

  async getTags(): Promise<CommunicationTag[]> {
    try {
      const response = await apiClient.get("/communications/tags/");
      return response.data.results || response.data || [];
    } catch (error) {
      console.error("Error in getTags:", error);
      return [];
    }
  }
}

export const communicationService = new CommunicationService();
