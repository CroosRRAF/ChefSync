import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Configure axios defaults for Django CSRF/cookies in dev
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
            }/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API functions
export const apiClient = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((response) => response.data),

  // POST request
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    api.post(url, data, config).then((response) => response.data),

  // PUT request
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => api.put(url, data, config).then((response) => response.data),

  // PATCH request
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> =>
    api.patch(url, data, config).then((response) => response.data),

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((response) => response.data),
};

// Specific API functions for authentication
export const authAPI = {
  // Login
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<{ access: string; refresh: string; user: any }>(
      "/auth/login/",
      credentials
    ),

  // Register
  register: (userData: {
    name: string;
    email: string;
    phone_no: string;
    password: string;
    confirm_password: string;
    role: string;
    address?: string;
  }) => apiClient.post("/auth/register/", userData),

  // Verify email
  verifyEmail: (token: string) =>
    apiClient.post("/auth/verify-email/", { token }),

  // Request password reset
  requestPasswordReset: (email: string) =>
    apiClient.post("/auth/password/reset/", { email }),

  // Confirm password reset
  confirmPasswordReset: (token: string, newPassword: string) =>
    apiClient.post("/auth/password/reset/confirm/", {
      token,
      new_password: newPassword,
    }),

  // Google OAuth
  googleOAuth: (idToken: string) =>
    apiClient.post("/auth/google/login/", { id_token: idToken }),

  // Get user profile
  getProfile: () => apiClient.get("/auth/profile/"),

  // Update profile
  updateProfile: (updates: any) => apiClient.patch("/auth/profile/", updates),

  // Change password
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/auth/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  // Refresh token
  refreshToken: (refreshToken: string) =>
    apiClient.post("/auth/refresh/", { refresh: refreshToken }),
};

// Specific API functions for orders
export const orderAPI = {
  // Get all orders (for admin/cook/delivery)
  getAllOrders: () => apiClient.get("/orders/"),

  // Get user orders (for customer)
  getUserOrders: () => apiClient.get("/orders/my-orders/"),

  // Create new order
  createOrder: (orderData: any) => apiClient.post("/orders/", orderData),

  // Get order by ID
  getOrder: (orderId: string) => apiClient.get(`/orders/${orderId}/`),

  // Update order status
  updateOrderStatus: (orderId: string, status: string) =>
    apiClient.patch(`/orders/${orderId}/`, { status }),

  // Assign cook to order
  assignCook: (orderId: string, cookId: string) =>
    apiClient.patch(`/orders/${orderId}/`, { assigned_cook_id: cookId }),

  // Assign delivery agent to order
  assignDeliveryAgent: (orderId: string, agentId: string) =>
    apiClient.patch(`/orders/${orderId}/`, {
      assigned_delivery_agent_id: agentId,
    }),
};

export default apiClient;
