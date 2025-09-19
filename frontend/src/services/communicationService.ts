import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Feedback {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  rating: number;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  category: string;
  created_at: string;
  updated_at: string;
  response?: string;
  response_by?: string;
  response_at?: string;
}

export interface Complaint {
  id: number;
  order_id?: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  category: string;
  created_at: string;
  updated_at: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  attachments?: string[];
}

export interface SystemAlert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  target_users: 'all' | 'customers' | 'chefs' | 'admins';
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_at?: string;
  sent_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: 'welcome' | 'order' | 'alert' | 'feedback' | 'promotional';
  variables: string[];
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

class CommunicationService {
  // Feedback Management
  async getFeedbacks(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  } = {}) {
    const response = await apiClient.get('/apps/admin_management/feedback/', { params });
    return response.data;
  }

  async getFeedbackById(id: number) {
    const response = await apiClient.get(`/apps/admin_management/feedback/${id}/`);
    return response.data;
  }

  async respondToFeedback(id: number, data: { response: string }) {
    const response = await apiClient.post(`/apps/admin_management/feedback/${id}/respond/`, data);
    return response.data;
  }

  async updateFeedbackStatus(id: number, status: string) {
    const response = await apiClient.patch(`/apps/admin_management/feedback/${id}/status/`, { status });
    return response.data;
  }

  // Complaint Management
  async getComplaints(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  } = {}) {
    const response = await apiClient.get('/apps/admin_management/complaints/', { params });
    return response.data;
  }

  async getComplaintById(id: number) {
    const response = await apiClient.get(`/apps/admin_management/complaints/${id}/`);
    return response.data;
  }

  async resolveComplaint(id: number, data: { resolution: string; status: string }) {
    const response = await apiClient.post(`/apps/admin_management/complaints/${id}/resolve/`, data);
    return response.data;
  }

  async updateComplaintStatus(id: number, status: string) {
    const response = await apiClient.patch(`/admin/communications/complaints/${id}/status`, { status });
    return response.data;
  }

  // System Alerts
  async getSystemAlerts(params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    target_users?: string;
    search?: string;
  } = {}) {
    const response = await apiClient.get('/apps/admin_management/system-alerts/', { params });
    return response.data;
  }

  async createSystemAlert(data: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>) {
    const response = await apiClient.post('/apps/admin_management/system-alerts/', data);
    return response.data;
  }

  async updateSystemAlert(id: number, data: Partial<SystemAlert>) {
    const response = await apiClient.patch(`/admin/communications/system-alerts/${id}`, data);
    return response.data;
  }

  async deleteSystemAlert(id: number) {
    const response = await apiClient.delete(`/admin/communications/system-alerts/${id}`);
    return response.data;
  }

  async sendSystemAlert(id: number) {
    const response = await apiClient.post(`/admin/communications/system-alerts/${id}/send`);
    return response.data;
  }

  // Email Templates
  async getEmailTemplates(params: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  } = {}) {
    const response = await apiClient.get('/apps/admin_management/email-templates/', { params });
    return response.data;
  }

  async getEmailTemplateById(id: number) {
    const response = await apiClient.get(`/apps/admin_management/email-templates/${id}/`);
    return response.data;
  }

  async createEmailTemplate(data: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) {
    const response = await apiClient.post('/admin/communications/email-templates', data);
    return response.data;
  }

  async updateEmailTemplate(id: number, data: Partial<EmailTemplate>) {
    const response = await apiClient.patch(`/admin/communications/email-templates/${id}`, data);
    return response.data;
  }

  async deleteEmailTemplate(id: number) {
    const response = await apiClient.delete(`/admin/communications/email-templates/${id}`);
    return response.data;
  }

  // Email Sending
  async sendCustomEmail(data: {
    template_id?: number;
    subject: string;
    body: string;
    recipients: string[];
    attachments?: File[];
  }) {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('body', data.body);
    formData.append('recipients', JSON.stringify(data.recipients));
    if (data.template_id) {
      formData.append('template_id', data.template_id.toString());
    }
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await apiClient.post('/apps/admin_management/send-email/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Analytics
  async getCommunicationsAnalytics() {
    const response = await apiClient.get('/admin/communications/analytics');
    return response.data;
  }
}

export const communicationService = new CommunicationService();