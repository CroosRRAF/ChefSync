export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'cook' | 'delivery_agent';
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  address?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone_no: string;
  password: string;
  confirm_password: string;
  role: User['role'];
  address?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationData {
  token: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // poor, weak, fair, good, strong
  feedback: string[];
}

// Backend user interface (for API responses)
export interface BackendUser {
  user_id: string;
  name: string;
  email: string;
  phone_no?: string;
  address?: string;
  role: 'customer' | 'admin' | 'cook' | 'delivery_agent';
  role_display: string;
  profile_image?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  profile_data?: any;
}

// API response interfaces
export interface AuthResponse {
  message: string;
  access: string;
  refresh: string;
  user: BackendUser;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}