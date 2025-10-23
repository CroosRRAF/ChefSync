import axios, { AxiosError } from 'axios';

// Get API base URL with fallback
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // In development, use proxy to avoid CORS issues
  if (import.meta.env.DEV) {
    return envUrl || '/api';
  }
  
  // In production, use configured URL or default to /api
  return envUrl || '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the configured base URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Client Configuration:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    API_BASE_URL,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV
  });
}

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// ✅ Create axios instance with better configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token and add retry logic
apiClient.interceptors.request.use(
  (config) => {
    const access_token = localStorage.getItem('access_token');
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track refresh token request to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor with better error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle network errors
    if (!error.response) {
      console.error('Network error - server may be unreachable');
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.',
        originalError: error
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('chefsync_refresh_token');

      if (!refreshToken) {
        // No refresh token, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('chefsync_refresh_token');
        
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('chefsync_refresh_token');

        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Cache management functions
export const getCacheStats = () => {
  // Clean expired entries
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      apiCache.delete(key);
    }
  }
  
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
  };
};

export const clearApiCache = () => {
  apiCache.clear();
};

// Enhanced API client with caching
const createCachedRequest = (method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any, options?: any) => {
  const cacheKey = `${method}:${url}:${JSON.stringify(data || {})}`;
  const now = Date.now();
  
  // Check cache for GET requests
  if (method === 'get' && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey)!;
    if (now - cached.timestamp < cached.ttl) {
      return Promise.resolve({ data: cached.data });
    } else {
      apiCache.delete(cacheKey);
    }
  }
  
  // Make the actual request
  return apiClient[method](url, data, options).then(response => {
    // Cache successful GET responses
    if (method === 'get' && response.status === 200) {
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: now,
        ttl: 5 * 60 * 1000, // 5 minutes TTL
      });
    }
    return response;
  });
};

// Export cached methods
export const cachedApiClient = {
  get: (url: string, options?: any) => createCachedRequest('get', url, undefined, options),
  post: (url: string, data?: any, options?: any) => createCachedRequest('post', url, data, options),
  put: (url: string, data?: any, options?: any) => createCachedRequest('put', url, data, options),
  delete: (url: string, options?: any) => createCachedRequest('delete', url, undefined, options),
};

export default apiClient;
