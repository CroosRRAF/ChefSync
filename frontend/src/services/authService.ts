import axios from 'axios';

// Use Vite dev proxy by default to avoid protocol mismatches in development.
// Set VITE_API_BASE_URL in production builds.
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Secure token access function
const getSecureToken = (): string | null => {
  try {
    return localStorage.getItem('access_token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error accessing refresh token from localStorage:', error);
    return null;
  }
};

const setSecureToken = (token: string): void => {
  try {
    localStorage.setItem('access_token', token);
  } catch (error) {
    console.error('Error setting token in localStorage:', error);
  }
};

const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem('refresh_token', token);
  } catch (error) {
    console.error('Error setting refresh token in localStorage:', error);
  }
};

const removeSecureTokens = (): void => {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } catch (error) {
    console.error('Error removing tokens from localStorage:', error);
  }
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getSecureToken();
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
    return '🔌 Connection Error: Backend server is not running. Please start the backend server.';
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
        const refreshToken = localStorage.getItem('refresh_token'); // Get refresh token from localStorage
        if (refreshToken) {
          const response = await api.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access, refresh } = response.data;
          setSecureToken(access);
          if (refresh) {
            setRefreshToken(refresh);
          }
          
          console.log('Token refresh successful');
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          console.log('No refresh token available');
          removeSecureTokens();
          window.location.href = '/auth/login';
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        removeSecureTokens();
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
  role: 'customer' | 'cook' | 'delivery_agent' | 'admin';
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
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/health/`, {
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
      const response = await api.post<AuthResponse>('/auth/login/', credentials);
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      return response.data;
    } catch (error: any) {
      // Check if it's an approval status error
      if (error.response?.status === 403 && error.response?.data?.approval_status) {
        // Store user data temporarily for approval status page
        localStorage.setItem('pending_user_data', JSON.stringify({
          email: error.response.data.email || credentials.email,
          approval_status: error.response.data.approval_status,
          message: error.response.data.message
        }));
        
        // Throw specific error based on approval status
        if (error.response.data.approval_status === 'pending') {
          throw new Error('APPROVAL_PENDING');
        } else if (error.response.data.approval_status === 'rejected') {
          throw new Error('APPROVAL_REJECTED');
        }
      }
      
      const formattedError = formatErrorMessage(error);
      throw new Error(formattedError);
    }
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>('/auth/register/', data);
      return response.data;
    } catch (error: any) {
      const formattedError = formatErrorMessage(error);
      throw new Error(formattedError);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      removeSecureTokens();
    }
  }

  async verifyEmail(data: EmailVerificationData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/verify-email/', data);
    return response.data;
  }

  async requestPasswordReset(data: PasswordResetRequestData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/password/reset/request/', data);
    return response.data;
  }

  async confirmPasswordReset(data: PasswordResetConfirmData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/password/reset/confirm/', data);
    return response.data;
  }

  async googleOAuth(data: GoogleOAuthData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google/login/', data);
    
    // Store tokens
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>('/auth/profile/update/', data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
    return response.data;
  }

  async refreshToken(): Promise<{ access: string; refresh: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ access: string; refresh: string }>('/auth/token/refresh/', {
      refresh: refreshToken,
    });

    // Update stored tokens
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);

    return response.data;
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Helper method to get current token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Helper method to get current refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }
}

export const authService = new AuthService();
export default authService;
