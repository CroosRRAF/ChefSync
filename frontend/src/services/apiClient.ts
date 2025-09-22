import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';
// ✅ Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
// ✅ Attach token automatically
apiClient.interceptors.request.use((config) => {
  const chefsync_token = localStorage.getItem('chefsync_token');
  if (chefsync_token) {
    config.headers.Authorization = `Bearer ${chefsync_token}`;
  }
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
