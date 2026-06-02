import axios from 'axios';

const defaultApiUrl = import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000/api'
  : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
});

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('fb_token');
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Something went wrong';

      if (status === 401) {
        localStorage.removeItem('fb_token');
        localStorage.removeItem('fb_user');
        delete api.defaults.headers.common.Authorization;
        window.location.href = '/login';
      }

      return Promise.reject({
        ...error,
        message,
      });
    }
  );
}

export default api;
