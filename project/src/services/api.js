import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Send cookies with every request
});

// Request interceptor: token is now sent via httpOnly cookie automatically
api.interceptors.request.use(
  (config) => {
    // No need to manually attach Authorization header — cookie is sent by withCredentials
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (expired/invalid token) and 403 (forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Skip redirect for login/register so those pages can show their own errors
      if (url.includes("/auth/login") || url.includes("/auth/register")) {
        return Promise.reject(error);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userName');
      window.location.href = '/login?reason=unauthorized';
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.warn('[API] Access Denied (403):', error.response.data?.message);
      // Components can now catch this and show proper error
      error.message = error.response.data?.message || 'You do not have permission to perform this action';
    }
    return Promise.reject(error);
  }
);

export default api;
