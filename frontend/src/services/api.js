import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Restore token from storage on first load
const stored = JSON.parse(localStorage.getItem('spring-revival-auth') || '{}');
if (stored?.state?.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.state.token}`;
}

// Response interceptor — show toast on 4xx/5xx
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong';

    if (err.response?.status === 401) {
      // Clear stale auth and redirect
      localStorage.removeItem('spring-revival-auth');
      delete api.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (err.response?.status >= 500) {
      toast.error(`Server error: ${msg}`);
    }

    return Promise.reject(err);
  }
);

export default api;
