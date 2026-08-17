import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor to add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cto_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 unauth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('cto_token');
        localStorage.removeItem('cto_role');
        // Redirect to login page after clearing auth data
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
