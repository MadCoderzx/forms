import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('fb_token');
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export default api;
