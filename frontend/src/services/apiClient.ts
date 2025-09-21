import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';
// ✅ Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
// ✅ Attach token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('chefsync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default apiClient;