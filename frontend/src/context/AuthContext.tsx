import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth';
import authService, { AuthResponse } from '@/services/authService';
import { useNavigate } from 'react-router-dom';

// Define the shape of our context
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Create the context with undefined as initial value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the auth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Define action types
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_TOKEN'; payload: string };

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('chefsync_token'),
  isAuthenticated: false,
  isLoading: true,
};

// Reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_USER':
      localStorage.removeItem('chefsync_token');
      localStorage.removeItem('chefsync_refresh_token');
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_TOKEN':
      localStorage.setItem('chefsync_token', action.payload);
      return { ...state, token: action.payload };
    default:
      return state;
  }
}

// Helper function to get role-based path
function getRoleBasedPath(role: string): string {
  switch (role) {
    case 'customer':
      return '/customer/dashboard';
    case 'cook':
      return '/cook/dashboard';
    case 'delivery_agent':
      return '/delivery/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('chefsync_token');
    if (token) {
      validateToken(token);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await authService.getProfile();
      if (response) {
        const user: User = {
          id: response.user_id,
          email: response.email,
          name: response.name,
          phone: response.phone_no,
          role: response.role,
          avatar: response.profile_image,
          isEmailVerified: response.email_verified,
          createdAt: response.created_at,
          updatedAt: response.updated_at
        };
        dispatch({ type: 'SET_USER', payload: { user, token } });
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response: AuthResponse = await authService.login(credentials);
            
      const frontendUser: User = {
        id: response.user.user_id,
        email: response.user.email,
        name: response.user.name,
        phone: response.user.phone_no,
        role: response.user.role,
        avatar: response.user.profile_image,
        isEmailVerified: response.user.email_verified,
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at
      };
            
      // Add a small delay before state update to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set both auth context and user store state
      dispatch({ type: 'SET_USER', payload: { user: frontendUser, token: response.access } });
      
      // Add another small delay after state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the role-specific dashboard path
      const dashboardPath = getRoleBasedPath(frontendUser.role);
      
      // Force navigate to the dashboard path with state
      navigate(dashboardPath, { 
        replace: true,
        state: { from: 'login' }
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const backendData = {
        name: data.name,
        email: data.email,
        password: data.password,
        confirm_password: data.password,
        phone_no: data.phone_no,
        role: data.role || 'customer',
        address: data.address || ''
      };

      await authService.register(backendData);
      await login({ email: data.email, password: data.password });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'CLEAR_USER' });
      navigate('/', { replace: true });
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      dispatch({ type: 'SET_TOKEN', payload: response.access });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}