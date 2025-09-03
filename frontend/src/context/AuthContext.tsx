import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth';
import authService, { AuthResponse } from '@/services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_TOKEN'; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
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
};

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('chefsync_token'),
  isAuthenticated: false,
  isLoading: true,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('chefsync_token');
    if (token) {
      // Validate token and get user info
      validateToken(token);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const user = await authService.getProfile();
      dispatch({ type: 'SET_USER', payload: { user, token } });
    } catch (error) {
      console.error('Token validation failed:', error);
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response: AuthResponse = await authService.login(credentials);
      
      // Convert backend user format to frontend format
      const frontendUser: User = {
        id: response.user.user_id,
        email: response.user.email,
        name: response.user.name,
        phone: response.user.phone_no,
        role: response.user.role,
        avatar: response.user.profile_image,
        isEmailVerified: response.user.email_verified,
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
      };
      
      dispatch({ type: 'SET_USER', payload: { user: frontendUser, token: response.access } });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Convert frontend format to backend format
      const backendData = {
        name: data.name,
        email: data.email,
        password: data.password,
        confirm_password: data.password, // Backend expects confirm_password
        phone_no: data.phone,
        role: data.role,
        address: '',
      };
      
      await authService.register(backendData);
      
      // After successful registration, show message and redirect to login
      // Don't automatically log in - user needs to verify email first
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
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
    }
  };

  const refreshToken = async () => {
    try {
      const { access } = await authService.refreshToken();
      dispatch({ type: 'SET_TOKEN', payload: access });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};