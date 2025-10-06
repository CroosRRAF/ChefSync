import axios from "axios";

// Extend axios config to include metadata
declare module "axios" {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ✅ Create axios instance with performance optimizations
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  // Enable request/response compression
  decompress: true,
});
// Request cache for GET requests
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ✅ Attach token automatically and add performance monitoring
apiClient.interceptors.request.use((config) => {
  const access_token = localStorage.getItem("access_token");
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }

  // Add performance monitoring
  config.metadata = { startTime: Date.now() };

  // Skip caching for dashboard endpoints (they need real-time data)
  if (config.url?.includes("/dashboard/")) {
    return config;
  }

  // Check cache for GET requests
  if (config.method === "get") {
    const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
    const cached = requestCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Return cached response
      return Promise.reject({
        isCached: true,
        data: cached.data,
        config,
      });
    }
  }

  return config;
});

// Response interceptor to handle common errors and caching
apiClient.interceptors.response.use(
  (response) => {
    // Skip caching for dashboard endpoints
    if (
      response.config.method === "get" &&
      !response.config.url?.includes("/dashboard/")
    ) {
      const cacheKey = `${response.config.url}?${JSON.stringify(
        response.config.params || {}
      )}`;
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    // Performance monitoring
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      if (duration > 2000) {
        console.warn(
          `Slow API response: ${response.config.url} took ${duration}ms`
        );
      }
    }

    return response;
  },
  (error) => {
    // Handle cached responses
    if (error.isCached) {
      return Promise.resolve({ data: error.data, config: error.config });
    }

    // Performance monitoring for errors
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      console.error(`API error after ${duration}ms:`, error.message);
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Cache management utilities
export const clearApiCache = () => {
  requestCache.clear();
};

export const getCacheStats = () => {
  return {
    size: requestCache.size,
    entries: Array.from(requestCache.keys()),
  };
};

export default apiClient;
