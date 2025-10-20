import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// ✅ Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Attach token automatically
apiClient.interceptors.request.use((config) => {
  const access_token = localStorage.getItem('access_token');
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
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
