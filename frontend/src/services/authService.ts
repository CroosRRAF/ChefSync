import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/auth';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chefsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to format error messages
const formatErrorMessage = (error: any): string => {
  if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
    return '🔌 Connection Error: Backend server is not running. Please start the backend server at http://127.0.0.1:8000';
  }
  
  if (error.code === 'ECONNREFUSED') {
    return '🚫 Server Unavailable: Cannot connect to backend server. Make sure Django server is running.';
  }
  
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.non_field_errors) return data.non_field_errors.join(', ');
    if (data.message) return data.message;
    
    // Handle field-specific errors
    const fieldErrors = Object.entries(data)
      .filter(([key, value]) => Array.isArray(value))
      .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
      .join('; ');
    
    if (fieldErrors) return fieldErrors;
  }
  
  return error.message || 'An unexpected error occurred';
};

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('chefsync_refresh_token');
        if (refreshToken) {
          const response = await api.post('/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('chefsync_token', access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('chefsync_token');
        localStorage.removeItem('chefsync_refresh_token');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_no?: string;
  role: 'customer' | 'cook' | 'delivery_agent';
  address?: string;
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone_no?: string;
  address?: string;
  role: 'customer' | 'cook' | 'delivery_agent';
  role_display: string;
  profile_image?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  profile_data?: any;
}

export interface AuthResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface EmailVerificationData {
  token: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  new_password: string;
  confirm_new_password: string;
}

export interface GoogleOAuthData {
  access_token: string;
  id_token: string;
}

class AuthService {
  // Check if backend server is running
  async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/health/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Backend server check failed:', error);
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/login/', credentials);
      
      // Store tokens
      localStorage.setItem('chefsync_token', response.data.access);
      localStorage.setItem('chefsync_refresh_token', response.data.refresh);
      
      return response.data;
    } catch (error: any) {
      const formattedError = formatErrorMessage(error);
      throw new Error(formattedError);
    }
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>('/register/', data);
      return response.data;
    } catch (error: any) {
      const formattedError = formatErrorMessage(error);
      throw new Error(formattedError);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('chefsync_refresh_token');
      if (refreshToken) {
        await api.post('/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('chefsync_token');
      localStorage.removeItem('chefsync_refresh_token');
    }
  }

  async verifyEmail(data: EmailVerificationData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/verify-email/', data);
    return response.data;
  }

  async requestPasswordReset(data: PasswordResetRequestData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/password/reset/request/', data);
    return response.data;
  }

  async confirmPasswordReset(data: PasswordResetConfirmData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/password/reset/confirm/', data);
    return response.data;
  }

  async googleOAuth(data: GoogleOAuthData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/google/login/', data);
    
    // Store tokens
    localStorage.setItem('chefsync_token', response.data.access);
    localStorage.setItem('chefsync_refresh_token', response.data.refresh);
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/profile/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>('/profile/update/', data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
    return response.data;
  }

  async refreshToken(): Promise<{ access: string; refresh: string }> {
    const refreshToken = localStorage.getItem('chefsync_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ access: string; refresh: string }>('/token/refresh/', {
      refresh: refreshToken,
    });

    // Update stored tokens
    localStorage.setItem('chefsync_token', response.data.access);
    localStorage.setItem('chefsync_refresh_token', response.data.refresh);

    return response.data;
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('chefsync_token');
  }

  // Helper method to get current token
  getToken(): string | null {
    return localStorage.getItem('chefsync_token');
  }

  // Helper method to get current refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('chefsync_refresh_token');
  }
}

export const authService = new AuthService();
export default authService;
